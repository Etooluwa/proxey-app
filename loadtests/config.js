export const BASE_URL = __ENV.BASE_URL || "http://localhost:5000";
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";
export const PROVIDER_ID = __ENV.PROVIDER_ID || "";
export const SERVICE_ID = __ENV.SERVICE_ID || "";
export const PAYMENT_METHOD_ID = __ENV.PAYMENT_METHOD_ID || "";
export const LOADTEST_BYPASS_KEY = __ENV.LOADTEST_BYPASS_KEY || "";

export const defaultStages = [
  { duration: "30s", target: 10 },
  { duration: "1m", target: 25 },
  { duration: "30s", target: 0 },
];

export function authHeaders(extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (AUTH_TOKEN) {
    headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  }

  if (LOADTEST_BYPASS_KEY) {
    headers["x-loadtest-bypass"] = LOADTEST_BYPASS_KEY;
  }

  return headers;
}
