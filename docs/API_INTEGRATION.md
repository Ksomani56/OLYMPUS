# Risk API connection

## Flow

The browser posts a domain and its form values to one backend endpoint. The backend runs the saved ML model first, then asks Gemini to explain the ML result. If the API key is missing or Gemini errors/times out, the backend returns a local explanation from the same ML JSON. The ML classification and scores are never changed by Gemini.

```text
UI form -> POST /api/assess -> domain model -> structured ML risk JSON
                                      -> Gemini or local fallback
UI <- ML risk JSON + explanation text
```

## Start locally

Install both dependency sets in the project virtual environment:

```powershell
pip install -r requirements-ml.txt
pip install -r requirements-api.txt
```

Copy `.env.example` to `.env`, then put the real key on the `GEMINI_API_Key` line. `.env` is ignored by Git. Do not put the key in browser code. Set `FRONTEND_ORIGINS` in `.env` to the exact local/deployed UI origin.

The backend tries `GEMINI_MODEL`, then `GEMINI_FALLBACK_MODELS`, then only the probe-approved model names in `risk_api.py` that the API lists for this key. It does not assume every listed model works. It continues after a model error; if every attempt fails (or no key is configured), it returns the local explanation based on the ML JSON. After changing settings, restart Uvicorn. To recheck model access, run `python check_gemini_models.py`; it never prints the key.

Start the backend from the project directory:

```powershell
python -m uvicorn risk_api:app --reload --port 8000
```

Check `http://localhost:8000/health` to see which model artifacts are available.

## One endpoint for every tab

`POST http://localhost:8000/api/assess`

Banks body:

```json
{
  "domain": "banks",
  "user_input": {
    "step": 295,
    "type": "CASH_OUT",
    "amount": 172344.3,
    "oldbalanceOrg": 172344.3,
    "oldbalanceDest": 0
  },
  "include_ai_reasoning": true
}
```

The current PaySim artifact requires `step`, `type`, `amount`, `oldbalanceOrg`, and `oldbalanceDest`. The transaction type UI should be a dropdown with `CASH_IN`, `CASH_OUT`, `DEBIT`, `PAYMENT`, and `TRANSFER`.

Insurers body (once `artifacts/insurance/model.joblib` exists):

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

The Lenders tab uses the same request/response contract with `domain: "lenders"`. There is currently no lender model or input adapter in this workspace, so the API reports that model as unavailable rather than fabricating a score. Add its trained artifact and feature adapter before enabling scoring there.

## Response

The response contains `ml_risk_json` (probability, decision, anomaly signal, SHAP factors) and `ai_reasoning` (`source` is `gemini` or `local_fallback`, with a `text` explanation). If the selected model is not installed/trained, the API returns HTTP 503 and does not call Gemini.

The browser helper in `risk_api_client.js` is shared by all tabs:

```js
const result = await assessRisk("banks", bankFormValues);
renderRisk(result.ml_risk_json);
renderExplanation(result.ai_reasoning.text);
```

Keep the model output visible separately from the generated explanation. Treat both `fraud` and `safe` as model screening results, not confirmed findings.
