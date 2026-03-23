import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { request } from "../data/apiClient";

// sessionStorage keys — must match InviteFlow and PublicBookingFlow
const INVITE_KEY = "kliques.pending_invite_code";
const SS_PREFIX = "kliques.pub_booking.";
const SS_PROVIDER = SS_PREFIX + "provider";
const SS_SELECTED_SVC = SS_PREFIX + "selectedSvc";
const SS_SELECTED_SLOT = SS_PREFIX + "selectedSlot";

function ssGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const processed = useRef(false); // prevent double-fire in React StrictMode

  useEffect(() => {
    if (loading) return;
    if (processed.current) return;
    processed.current = true;

    async function handle() {
      if (!session?.user) {
        navigate("/login", { replace: true });
        return;
      }

      // ── 1. Pending invite code ─────────────────────────────────────────────
      const pendingInviteCode = sessionStorage.getItem(INVITE_KEY);
      if (pendingInviteCode) {
        try {
          await request(`/provider/invites/join/${pendingInviteCode}/accept`, {
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
      const role = session.user.role || "client";
      if (role === "provider") {
        navigate("/provider", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }

    handle();
  }, [session, loading, navigate]);

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
