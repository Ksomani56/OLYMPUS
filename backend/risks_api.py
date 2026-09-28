"""Central backend: UI input -> saved ML model -> Gemini/local explanation -> UI.

Run with: uvicorn risk_api:app --reload (or uvicorn risks_api:app --reload)

The browser must call this backend. Keep GEMINI_API_Key in the server .env,
never in frontend JavaScript. ML output remains authoritative; Gemini explains it.
"""

import json
import os
from pathlib import Path
from typing import Any, Literal

import joblib
import numpy as np
import pandas as pd
import requests
import shap
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from predict_paysim import assess_transaction


ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")

ARTIFACTS_DIR = (ROOT / "artifacts") if (ROOT / "artifacts").exists() else (ROOT.parent / "artifacts")
MODEL_PATHS = {
    "banks": ARTIFACTS_DIR / "paysim" / "model.joblib",
    "creditfraud": ARTIFACTS_DIR / "creditfraud" / "model.joblib",
    "lenders": ARTIFACTS_DIR / "creditfraud" / "model.joblib",
    "insurance": ARTIFACTS_DIR / "insurance" / "model.joblib",
    "insurers": ARTIFACTS_DIR / "insurance" / "model.joblib",
}

GEMINI_MODEL_PREFERENCE = [
    # Proven generation models in priority order
    "gemini-2.5-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
]
_GEMINI_MODELS_CACHE = None

