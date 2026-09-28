"""List and probe text-generation Gemini models available to the configured key.

The API key is read locally and is never printed. Each text model gets a tiny
"Reply OK" generation request to check that it actually responds for this key.
"""

import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv


load_dotenv(Path(__file__).parent / ".env", override=True)
key = os.getenv("GEMINI_API_Key")
if not key:
    print("GEMINI_API_Key was not found in the environment or .env")
    raise SystemExit(2)

try:
    response = requests.get(
        "https://generativelanguage.googleapis.com/v1beta/models",
        headers={"x-goog-api-key": key},
        timeout=25,
    )
    if not response.ok:
        print(f"Gemini model-list request failed: HTTP {response.status_code}")
        print(response.text[:1000])
        raise SystemExit(1)
    models = response.json().get("models", [])
    available = [
        {"name": item.get("name", "").removeprefix("models/"),
         "displayName": item.get("displayName"),
         "supportedGenerationMethods": item.get("supportedGenerationMethods", [])}
        for item in models
        if "generateContent" in item.get("supportedGenerationMethods", [])
        and "gemini" in item.get("name", "").lower()
        and not any(kind in item.get("name", "").lower() for kind in
                    ["image", "tts", "transcribe", "robotics", "computer-use"])
    ]
    if not available:
        print("No Gemini models supporting generateContent were returned for this key.")
    else:
        print("Text-generation models available to this key (tiny test request per model):")
        for item in available:
            name = item["name"]
            try:
                probe = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{name}:generateContent",
                    headers={"x-goog-api-key": key, "Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": "Reply with OK."}]}],
                          "generationConfig": {"maxOutputTokens": 8, "temperature": 0}},
                    timeout=30,
                )
                if probe.ok:
                    print(f"- WORKING: {name} ({item.get('displayName') or 'no display name'})")
                else:
                    print(f"- LISTED, REQUEST FAILED ({probe.status_code}): {name}")
            except requests.RequestException as exc:
                print(f"- REQUEST ERROR ({type(exc).__name__}): {name}")
except requests.RequestException as exc:
    print(f"Could not reach Gemini API: {type(exc).__name__}: {exc}")
    raise SystemExit(1)
