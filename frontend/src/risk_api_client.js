// Shared browser helper for Banks, Lenders, and Insurers tabs.
// The API key must never be placed in this file or sent from the browser.
// FLOW: UI -> risk_api_client.js -> risk_api.py (POST /api/assess) -> saved model -> Gemini -> risk_api_client.js -> UI

const CANDIDATE_BASES = [
  "http://localhost:8000",
  "http://127.0.0.1:8000"
];

let cachedWorkingBase = null;

async function getWorkingBase() {
  if (cachedWorkingBase) return cachedWorkingBase;
  for (const base of CANDIDATE_BASES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${base}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        cachedWorkingBase = base;
        return base;
      }
    } catch (_) {}
  }
  return CANDIDATE_BASES[0];
}

export async function checkBackendHealth() {
  for (const base of CANDIDATE_BASES) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${base}/health`, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        cachedWorkingBase = base;
        const data = await response.json();
        return { ...data, endpoint: base };
      }
    } catch (_) {}
  }
  return { status: "offline", error: "Failed to connect to backend on localhost:8000 or 127.0.0.1:8000" };
}

export async function assessRisk(domain, userInput, includeAiReasoning = true) {
  const base = cachedWorkingBase || (await getWorkingBase());
  const startTime = performance.now();

  const response = await fetch(`${base}/api/assess`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      domain, // "banks" | "lenders" | "insurers"
      user_input: userInput,
      include_ai_reasoning: includeAiReasoning,
    }),
  });

  const durationMs = Math.round(performance.now() - startTime);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || `Risk API returned ${response.status}`);
  }

  // Attach client-side round-trip telemetry
  return {
    ...result,
    telemetry: {
      endpoint: base,
      client_latency_ms: durationMs,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function verifySecurityPipeline(payload) {
  const base = cachedWorkingBase || (await getWorkingBase());
  const response = await fetch(`${base}/api/security/verify-pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Security pipeline returned ${response.status}`);
  }

  return await response.json();
}