app = FastAPI(title="ENIGMA Risk Inference API", version="1.0.0")
origins = [value.strip() for value in os.getenv(
    "FRONTEND_ORIGINS", "http://localhost:3000,http://localhost:5173"
).split(",") if value.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class AssessRequest(BaseModel):
    domain: Literal["banks", "lenders", "insurers", "creditfraud", "insurance"]
    user_input: dict[str, Any] = Field(..., description="Input values for that domain's trained model")
    include_ai_reasoning: bool = True


def _finite_number(payload, name, minimum=None):
    if name not in payload:
        raise ValueError(f"Missing required field: {name}")
    try:
        value = float(payload[name])
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be numeric") from None
    if not np.isfinite(value):
        raise ValueError(f"{name} must be finite")
    if minimum is not None and value < minimum:
        raise ValueError(f"{name} must be at least {minimum}")
    return value


_INS_BUNDLE = None
_INS_EXPLAINER = None

def get_insurance_bundle():
    global _INS_BUNDLE, _INS_EXPLAINER
    if _INS_BUNDLE is None:
        path = MODEL_PATHS["insurance"]
        if not path.is_file():
            raise FileNotFoundError(f"Insurance model missing: {path}")
        _INS_BUNDLE = joblib.load(path)
        _INS_EXPLAINER = shap.TreeExplainer(_INS_BUNDLE["model"])
    return _INS_BUNDLE, _INS_EXPLAINER


def _insurance_assessment(payload):
    path = MODEL_PATHS["insurance"]
    if not path.is_file():
        raise FileNotFoundError("Insurance model missing; expected artifacts/insurance/model.joblib")
    
    # Defaults provided for testing if not all 8 fields are passed
    claim_type = str(payload.get("claim_type", "home")).strip()
    state = str(payload.get("state", "ID")).strip()
    tenure = float(payload.get("policyholder_tenure_years", 0.2))
    previous = float(payload.get("previous_claims_count", 0))
    amount = float(payload.get("claim_amount", 23607.73))
    deductible = float(payload.get("deductible", 2500.0))
    
    incident = pd.to_datetime(payload.get("incident_date", "2022-08-28"), errors="coerce")
    filed = pd.to_datetime(payload.get("claim_filed_date", "2022-09-03"), errors="coerce")
    filing_delay = int((filed - incident).days) if pd.notna(filed) and pd.notna(incident) else int(payload.get("filing_delay_days", 6))

    features = pd.DataFrame([{
        "claim_type": claim_type,
        "state": state,
        "policyholder_tenure_years": tenure,
        "previous_claims_count": previous,
        "claim_amount": amount,
        "deductible": deductible,
        "filing_delay_days": filing_delay,
        "claim_to_deductible_ratio": amount / (deductible + 1.0),
        "claim_amount_log": float(np.log1p(amount)),
    }])
    
    bundle, explainer = get_insurance_bundle()
    categories = list(features.select_dtypes(include=["object"]).columns)
    encoded = pd.get_dummies(features, columns=categories, dummy_na=True, dtype=np.uint8)
    encoded = encoded.reindex(columns=bundle["feature_columns"], fill_value=0)
    encoded = encoded.replace([np.inf, -np.inf], np.nan).fillna(0)

    raw = float(bundle["model"].predict_proba(encoded)[0, 1])
    if bundle.get("calibrator") is not None:
        clipped = float(np.clip(raw, 1e-6, 1 - 1e-6))
        raw = float(bundle["calibrator"].predict_proba([[np.log(clipped / (1 - clipped))]])[0, 1])
    threshold = float(bundle.get("decision_threshold", 0.1798))
    anomaly_score = None
    if bundle.get("anomaly_model") is not None and bundle.get("anomaly_reference_scores") is not None:
        score = float(bundle["anomaly_model"].decision_function(encoded)[0])
        reference = np.asarray(bundle["anomaly_reference_scores"])
        anomaly_score = float(1.0 - np.searchsorted(reference, score, side="right") / len(reference))

    shap_values = explainer(encoded)
    values = np.asarray(shap_values.values)
    impacts = values[0, :, -1] if values.ndim == 3 else values[0]
    top_indices = np.argsort(np.abs(impacts))[::-1][:5]
    names = list(bundle["feature_columns"])
    factors = [{"feature": names[int(i)], "impact_log_odds": float(impacts[i]),
                "direction": "increases_risk" if impacts[i] > 0 else "decreases_risk"}
               for i in top_indices]
    return {
        "claim_id": payload.get("claim_id", "CLM-INS-9821"),
        "model": {"name": "Insurance Claims Risk Model (1M Policies)", "artifact": "artifacts/insurance/model.joblib"},
        "risk": {"fraud_probability": round(raw, 4), "risk_score": round(raw * 100, 2),
                 "decision_threshold": round(threshold, 4),
                 "classification": "fraud" if raw >= threshold else "safe",
                 "anomaly_score": round(anomaly_score, 4) if anomaly_score is not None else None},
        "risk_factors": factors,
        "interpretation": "Federated Insurance model screening result. Evaluated under differential privacy.",
    }


_CF_BUNDLE = None
_CF_EXPLAINER = None

def get_creditfraud_bundle():
    global _CF_BUNDLE, _CF_EXPLAINER
    if _CF_BUNDLE is None:
        path = MODEL_PATHS["creditfraud"]
        if not path.is_file():
            raise FileNotFoundError(f"CreditFraud model missing: {path}")
        _CF_BUNDLE = joblib.load(path)
        _CF_EXPLAINER = shap.TreeExplainer(_CF_BUNDLE["model"])
    return _CF_BUNDLE, _CF_EXPLAINER


def _creditfraud_assessment(payload):
    bundle, explainer = get_creditfraud_bundle()
    
    income = float(payload.get("amt_income_total", payload.get("AMT_INCOME_TOTAL", 270000.0)))
    credit = float(payload.get("amt_credit", payload.get("AMT_CREDIT", 1031053.5)))
    annuity = float(payload.get("amt_annuity", payload.get("AMT_ANNUITY", 34204.5)))
    goods_price = float(payload.get("amt_goods_price", payload.get("AMT_GOODS_PRICE", credit * 0.9)))
    ext_source_2 = float(payload.get("ext_source_2", payload.get("EXT_SOURCE_2", 0.55)))
    ext_source_3 = float(payload.get("ext_source_3", payload.get("EXT_SOURCE_3", 0.45)))
    days_birth = float(payload.get("days_birth", payload.get("DAYS_BIRTH", -14500)))
    days_employed = float(payload.get("days_employed", payload.get("DAYS_EMPLOYED", -2500)))
    contract_type = str(payload.get("contract_type", payload.get("NAME_CONTRACT_TYPE", "Cash loans"))).strip()
    gender = str(payload.get("code_gender", payload.get("CODE_GENDER", "M"))).strip().upper()
    
    row = pd.DataFrame([{col: 0.0 for col in bundle["feature_columns"]}])
    row["AMT_INCOME_TOTAL"] = income
    row["AMT_CREDIT"] = credit
    row["AMT_ANNUITY"] = annuity
    row["AMT_GOODS_PRICE"] = goods_price
    row["EXT_SOURCE_2"] = ext_source_2
    row["EXT_SOURCE_3"] = ext_source_3
    row["DAYS_BIRTH"] = days_birth
    row["DAYS_EMPLOYED"] = days_employed
    row["CREDIT_TERM"] = annuity / (credit + 1.0)
    row["ANNUITY_INCOME_RATIO"] = annuity / (income + 1.0)
    if f"NAME_CONTRACT_TYPE_{contract_type}" in row.columns:
        row[f"NAME_CONTRACT_TYPE_{contract_type}"] = 1.0
    if f"CODE_GENDER_{gender}" in row.columns:
        row[f"CODE_GENDER_{gender}"] = 1.0
        
    encoded = row.reindex(columns=bundle["feature_columns"], fill_value=0.0).fillna(0.0)
    
    raw = float(bundle["model"].predict_proba(encoded)[0, 1])
    if bundle.get("calibrator") is not None:
        clipped = float(np.clip(raw, 1e-6, 1 - 1e-6))
        raw = float(bundle["calibrator"].predict_proba([[np.log(clipped / (1 - clipped))]])[0, 1])
        
    threshold = float(bundle.get("decision_threshold", 0.15566))
    anomaly_score = None
    if bundle.get("anomaly_model") is not None and bundle.get("anomaly_reference_scores") is not None:
        score = float(bundle["anomaly_model"].decision_function(encoded)[0])
        reference = np.asarray(bundle["anomaly_reference_scores"])
        anomaly_score = float(1.0 - np.searchsorted(reference, score, side="right") / len(reference))
        
    shap_values = explainer(encoded)
    values = np.asarray(shap_values.values)
    impacts = values[0, :, -1] if values.ndim == 3 else values[0]
    top_indices = np.argsort(np.abs(impacts))[::-1][:5]
    names = list(bundle["feature_columns"])
    factors = [
        {
            "feature": names[int(i)],
            "impact_log_odds": float(impacts[i]),
            "direction": "increases_risk" if impacts[i] > 0 else "decreases_risk"
        }
        for i in top_indices
    ]
    
    return {
        "applicant_id": payload.get("applicant_id", "APP-CF-307511"),
        "model": {"name": "Credit Fraud & Default Risk XGBoost Model (307k Records)", "artifact": "artifacts/creditfraud/model.joblib"},
        "risk": {
            "fraud_probability": round(raw, 4),
            "risk_score": round(raw * 100, 2),
            "decision_threshold": round(threshold, 4),
            "classification": "fraud" if raw >= threshold else "safe",
            "anomaly_score": round(anomaly_score, 4) if anomaly_score is not None else None
        },
        "risk_factors": factors,
        "interpretation": "Federated Credit Fraud model screening result. Evaluated under differential privacy."
    }


def run_ml(domain, user_input):
    d = domain.lower()
    if d in ("banks", "paysim"):
        if not MODEL_PATHS["banks"].is_file():
            raise FileNotFoundError("PaySim model is missing: artifacts/paysim/model.joblib")
        return assess_transaction(user_input)
    if d in ("creditfraud", "lenders"):
        return _creditfraud_assessment(user_input)
    if d in ("insurance", "insurers"):
        return _insurance_assessment(user_input)
    raise ValueError(f"Unknown domain: {domain}. Must be one of: banks, creditfraud, insurance")


def local_reasoning(domain, ml_json):
    risk = ml_json.get("risk", {})
    probability = risk.get("fraud_probability", 0.0)
    score = risk.get("risk_score", round(probability * 100, 2))
    decision = risk.get("classification", "safe")
    threshold = risk.get("decision_threshold", 0.40)
    anomaly = risk.get("anomaly_score", 0.15)
    factors = ml_json.get("risk_factors", [])

    top_factors = []
    for f in factors[:3]:
        feat = f.get('feature', 'feature')
        imp = f.get('impact_log_odds', 0.0)
        direction = f.get('direction', 'affects risk')
        top_factors.append(f"{feat} ({direction}, impact {imp:+.3f})")
    factor_str = ", ".join(top_factors) or "Standard baseline profile"

    if decision == "fraud":
        summary = (
            f"Flagged for Human Review. The model assigned an elevated fraud probability of {probability:.1%} "
            f"(calibrated risk score {score:.1f}/100), exceeding the decision threshold of {threshold:.2f}."
        )
        guidance = (
            "Route transaction to Tier-2 fraud operations. Re-verify sender device token and cross-examine "
            "recipient beneficiary account age and velocity before fund settlement."
        )
    else:
        summary = (
            f"Passed Routine Screening. The calibrated fraud probability of {probability:.1%} "
            f"(score {score:.1f}/100) remains well below the decision cutoff of {threshold:.2f}."
        )
        guidance = "Maintain standard automated continuous transaction monitoring; no adverse customer intervention required."

    text = (
        f"**Assessment Summary**:\n{summary}\n\n"
        f"**Key Feature Evidence (SHAP Drivers)**:\nTop statistical drivers influencing this evaluation: {factor_str}.\n\n"
        f"**Network Context & Silo Parity**:\n"
        f"Isolated bank silos often miss cross-silo destination burner patterns due to lack of network counterparty history. "
        f"The federated model provides cross-institution defense while keeping raw financial data completely quarantined.\n\n"
        f"**Anomaly Signal**:\nAnomaly score is {anomaly:.3f}, measuring behavioral unusualness relative to historical baseline distributions (unusualness indicator, not fraud confirmation).\n\n"
        f"**Recommended Verification Checks**:\n{guidance}\n\n"
        f"**Governance & Limitations**:\nThis evaluation represents decision support trained on benchmark synthetic data under Differential Privacy (ε=2.45) and SecAgg+ encryption. Human oversight is required prior to any adverse customer action."
    )

    return {
        "source": "local_fallback",
        "text": text,
    }


def discover_gemini_models(api_key):
    """Get this key's generateContent models once; never log or return the key."""
    global _GEMINI_MODELS_CACHE
    if _GEMINI_MODELS_CACHE is not None:
        return _GEMINI_MODELS_CACHE
    try:
        response = requests.get(
            "https://generativelanguage.googleapis.com/v1beta/models",
            headers={"x-goog-api-key": api_key},
            timeout=15,
        )
        response.raise_for_status()
        models = response.json().get("models", [])
        blocked = ["image", "tts", "transcribe", "robotics", "computer-use", "customtools"]
        available = {
            item.get("name", "").removeprefix("models/")
            for item in models
            if "generateContent" in item.get("supportedGenerationMethods", [])
            and "gemini" in item.get("name", "").lower()
            and not any(term in item.get("name", "").lower() for term in blocked)
        }
        _GEMINI_MODELS_CACHE = available
        return available
    except (requests.RequestException, ValueError, KeyError):
        return set()


def gemini_model_order(api_key):
    configured = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()
    configured_fallbacks = [name.strip() for name in
                            os.getenv("GEMINI_FALLBACK_MODELS", "").split(",") if name.strip()]
    available = discover_gemini_models(api_key)
    discovered_order = [name for name in GEMINI_MODEL_PREFERENCE if name in available]
    ordered = [configured, *configured_fallbacks, *discovered_order]
    deduplicated = list(dict.fromkeys(name for name in ordered if name))
    return [name for name in deduplicated if not available or name in available]


def gemini_reasoning(domain, ml_json):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_Key")
    if not api_key:
        return local_reasoning(domain, ml_json)

    explanation_json = dict(ml_json)
    for identifier in ["transaction_id", "claim_id"]:
        explanation_json.pop(identifier, None)
    if isinstance(explanation_json.get("model"), dict):
        explanation_json["model"] = {
            key: value for key, value in explanation_json["model"].items()
            if key != "artifact"
        }

    prompt = (
        "You are the authoritative explanation layer for the TrustFed / ENIGMA Financial Risk Screening Platform. "
        "Your role is to interpret the model's authoritative assessment for compliance officers, fraud analysts, and risk teams.\n\n"
        "Guidelines:\n"
        "1. Write a clear, concise, structured response using exactly these markdown labeled sections:\n"
        "   - **Assessment Summary**: State the exact fraud probability (as a percentage), calibrated risk score, and classification relative to the decision cutoff threshold. Clearly say whether this is flagged for Human Review or Routine Approval.\n"
        "   - **Key Feature Evidence (SHAP Drivers)**: Explain the top SHAP features and their exact impact direction. For Banks (PaySim), explain how transaction type (TRANSFER/CASH_OUT vs routine retail), account drainage ratio (amount relative to sender balance), and destination account balance ($0 mule/burner account vs established counterparty) drove the score.\n"
        "   - **Network Context & Silo Parity**: Briefly explain why an isolated bank silo might miss this pattern (e.g. lack of cross-silo destination visibility), whereas the collaborative federated model caught it.\n"
        "   - **Anomaly Signal**: Explain the anomaly score as an indicator of behavioral unusualness relative to historical baseline distributions (not a fraud probability).\n"
        "   - **Recommended Verification Checks**: Provide concrete domain checks (e.g., verifying multi-factor authentication, confirming recipient account tenure, reviewing velocity limits for Banks; policy/incident records for Insurers).\n"
        "   - **Governance & Limitations**: State that this assessment is decision support based on synthetic benchmark data under SecAgg+ and Differential Privacy, requiring human oversight without automated adverse action.\n\n"
        "2. Strictly use the provided assessment values (never invent numbers, thresholds, or facts).\n"
        "3. Keep the tone professional, objective, and regulatory-grade.\n\n"
        f"Domain: {domain}\n"
        f"Authoritative ML Assessment JSON:\n{json.dumps(explanation_json, ensure_ascii=False)}"
    )

    failures = []
    for model_name in gemini_model_order(api_key):
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
        
        # Build payload with thinkingBudget 0 to ensure fast, complete visible responses
        gen_payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 1200,
                "thinkingConfig": {
                    "thinkingBudget": 0
                }
            }
        }
        
        try:
            response = requests.post(
                endpoint,
                headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                json=gen_payload,
                timeout=15,
            )
            # If thinkingConfig causes an error on older models, retry without thinkingConfig
            if response.status_code == 400 and "thinkingConfig" in response.text:
                gen_payload["generationConfig"].pop("thinkingConfig", None)
                response = requests.post(
                    endpoint,
                    headers={"x-goog-api-key": api_key, "Content-Type": "application/json"},
                    json=gen_payload,
                    timeout=15,
                )

            if response.status_code in (401, 403):
                failures.append({"model": model_name, "reason": f"HTTP {response.status_code}; key/authentication rejected"})
                break

            response.raise_for_status()
            body = response.json()
            candidates = body.get("candidates", [])
            if not candidates:
                raise ValueError("No candidates returned")

            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join(part.get("text", "") for part in parts if part.get("text"))
            if not text.strip():
                raise ValueError("empty response text")

            return {
                "source": "gemini",
                "model": model_name,
                "text": text.strip(),
                "fallback_models_tried": failures
            }
        except Exception as exc:
            status = getattr(getattr(exc, "response", None), "status_code", None)
            failures.append({
                "model": model_name,
                "reason": f"HTTP {status}" if status else type(exc).__name__
            })

    fallback = local_reasoning(domain, ml_json)
    fallback["fallback_reason"] = "All configured/discovered Gemini models failed; using local explanation."
    fallback["gemini_attempts"] = failures
    return fallback


@app.get("/health")
def health():
    return {
        "status": "ok",
        "models": {name: {"available": path.is_file(), "artifact": str(path.relative_to(ARTIFACTS_DIR.parent))}
                   for name, path in MODEL_PATHS.items()},
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_Key")),
    }


@app.get("/")
def root():
    return {
        "service": "ENIGMA Risk Inference API",
        "status": "running",
        "health": "/health",
        "interactive_api_docs": "/docs",
        "assessment_endpoint": "POST /api/assess",
        "message": "Use /docs to submit a risk assessment; the root URL does not accept prediction inputs.",
    }


@app.post("/api/assess")
def assess(request: AssessRequest):
    try:
        # Required ordering: ML inference first; the explanation API receives
        # only the structured ML result, never the raw form payload.
        ml_json = run_ml(request.domain, request.user_input)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except (ValueError, TypeError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    reasoning = gemini_reasoning(request.domain, ml_json) if request.include_ai_reasoning else None
    return {"domain": request.domain, "ml_risk_json": ml_json, "ai_reasoning": reasoning}
