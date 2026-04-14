import { useEffect, useMemo, useRef } from "react";
import posthog from "posthog-js";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { request } from "../data/apiClient";

const LOCAL_ROLE_KEY = "proxey.userRoles";
// sessionStorage keys — must match InviteFlow and PublicBookingFlow
const INVITE_KEY = "kliques.pending_invite_code";
const SS_PREFIX = "kliques.pub_booking.";
const SS_PROVIDER = SS_PREFIX + "provider";
const SS_SELECTED_SVC = SS_PREFIX + "selectedSvc";
const SS_SELECTED_SLOT = SS_PREFIX + "selectedSlot";

function ssGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

function setLocalRole(email, role) {
  if (!email || !role) return;
  try {
    const raw = window.localStorage.getItem(LOCAL_ROLE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[email.toLowerCase()] = role;
    window.localStorage.setItem(LOCAL_ROLE_KEY, JSON.stringify(map));
  } catch (error) {
    console.warn("[AuthCallback] Failed to persist local role", error);
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { session, loading } = useAuth();
  const processed = useRef(false); // prevent double-fire in React StrictMode
  const authParams = useMemo(() => {
    const merged = new URLSearchParams(searchParams);
    const hash = window.location.hash || "";

    if (hash.startsWith("#")) {
      const hashParams = new URLSearchParams(hash.slice(1));
      hashParams.forEach((value, key) => {
        if (!merged.has(key)) {
          merged.set(key, value);
        }
      });
    }

    return merged;
  }, [searchParams]);

  const errorCode = authParams.get("error_code");
  const errorDescription = authParams.get("error_description");
  const errorMessage = useMemo(() => {
    if (!errorCode && !errorDescription) return "";
    if (errorCode === "otp_expired") {
      return "This email confirmation link is invalid or has expired. Request a new confirmation email and try again.";
    }
    return errorDescription || "We could not complete email confirmation.";
  }, [errorCode, errorDescription]);

  useEffect(() => {
    if (loading) return;
    if (processed.current) return;
    processed.current = true;

    async function handle() {
      if (errorCode || errorDescription) {
        return;
      }

      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      // ── 1. Pending invite code ─────────────────────────────────────────────
      const pendingInviteCode = sessionStorage.getItem(INVITE_KEY);
      if (pendingInviteCode) {
        try {
          await request(`/invites/${pendingInviteCode}/accept`, {
            method: "POST",
          });
        } catch (err) {
          // Non-fatal: relationship may already exist or invite already accepted.
          console.warn("[AuthCallback] invite accept failed:", err.message);
        }
        // Clear only after the attempt (success or known-safe failure)
        sessionStorage.removeItem(INVITE_KEY);

        // Send user back to the invite flow which will show the connected screen.
        // The ?accepted=true param tells InviteFlow to skip straight to ScreenConnected.
        navigate(`/join/${pendingInviteCode}?accepted=true`, { replace: true });
        return;
      }

      // ── 2. Pending booking data ────────────────────────────────────────────
      const provider = ssGet(SS_PROVIDER);
      const selectedSvc = ssGet(SS_SELECTED_SVC);
      const selectedSlot = ssGet(SS_SELECTED_SLOT);

      if (provider?.handle && selectedSvc && selectedSlot) {
        // Redirect to booking flow with ?resume=true — the component will detect
        // this, see the active session, and proceed to the correct payment step
        // (Path A: existing user → payment; Path B: new user → create booking now).
        navigate(`/book/${provider.handle}?resume=true`, { replace: true });
        return;
      }

      // ── 3. Default role-based redirect ────────────────────────────────────
      // Role/name can come from:
      //   a) URL params (signup_role, signup_name) — survives cross-device email confirmation
      //   b) localStorage (proxey.pending_role) — same device/browser fallback
      //   c) session.user.role — returning user
      const urlRole = searchParams.get('signup_role');
      const urlName = searchParams.get('signup_name') ? decodeURIComponent(searchParams.get('signup_name')) : '';
      const lsRole = window.localStorage.getItem('proxey.pending_role');
      const lsName = window.localStorage.getItem('proxey.pendingName') || '';

      // Only treat as new signup if role params are present AND the account was created recently
      // (within 5 minutes of now) — prevents welcome email on returning logins with stale localStorage
      const accountCreatedAt = session.user.created_at ? new Date(session.user.created_at) : null;
      const isRecentAccount = accountCreatedAt && (Date.now() - accountCreatedAt.getTime()) < 5 * 60 * 1000;
      const isNewSignup = Boolean(urlRole || lsRole) && isRecentAccount;
      const role = urlRole || lsRole || session.user.role || "client";
      // Name priority: URL param → localStorage → Google/OAuth user_metadata → email prefix
      const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      const pendingName = urlName || lsName || metaName;

      if (session.user.email && role) {
        setLocalRole(session.user.email, role);
      }

      // Clean up localStorage — always clear to prevent stale names leaking to future signups
      window.localStorage.removeItem('proxey.pending_role');
      window.localStorage.removeItem('proxey.pendingName');

      // Send welcome email for all new signups after confirmation (non-blocking)
      if (isNewSignup && session.user.email) {
        if (posthog.__loaded) {
          posthog.capture("signup_completed", {
            role,
            signup_method: session.user?.app_metadata?.provider === "google" ? "google" : "email",
          });
        }
        fetch(`${process.env.REACT_APP_API_BASE || '/api'}/auth/send-welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: session.user.email, name: pendingName, role }),
        }).catch(() => {});
      }

      if (role === "provider") {
        // New signup → go to onboarding. Returning provider → go to dashboard.
        navigate(isNewSignup ? "/provider/onboarding" : "/provider", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        // New client signup → go to app. Returning client → go to app.
        navigate("/app", { replace: true });
      }
    }

    handle();
  }, [session, loading, navigate, errorCode, errorDescription, searchParams, authParams]);

  if (errorMessage) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 24,
          fontFamily: "'Sora', system-ui, sans-serif",
          background: "#FBF7F2",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            background: "#FFFFFF",
            border: "1px solid rgba(140,106,100,0.18)",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 12px 30px rgba(61,35,30,0.06)",
          }}
        >
          <p style={{ margin: "0 0 8px", color: "#C25E4A", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Email Confirmation
          </p>
          <h1 style={{ margin: "0 0 12px", color: "#3D231E", fontSize: 28, lineHeight: 1.15 }}>
            Link expired
          </h1>
          <p style={{ margin: "0 0 20px", color: "#6B7280", fontSize: 15, lineHeight: 1.6 }}>
            {errorMessage}
          </p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "#3D231E",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: 16,
        fontFamily: "'Sora', system-ui, sans-serif",
        background: "#FBF7F2",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(140,106,100,0.2)",
          borderTop: "3px solid #C25E4A",
          borderRadius: "50%",
          animation: "spin 0.9s linear infinite",
        }}
      />
      <p style={{ color: "#6B7280", fontSize: 15 }}>Signing you in…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
