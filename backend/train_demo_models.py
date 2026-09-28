import os
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, IsolationForest

ROOT = Path(__file__).parent
paysim_dir = ROOT / "artifacts" / "paysim"
ins_dir = ROOT / "artifacts" / "insurance"
paysim_dir.mkdir(parents=True, exist_ok=True)
ins_dir.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------
# 1. TRAIN PAYSIM FRAUD MODEL
# -------------------------------------------------------------
np.random.seed(42)
n_samples = 2000

types = ['TRANSFER', 'CASH_OUT', 'PAYMENT', 'CASH_IN', 'DEBIT']
sample_types = np.random.choice(types, size=n_samples, p=[0.25, 0.30, 0.25, 0.15, 0.05])
steps = np.random.randint(1, 744, size=n_samples)
amounts = np.random.exponential(scale=15000, size=n_samples)
old_orgs = amounts * np.random.uniform(0.5, 3.0, size=n_samples)
old_dests = np.random.choice([0, 5000, 25000, 100000], size=n_samples, p=[0.4, 0.2, 0.2, 0.2])

drain_ratios = np.where(old_orgs > 0, amounts / old_orgs, 0.0)
is_dest_zeros = (old_dests == 0).astype(int)

# Target: PaySim empirical fraud distribution
labels = []
for i in range(n_samples):
    t = sample_types[i]
    dr = drain_ratios[i]
    dz = is_dest_zeros[i]
    amt = amounts[i]
    is_fraud = 0
    if t in ['TRANSFER', 'CASH_OUT']:
        if dr > 0.85 and dz == 1 and amt > 2000:
            is_fraud = 1 if np.random.rand() < 0.96 else 0
        elif dr > 0.80 or (dz == 1 and amt > 10000):
            is_fraud = 1 if np.random.rand() < 0.70 else 0
        elif amt > 50000:
            is_fraud = 1 if np.random.rand() < 0.40 else 0
    labels.append(is_fraud)

df_paysim = pd.DataFrame({
    'step': steps,
    'amount': amounts,
    'oldbalanceOrg': old_orgs,
    'oldbalanceDest': old_dests,
    'drain_ratio': drain_ratios,
    'is_dest_zero': is_dest_zeros,
    'type': sample_types
})
df_encoded = pd.get_dummies(df_paysim, columns=['type'], dtype=np.uint8)

# Ensure all 5 type columns exist
for t in types:
    col = f"type_{t}"
    if col not in df_encoded.columns:
        df_encoded[col] = 0

feature_cols = [
    'step', 'amount', 'oldbalanceOrg', 'oldbalanceDest', 'drain_ratio', 'is_dest_zero',
    'type_CASH_IN', 'type_CASH_OUT', 'type_DEBIT', 'type_PAYMENT', 'type_TRANSFER'
]
X_paysim = df_encoded[feature_cols]
y_paysim = np.array(labels)

rf_paysim = RandomForestClassifier(n_estimators=50, max_depth=6, random_state=42)
rf_paysim.fit(X_paysim, y_paysim)

iso_paysim = IsolationForest(n_estimators=30, random_state=42)
iso_paysim.fit(X_paysim[y_paysim == 0])
ref_scores_paysim = iso_paysim.decision_function(X_paysim[y_paysim == 0])
ref_scores_paysim.sort()

bundle_paysim = {
    "model": rf_paysim,
    "feature_columns": feature_cols,
    "decision_threshold": 0.40,
    "anomaly_model": iso_paysim,
    "anomaly_reference_scores": ref_scores_paysim.tolist(),
}
joblib.dump(bundle_paysim, paysim_dir / "model.joblib")
print(f"Saved PaySim model to {paysim_dir / 'model.joblib'}")

# -------------------------------------------------------------
# 2. TRAIN INSURANCE MODEL
# -------------------------------------------------------------
claim_types = ["Auto Collision", "Property Water", "Theft", "Injury"]
states = ["NY", "CA", "TX", "FL", "IL"]
ins_samples = 1000

df_ins = pd.DataFrame({
    "claim_type": np.random.choice(claim_types, ins_samples),
    "state": np.random.choice(states, ins_samples),
    "policyholder_tenure_years": np.random.uniform(0.5, 15.0, ins_samples),
    "previous_claims_count": np.random.poisson(0.8, ins_samples),
    "claim_amount": np.random.exponential(12000, ins_samples),
    "deductible": np.random.choice([250, 500, 1000, 2500], ins_samples),
    "filing_delay_days": np.random.randint(0, 45, ins_samples),
})
df_ins["claim_to_deductible_ratio"] = df_ins["claim_amount"] / (df_ins["deductible"] + 1.0)
df_ins["claim_amount_log"] = np.log1p(df_ins["claim_amount"])

ins_categories = ["claim_type", "state"]
df_ins_encoded = pd.get_dummies(df_ins, columns=ins_categories, dummy_na=True, dtype=np.uint8)
ins_feature_cols = list(df_ins_encoded.columns)

y_ins = (
    (df_ins["claim_amount"] > 30000) & (df_ins["policyholder_tenure_years"] < 2) |
    (df_ins["filing_delay_days"] > 30) & (df_ins["previous_claims_count"] > 2)
).astype(int)

rf_ins = RandomForestClassifier(n_estimators=40, max_depth=5, random_state=42)
rf_ins.fit(df_ins_encoded, y_ins)

iso_ins = IsolationForest(n_estimators=30, random_state=42)
iso_ins.fit(df_ins_encoded)
ref_scores_ins = iso_ins.decision_function(df_ins_encoded)
ref_scores_ins.sort()

bundle_ins = {
    "model": rf_ins,
    "feature_columns": ins_feature_cols,
    "decision_threshold": 0.45,
    "anomaly_model": iso_ins,
    "anomaly_reference_scores": ref_scores_ins.tolist(),
}
joblib.dump(bundle_ins, ins_dir / "model.joblib")
print(f"Saved Insurance model to {ins_dir / 'model.joblib'}")
