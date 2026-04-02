import { supabase } from "../utils/supabase";

const API_BASE = process.env.REACT_APP_API_BASE || "/api";

async function resolveUserHeaders() {
  if (typeof window === "undefined") {
    return {};
  }

  let userId = null;

  try {
    const rawSession = window.localStorage.getItem("proxey.auth.session");
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed?.user?.id) {
        userId = parsed.user.id;
      }
    }
  } catch (error) {
    console.warn("[api] Unable to parse stored session", error);
  }

  // Fall back to the live Supabase session so API calls still identify the
  // current user even if the local app session cache is stale or missing.
  if (!userId && supabase?.auth?.getSession) {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    } catch (error) {
      console.warn("[api] Unable to resolve Supabase session", error);
    }
  }

  return userId ? { "x-user-id": userId } : {};
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
