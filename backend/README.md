# ⚙️ OLYMPUS Backend — Risk Inference & Explainability Engine

High-performance FastAPI service providing federated machine learning risk assessments, SHAP driver attributions, and Google Gemini LLM audit brief explanations for financial fraud detection.

---

## 📂 Architecture & Directory Layout

```
backend/
├── artifacts/                  # Serialized trained models & metadata
│   ├── creditfraud/            # XGBoost GBDT (307k Home Credit applications)
│   ├── insurance/              # 54-Feature GBDT (1M policy records) + 20 federated client silos
│   └── paysim/                 # Platt-calibrated GBDT (PaySim financial transactions)
├── check_gemini_models.py      # Diagnostic script to list & probe available Gemini models
├── check_insurance_ml.py       # Validation suite for insurance ML bundle
├── check_paysim_dataset.py     # PaySim data verification helper
├── datasets.py                 # Dataset streaming and ETL pipeline
├── paysim_input_examples.txt   # Test payloads for transaction risk evaluation
├── predict_paysim.py           # Core PaySim inference and validation module
├── requirements.txt            # Unified Python dependencies
├── requirements-api.txt        # FastAPI & web server dependencies
├── requirements-ml.txt         # Scikit-learn, XGBoost & SHAP dependencies
├── risk_api.py                 # Primary entry point exporting FastAPI `app`
├── risks_api.py                # Comprehensive FastAPI route handlers & inference pipelines
├── train_demo_models.py        # Demo model generator
├── train_insurance.py          # Insurance model training runner
├── train_paysim.py             # PaySim model training runner
└── train_risk_models.py        # Full federated risk model training suite
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- Virtual environment (recommended)

### 2. Installation
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file with your configuration:
```env
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
FRONTEND_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### 4. Running the Server
```bash
uvicorn risk_api:app --host 0.0.0.0 --port 8000 --reload
```
The API will be available at `http://localhost:8000`.

---

## 📡 API Endpoints

### 1. `GET /health`
Returns system status, model artifact availability, and Gemini configuration status.
```json
{
  "status": "ok",
  "models": {
    "banks": { "available": true, "artifact": "backend/artifacts/paysim/model.joblib" },
    "creditfraud": { "available": true, "artifact": "backend/artifacts/creditfraud/model.joblib" },
    "lenders": { "available": true, "artifact": "backend/artifacts/creditfraud/model.joblib" },
    "insurance": { "available": true, "artifact": "backend/artifacts/insurance/model.joblib" },
    "insurers": { "available": true, "artifact": "backend/artifacts/insurance/model.joblib" }
  },
  "gemini_configured": true
}
```

### 2. `POST /api/assess`
Main assessment endpoint accepting domain inputs, executing ML scoring, extracting SHAP factors, and generating plain-English LLM regulatory explanations.

**Example Request (Banks / PaySim):**
```json
{
  "domain": "banks",
  "user_input": {
    "step": 295,
    "type": "CASH_OUT",
    "amount": 172344.30,
    "oldbalanceOrg": 172344.30,
    "oldbalanceDest": 0.0
  },
  "include_ai_reasoning": true
}
```

**Example Request (Insurers):**
```json
{
  "domain": "insurers",
  "user_input": {
    "claim_type": "home",
    "state": "CA",
    "policyholder_tenure_years": 15.4,
    "previous_claims_count": 1,
    "incident_date": "2025-07-21",
    "claim_filed_date": "2025-07-29",
    "claim_amount": 34424.99,
    "deductible": 2500
  },
  "include_ai_reasoning": true
}
```
