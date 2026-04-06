export function extractBearerToken(authHeader) {
  if (typeof authHeader !== "string") return null;
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  return token || null;
}

export async function resolveVerifiedUser({ authHeader, supabase }) {
  const token = extractBearerToken(authHeader);
  if (!token || !supabase?.auth?.getUser) return null;

  try {
    const {
      data: { user } = {},
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user?.id) return null;
    return {
      userId: user.id,
      email: user.email || null,
    };
  } catch {
    return null;
  }
}

export function getVerifiedUserId(req) {
  return req?.verifiedUserId || null;
}

export function getVerifiedProviderId(req) {
  return getVerifiedUserId(req);
}

export function isAdminUser(userId, adminUserIds = []) {
  return Boolean(userId) && adminUserIds.includes(userId);
}
