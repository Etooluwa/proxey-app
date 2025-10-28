const API_BASE = process.env.REACT_APP_API_BASE || "/api";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    let userHeaders = {};
    if (typeof window !== "undefined") {
      try {
        const rawSession = window.localStorage.getItem("proxey.auth.session");
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed?.user?.id) {
            userHeaders["x-user-id"] = parsed.user.id;
          }
        }
      } catch (error) {
        console.warn("[api] Unable to parse stored session", error);
      }
    }

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
  } finally {
    clearTimeout(timeout);
  }
}

export { API_BASE, request };
