function isNativeApp() {
  if (typeof window === "undefined") return false;

  if (window.KliquesNative?.isNative) return true;

  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("native") === "1";
  } catch {
    return false;
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === "") return;
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function getAuthRedirectUrl(params = {}) {
  const webBase =
    process.env.REACT_APP_AUTH_CALLBACK_URL ||
    `${window.location.origin}/auth/callback`;
  const nativeBase =
    process.env.REACT_APP_NATIVE_AUTH_CALLBACK_URL || "kliques://auth/callback";
  const base = isNativeApp() ? nativeBase : webBase;

  return `${base}${buildQuery(params)}`;
}

export { isNativeApp };
