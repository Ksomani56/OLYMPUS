"""Train local fraud risk baselines with data checks, SHAP, and anomaly scores.

Examples:
    python train_risk_models.py paysim
    python train_risk_models.py insurance --max-rows 1000000

Requires requirements-ml.txt. SHAP/XGBoost run locally and need no AI API.
PaySim uses its supplied test CSV for final evaluation. Insurance uses a
policy-grouped holdout because no separate test file is present.
"""

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (average_precision_score, brier_score_loss, f1_score,
                             log_loss, precision_score, recall_score, roc_auc_score)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier


ROOT = Path(__file__).parent
TARGETS = {"paysim": "isFraud", "insurance": "is_fraud_flagged_ground_truth"}
PAYSIM_REQUIRED = ["step", "type", "amount", "oldbalanceOrg", "oldbalanceDest", "isFraud"]
INSURANCE_REQUIRED = ["claim_type", "state", "policyholder_tenure_years",
                      "previous_claims_count", "incident_date", "claim_filed_date",
                      "claim_amount", "deductible", "is_fraud_flagged_ground_truth"]


def sample_paysim(path_list, max_rows):
    """Read PaySim CSVs in chunks, randomly sampling without loading all rows."""
    parts = []
    source_rows = 0
    source_fraud = 0
    # Retain every positive row, then take a reproducible random sample of
    # negatives. This protects the rare fraud examples from being discarded
    # by ordinary random sampling. Inverse sampling weights preserve source prevalence.
    sample_fraction = min(1.0, max_rows / 5_700_000)
    for path in path_list:
        for index, chunk in enumerate(pd.read_csv(path, chunksize=250_000, low_memory=False)):
            source_rows += len(chunk)
            source_fraud += int(chunk["isFraud"].sum())
            positives = chunk.loc[chunk["isFraud"].astype(int) == 1]
            negatives = chunk.loc[chunk["isFraud"].astype(int) == 0]
            if len(positives):
                parts.append(positives)
            if sample_fraction < 1:
                negatives = negatives.sample(frac=sample_fraction, random_state=42 + index)
            if len(negatives):
                parts.append(negatives)
    if not parts:
        raise ValueError("No PaySim training rows were read")
    data = pd.concat(parts, ignore_index=True)
    fraud = data.loc[data["isFraud"].astype(int) == 1]
    safe = data.loc[data["isFraud"].astype(int) == 0]
    if len(fraud) >= max_rows:
        raise ValueError("--max-rows is too small to retain all PaySim fraud examples")
    safe_budget = max_rows - len(fraud)
    if len(safe) > safe_budget:
        safe = safe.sample(n=safe_budget, random_state=42)
    data = pd.concat([fraud, safe], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    negative_weight = (source_rows - source_fraud) / max(len(safe), 1)
    source_fraud_rate = source_fraud / max(source_rows, 1)
    return data, negative_weight, source_fraud_rate


def paysim_features(data):
    missing = sorted(set(PAYSIM_REQUIRED) - set(data.columns))
    if missing:
        raise ValueError(f"PaySim is missing required columns: {missing}")
    y = pd.to_numeric(data["isFraud"], errors="coerce")
    if y.isna().any() or not set(y.unique()).issubset({0, 1}):
        raise ValueError("PaySim isFraud contains missing or non-binary values")
    for col in ["step", "amount", "oldbalanceOrg", "oldbalanceDest"]:
        data[col] = pd.to_numeric(data[col], errors="coerce")
    bad_amount = data["amount"].lt(0).sum()
    if bad_amount:
        raise ValueError(f"PaySim has {int(bad_amount):,} negative transaction amounts; inspect source data")

    # Use fields available before a transaction is completed. Post-transaction
    # balances are excluded to prevent temporal leakage. Never feed labels,
    # rule flags, account IDs, or BankID to the predictor.
    x = data[["step", "type", "amount", "oldbalanceOrg", "oldbalanceDest"]].copy()
    if x.isna().any().any():
        raise ValueError("PaySim model input fields contain missing/invalid values; inspect the CSV before training")
    numeric = x.select_dtypes(include=[np.number]).to_numpy(dtype=float)
    if not np.isfinite(numeric).all():
        raise ValueError("PaySim model input contains infinite values")
    x["amount_log"] = np.log1p(x["amount"].clip(lower=0))
    x["amount_to_origin_balance"] = x["amount"] / (x["oldbalanceOrg"].abs() + 1.0)
    return x, y.astype("int8")


def load_insurance(max_rows):
    path = ROOT / "datasets" / "insuranceclaims" / "insurance_claims_100M.csv"
    if not path.is_file():
        raise FileNotFoundError(f"Insurance CSV not found: {path}")
    chunks, sampled = [], 0
    for index, chunk in enumerate(pd.read_csv(path, chunksize=500_000, low_memory=False)):
        remaining = max_rows - sampled
        if remaining <= 0:
            break
        # The provided audit found 100M rows. Sample proportionally from the
        # whole file (including later chunks), not just its opening records.
        take = min(remaining, max(1, round(len(chunk) * max_rows / 100_000_000)))
        if len(chunk) > take:
            chunk = chunk.sample(n=take, random_state=42 + index)
        chunks.append(chunk)
        sampled += len(chunk)
        print(f"Sampled {sampled:,} insurance claims", end="\r")
    if not chunks:
        raise ValueError("No insurance claims were read")
    data = pd.concat(chunks, ignore_index=True)
    missing = sorted(set(INSURANCE_REQUIRED) - set(data.columns))
    if missing:
        raise ValueError(f"Insurance data is missing required columns: {missing}")
    y = data[TARGETS["insurance"]]
    if y.isna().any() or not set(y.unique()).issubset({True, False, 0, 1}):
        raise ValueError("Insurance fraud target contains missing or non-binary values")
    for col in ["claim_amount", "deductible", "policyholder_tenure_years", "previous_claims_count"]:
        data[col] = pd.to_numeric(data[col], errors="coerce")
        if data[col].isna().any():
            raise ValueError(f"Insurance feature {col} contains non-numeric/missing values")
        if data[col].lt(0).any():
            raise ValueError(f"Insurance feature {col} contains negative values; inspect source data")
        if not np.isfinite(data[col].to_numpy(dtype=float)).all():
            raise ValueError(f"Insurance feature {col} contains infinite values")

    incident = pd.to_datetime(data["incident_date"], errors="coerce")
    filed = pd.to_datetime(data["claim_filed_date"], errors="coerce")
    if incident.isna().any() or filed.isna().any():
        raise ValueError("Insurance incident/filed dates contain invalid or missing values")
    data["filing_delay_days"] = (filed - incident).dt.days
    data["claim_to_deductible_ratio"] = data["claim_amount"] / (data["deductible"] + 1.0)
    data["claim_amount_log"] = np.log1p(data["claim_amount"])
    # Exclude claim_status and days_to_resolution: the audit description says
    # they may only be known after intake and would leak future information.
    x = data[["claim_type", "state", "policyholder_tenure_years", "previous_claims_count",
              "claim_amount", "deductible", "filing_delay_days",
              "claim_to_deductible_ratio", "claim_amount_log"]].copy()
    if x.isna().any().any():
        raise ValueError("Insurance model input fields contain missing/invalid values")
    return x, y.astype("int8"), data


def encode_pair(train_x, *eval_sets):
    categorical = list(train_x.select_dtypes(include=["object", "string", "category"]).columns)
    encoded_train = pd.get_dummies(train_x, columns=categorical, dummy_na=True, dtype=np.uint8)
    encoded_train = encoded_train.replace([np.inf, -np.inf], np.nan).fillna(0)
    outputs = [encoded_train.reset_index(drop=True)]
    # Learn the category vocabulary on fit rows only. Unseen categories in
    # other splits map to zero indicator columns.
    for eval_x in eval_sets:
        encoded_eval = pd.get_dummies(eval_x, columns=categorical, dummy_na=True, dtype=np.uint8)
        encoded_eval = encoded_eval.reindex(columns=encoded_train.columns, fill_value=0)
        encoded_eval = encoded_eval.replace([np.inf, -np.inf], np.nan).fillna(0)
        outputs.append(encoded_eval.reset_index(drop=True))
    return outputs


def train_candidate(x_train, y_train, w_train, x_valid, y_valid, w_valid, params):
    model = XGBClassifier(
        n_estimators=params["n_estimators"], max_depth=params["max_depth"],
        learning_rate=params["learning_rate"], min_child_weight=params["min_child_weight"],
        subsample=0.85, colsample_bytree=0.85, reg_lambda=2.0,
        objective="binary:logistic", eval_metric="aucpr", scale_pos_weight=1.0,
        tree_method="hist", n_jobs=-1, random_state=42,
    )
    model.fit(x_train, y_train, sample_weight=w_train,
              eval_set=[(x_valid, y_valid)], verbose=False)
    pred = model.predict_proba(x_valid)[:, 1]
    return model, float(average_precision_score(y_valid, pred, sample_weight=w_valid))


def grouped_partitions(groups, size):
    """Return fit/tune/calibration/threshold indices with entities kept separate."""
    indices = np.arange(size)
    groups = np.asarray(groups)
    fit_idx, rest_idx = next(GroupShuffleSplit(n_splits=1, test_size=0.4,
                                               random_state=42).split(indices, groups=groups))
    tune_rel, remainder_rel = next(GroupShuffleSplit(n_splits=1, test_size=0.5,
                                                     random_state=43).split(rest_idx, groups=groups[rest_idx]))
    remainder_idx = rest_idx[remainder_rel]
    tune_idx = rest_idx[tune_rel]
    cal_rel, threshold_rel = next(GroupShuffleSplit(n_splits=1, test_size=0.5,
                                                     random_state=44).split(remainder_idx,
                                                                            groups=groups[remainder_idx]))
    return fit_idx, tune_idx, remainder_idx[cal_rel], remainder_idx[threshold_rel]


def calibrated_probability(model, calibrator, features):
    raw = np.clip(model.predict_proba(features)[:, 1], 1e-6, 1 - 1e-6)
    logits = np.log(raw / (1 - raw)).reshape(-1, 1)
    return calibrator.predict_proba(logits)[:, 1]


def main():
    parser = argparse.ArgumentParser(description="Train a validated fraud-risk model with SHAP and anomaly scoring")
    parser.add_argument("dataset", choices=["paysim", "insurance"])
    parser.add_argument("--max-rows", type=int, default=None,
                        help="Training sample cap (default: all PaySim training rows; 1,000,000 Insurance claims)")
    args = parser.parse_args()
    if args.max_rows is None:
        args.max_rows = 6_000_000 if args.dataset == "paysim" else 1_000_000
    if args.max_rows < 100:
        parser.error("--max-rows must be at least 100")

    print(f"Loading {args.dataset} (maximum sample {args.max_rows:,})...")
    if args.dataset == "paysim":
        base = ROOT / "datasets" / "paysim"
        train_paths = sorted(base.glob("train-*.csv"))
        test_path = base / "test-00000-of-00001.csv"
        if not train_paths or not test_path.is_file():
            raise FileNotFoundError("Expected PaySim train-*.csv and test-00000-of-00001.csv in datasets/paysim")
        train_raw, negative_weight, source_fraud_rate = sample_paysim(train_paths, args.max_rows)
        test_raw = pd.read_csv(test_path, low_memory=False)
        if "nameOrig" not in train_raw:
            raise ValueError("PaySim nameOrig is required to keep account histories in one split")
        train_groups = train_raw["nameOrig"].astype("string").reset_index(drop=True)
        train_x, train_y = paysim_features(train_raw)
        test_x, test_y = paysim_features(test_raw)
        train_weights = np.where(train_y.to_numpy() == 0, negative_weight, 1.0)
        split_note = "Official PaySim test CSV held out in full; training sample drawn only from train shards."
    else:
        train_x, train_y, insurance_raw = load_insurance(args.max_rows)
        if insurance_raw["policy_id"].isna().any():
            raise ValueError("Insurance policy_id has missing values; cannot safely group claims for splitting")
        train_groups = insurance_raw["policy_id"].astype("string").reset_index(drop=True)
        train_indices, test_indices = next(GroupShuffleSplit(
            n_splits=1, test_size=0.2, random_state=42
        ).split(train_x, train_y, groups=train_groups))
        test_x = train_x.iloc[test_indices].reset_index(drop=True)
        test_y = train_y.iloc[test_indices].reset_index(drop=True)
        train_x = train_x.iloc[train_indices].reset_index(drop=True)
        train_y = train_y.iloc[train_indices].reset_index(drop=True)
        train_groups = train_groups.iloc[train_indices].reset_index(drop=True)
        train_weights = np.ones(len(train_y), dtype=float)
        source_fraud_rate = float(train_y.mean())
        split_note = "Insurance uses a policy-grouped 80/20 split of the sampled data; no official test file was present."

    if train_y.nunique() < 2 or test_y.nunique() < 2:
        raise ValueError("Training and evaluation data must each contain both target classes")
    train_y = train_y.reset_index(drop=True)
    test_y = test_y.reset_index(drop=True)
    train_groups = train_groups.reset_index(drop=True)
    fit_idx, tune_idx, calibration_idx, threshold_idx = grouped_partitions(train_groups, len(train_y))
    x_fit_raw = train_x.iloc[fit_idx]
    x_tune_raw = train_x.iloc[tune_idx]
    x_cal_raw = train_x.iloc[calibration_idx]
    x_threshold_raw = train_x.iloc[threshold_idx]
    x_fit, x_tune, x_cal, x_threshold, x_test = encode_pair(
        x_fit_raw, x_tune_raw, x_cal_raw, x_threshold_raw, test_x
    )
    y_fit, w_fit = train_y.iloc[fit_idx], train_weights[fit_idx]
    y_tune, w_tune = train_y.iloc[tune_idx], train_weights[tune_idx]
    y_cal, w_cal = train_y.iloc[calibration_idx], train_weights[calibration_idx]
    y_threshold, w_threshold = train_y.iloc[threshold_idx], train_weights[threshold_idx]
    y_fit = y_fit.reset_index(drop=True)
    y_tune = y_tune.reset_index(drop=True)
    y_cal = y_cal.reset_index(drop=True)
    y_threshold = y_threshold.reset_index(drop=True)
    for split_name, split_y in [("fit", y_fit), ("tuning", y_tune), ("calibration", y_cal),
                                ("threshold", y_threshold), ("test", test_y)]:
        if split_y.nunique() < 2:
            raise ValueError(f"{split_name} split does not contain both classes; increase --max-rows or adjust groups")

    # Small, explicit validation search. Choose PR-AUC because fraud is rare;
    # never choose settings using calibration, threshold, or final test groups.
    candidates = [
        {"n_estimators": 300, "max_depth": 5, "learning_rate": 0.05, "min_child_weight": 5},
        {"n_estimators": 400, "max_depth": 6, "learning_rate": 0.05, "min_child_weight": 5},
        {"n_estimators": 500, "max_depth": 7, "learning_rate": 0.03, "min_child_weight": 10},
    ]
    best_model, best_params, best_pr = None, None, -1.0
    for number, params in enumerate(candidates, start=1):
        print(f"Tuning candidate {number}/{len(candidates)}: {params}")
        candidate, score = train_candidate(x_fit, y_fit, w_fit, x_tune, y_tune, w_tune, params)
        print(f"  tuning PR-AUC: {score:.6f}")
        if score > best_pr:
            best_model, best_params, best_pr = candidate, params, score

    # Refit the selected configuration on fit+tuning groups (80%). Calibration,
    # threshold selection, and final test groups remain untouched.
    params = best_params
    final_fit_x = pd.concat([x_fit, x_tune], ignore_index=True)
    final_fit_y = pd.concat([y_fit, y_tune], ignore_index=True)
    final_fit_weights = np.concatenate([w_fit, w_tune])
    model = XGBClassifier(
        n_estimators=params["n_estimators"], max_depth=params["max_depth"],
        learning_rate=params["learning_rate"], min_child_weight=params["min_child_weight"],
        subsample=0.85, colsample_bytree=0.85, reg_lambda=2.0,
        objective="binary:logistic", eval_metric="aucpr", scale_pos_weight=1.0,
        tree_method="hist", n_jobs=-1, random_state=42,
    )
    print(f"Final fit on {len(final_fit_y):,} rows (fit + tuning groups)...")
    model.fit(final_fit_x, final_fit_y, sample_weight=final_fit_weights, verbose=False)
    raw_cal_prob = np.clip(model.predict_proba(x_cal)[:, 1], 1e-6, 1 - 1e-6)
    calibrator = LogisticRegression(solver="lbfgs", max_iter=1000)
    calibrator.fit(np.log(raw_cal_prob / (1 - raw_cal_prob)).reshape(-1, 1), y_cal,
                   sample_weight=w_cal)
    threshold_probs = calibrated_probability(model, calibrator, x_threshold)
    thresholds = np.unique(np.r_[0.0, np.quantile(threshold_probs, np.linspace(0, 1, 201)), 1.0])
    threshold = float(max(thresholds, key=lambda t: (
        f1_score(y_threshold, threshold_probs >= t, sample_weight=w_threshold, zero_division=0),
        precision_score(y_threshold, threshold_probs >= t, sample_weight=w_threshold, zero_division=0))))
    probabilities = calibrated_probability(model, calibrator, x_test)
    predicted = probabilities >= threshold
    metrics = {
        "rows_fit": int(len(y_fit)), "rows_tuning": int(len(y_tune)),
        "rows_final_model_fit": int(len(final_fit_y)),
        "rows_calibration": int(len(y_cal)), "rows_threshold": int(len(y_threshold)),
        "rows_test": int(len(test_y)),
        "train_fraud_rate": float(train_y.mean()), "source_train_fraud_rate": float(source_fraud_rate),
        "test_fraud_rate": float(test_y.mean()),
        "roc_auc": float(roc_auc_score(test_y, probabilities)),
        "pr_auc": float(average_precision_score(test_y, probabilities)),
        "log_loss": float(log_loss(test_y, probabilities)),
        "brier_score": float(brier_score_loss(test_y, probabilities)),
        "threshold_selected_on_threshold_split": threshold,
        "precision_at_threshold": float(precision_score(test_y, predicted, zero_division=0)),
        "recall_at_threshold": float(recall_score(test_y, predicted, zero_division=0)),
        "f1_at_threshold": float(f1_score(test_y, predicted, zero_division=0)),
        "true_positives": int(((predicted == 1) & (test_y.to_numpy() == 1)).sum()),
        "false_positives": int(((predicted == 1) & (test_y.to_numpy() == 0)).sum()),
        "false_negatives": int(((predicted == 0) & (test_y.to_numpy() == 1)).sum()),
        "tuning_pr_auc_best_candidate": best_pr,
        "selected_parameters": best_params,
        "split": split_note,
    }

    # Secondary anomaly model learns the normal class only. Its score is a
    # separate unusualness signal, not a second fraud probability.
    normal_x = final_fit_x.loc[final_fit_y == 0]
    if len(normal_x) > 100_000:
        normal_x = normal_x.sample(n=100_000, random_state=42)
    anomaly_model = IsolationForest(n_estimators=200, contamination="auto",
                                    random_state=42, n_jobs=-1).fit(normal_x)
    normal_reference = np.sort(anomaly_model.decision_function(normal_x))

    out = ROOT / "artifacts" / args.dataset
    out.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "calibrator": calibrator, "decision_threshold": threshold,
                 "anomaly_model": anomaly_model,
                 "feature_columns": list(x_fit.columns), "target": TARGETS[args.dataset],
                 "anomaly_reference_scores": normal_reference}, out / "model.joblib")
    (out / "metrics.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    explain = x_test.sample(n=min(500, len(x_test)), random_state=42)
    shap_values = shap.TreeExplainer(model)(explain)
    importance = pd.DataFrame({"feature": x_fit.columns,
                               "mean_abs_shap": np.abs(shap_values.values).mean(axis=0)})
    importance.sort_values("mean_abs_shap", ascending=False).to_csv(out / "shap_importance.csv", index=False)

    explain_prob = calibrated_probability(model, calibrator, explain)
    explain_anomaly = anomaly_model.decision_function(explain)
    anomaly_scores = 1.0 - np.searchsorted(normal_reference, explain_anomaly, side="right") / len(normal_reference)
    objects = []
    for i in range(len(explain)):
        contributions = shap_values.values[i]
        top = np.argsort(np.abs(contributions))[::-1][:5]
        factors = [{"feature": str(x_fit.columns[j]), "shap_log_odds_impact": float(contributions[j]),
                    "direction": "increases_risk" if contributions[j] > 0 else "decreases_risk"}
                   for j in top]
        objects.append({"dataset": args.dataset, "fraud_probability": float(explain_prob[i]),
                        "risk_score": round(float(explain_prob[i] * 100), 2),
                        "review_threshold": threshold,
                        "review_priority": "elevated" if explain_prob[i] >= threshold else "standard",
                        "anomaly_score": float(anomaly_scores[i]), "risk_factors": factors})
    (out / "sample_risk_output.json").write_text(json.dumps(objects, indent=2), encoding="utf-8")
    report = {
        "model_name": f"{args.dataset}_fraud_risk_model",
        "target": TARGETS[args.dataset],
        "metrics": metrics,
        "risk_output_fields": ["fraud_probability", "risk_score", "anomaly_score", "risk_factors"],
        "risk_output_explanation": "fraud_probability is calibrated with a held-out logistic calibration split; anomaly_score measures unusualness relative to normal fit rows; risk_factors are top SHAP contributions in the base model log-odds.",
        "probability_calibration": "Platt/logistic calibration fitted on a group-disjoint calibration split.",
        "global_top_shap_features": importance.sort_values("mean_abs_shap", ascending=False).head(20).to_dict(orient="records"),
        "risk_objects_in_sample_file": len(objects),
        "limitations": ["A model cannot guarantee zero false positives or false negatives.",
                        "Anomaly score is not a fraud probability.",
                        "Threshold must be selected for operational review costs before deployment."],
    }
    (out / "risk_assessment.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    print("\n=== Final evaluation ===")
    print(json.dumps(metrics, indent=2))
    print(f"Saved model, metrics, SHAP importance, sample risk objects, and complete assessment JSON under: {out}")
    print("\n=== Training design used ===")
    print(f"Dataset: {args.dataset}; target: {TARGETS[args.dataset]}")
    print(f"Split: {split_note}")
    print("Sampling: PaySim keeps every fraud row, samples safe rows, and weights sampled safe rows back to their source frequency; Insurance samples across CSV chunks.")
    if args.dataset == "paysim":
        print("PaySim features: step/type, amount and log amount, pre-transaction origin/destination balances, amount-to-origin-balance ratio.")
        print("PaySim exclusions: post-transaction newbalanceOrig/newbalanceDest (temporal leakage), isFlaggedFraud (rule-based signal), nameOrig/nameDest (IDs), BankID (institution identifier), and isFraud (target).")
        print("PaySim audit context: training fraud prevalence differs by shard and BankID; test is evaluated from the supplied official test CSV.")
    else:
        print("Insurance features: claim type/state, tenure, previous claims, claim amount/deductible, filing delay and derived ratios/log amount.")
        print("Insurance exclusions: claim_status and days_to_resolution (post-intake leakage), claim_id/policy_id (IDs), and target.")
        print("Insurance audit context: 100M rows, about 7.66% fraud, and days_to_resolution missing on about 8.15%; that column is excluded.")
    if args.dataset == "insurance":
        print("Splitting: policy groups are kept separate across test, fit, tuning, calibration, and threshold selection.")
    else:
        print("Splitting: origin-account groups are kept separate across fit, tuning, calibration, and threshold selection; the official test file is held out by source split.")
    print("Model selection: three XGBoost configurations compared on tuning PR-AUC; final model refit uses fit+tuning groups; calibration and test groups are separate.")
    print("Probability calibration: logistic/Platt calibration is fit on a separate calibration split; test metrics use calibrated scores.")
    print("Imbalance handling: PaySim safe-row inverse-sampling weights preserve source prevalence; threshold/model selection uses weighted validation PR-AUC/F1. Metrics include PR-AUC, recall, precision, F1, ROC-AUC, log loss and Brier score.")
    print("Decision threshold: chosen on a separate threshold split to maximize weighted F1; tune to operational costs before deployment.")
    print("Anomaly: Isolation Forest fits normal training examples; anomaly_score is unusualness, not fraud probability.")
    print("XAI: TreeSHAP local explanation sample plus global mean absolute SHAP importances; impacts are in model log-odds.")
    print("Data safeguards: required fields and binary labels checked; missing/non-finite model inputs and negative amounts/claim values rejected; post-outcome PaySim balances excluded; no automatic deletion of valid extreme values.")
    print("Limits: this is centralized baseline training, not federated aggregation; no system can guarantee zero errors/anomalies.")


if __name__ == "__main__":
    main()
