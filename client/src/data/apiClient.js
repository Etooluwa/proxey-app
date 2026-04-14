import { supabase } from "../utils/supabase";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

async function resolveUserHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  let accessToken = null;
  let userId = null;

  // Read from localStorage first so requests are never blocked on Supabase session resolution.
  try {
    const rawSession = window.localStorage.getItem("proxey.auth.session");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      const storedAccessToken = parsed?.access_token || parsed?.accessToken || null;
      if (storedAccessToken) {
        accessToken = storedAccessToken;
        userId = parsed.user?.id || null;
      }
    }
  } catch (error) {
    console.warn("[api] Unable to parse stored session", error);
  }

  // Primary: get the live Supabase session for a verified JWT
  if (supabase?.auth?.getSession) {
    try {
      const liveSessionResult = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error("Supabase session lookup timed out.")), 4000);
        }),
      ]);
      const { data: { session } } = liveSessionResult;
      if (session?.access_token) {
        accessToken = session.access_token;
        userId = session.user?.id || null;
      }
    } catch (error) {
      console.warn("[api] Unable to resolve Supabase session", error);
    }
  }

  const headers = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  return headers;
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const userHeaders = await resolveUserHeaders();

    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...userHeaders,
        ...options.headers,
      },
      credentials: "include",
      signal: controller.signal,
      ...options,
    });
    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error(payload?.error || "Request failed");
      error.status = response.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  } catch (err) {
    // AbortError means the request timed out — give a friendlier message
    if (err.name === "AbortError") {
      const timeoutErr = new Error("Server is starting up, please try again in a moment.");
      timeoutErr.isTimeout = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export { API_BASE, request };
