import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/authContext";
import { request } from "../data/apiClient";

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  base: "#FBF7F2", ink: "#3D231E", muted: "#8C6A64", faded: "#B0948F",
  accent: "#C25E4A", hero: "#FDDCC6", avatarBg: "#F2EBE5",
  line: "rgba(140,106,100,0.2)", success: "#5A8A5E", successBg: "#EBF2EC",
  dangerBg: "#FDEDEA",
};
const F = "'Sora', system-ui, sans-serif";

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// sessionStorage key for the invite code
const INVITE_KEY = "kliques.pending_invite_code";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const initials = (name = "") =>
  name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatCategory = (cat) => {
  if (!cat) return "";
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

// ─── Shared primitives ────────────────────────────────────────────────────────
function Lbl({ children, color = T.muted, style = {} }) {
  return (
    <span style={{
      fontFamily: F, fontSize: "11px", fontWeight: 500, color,
      letterSpacing: "0.05em", textTransform: "uppercase", display: "block", ...style,
    }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: T.line }} />;
}

function InputField({ label, type = "text", value, onChange, placeholder, hint, autoComplete }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <Lbl style={{ marginBottom: "8px" }}>{label}</Lbl>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={{
          width: "100%", padding: "14px 16px", borderRadius: "12px",
          border: `1px solid ${T.line}`, fontFamily: F, fontSize: "14px",
          color: T.ink, outline: "none", background: T.avatarBg, boxSizing: "border-box",
        }}
      />
      {hint && (
        <p style={{ fontFamily: F, fontSize: "12px", color: T.faded, margin: "6px 0 0" }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: T.base, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          border: `2px solid ${T.hero}`, borderTopColor: T.accent,
          animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
        }} />
        <span style={{ fontSize: "14px", color: T.muted }}>Loading…</span>
      </div>
    </div>
  );
}

// ─── Invalid invite screen ────────────────────────────────────────────────────
function ScreenInvalidInvite({ reason }) {
  const navigate = useNavigate();
  const msgs = {
    not_found:        { title: "Link not found", body: "This invite link doesn't exist. It may have been removed or mistyped." },
    already_accepted: { title: "Already accepted", body: "This invite link has already been used. Ask your provider to send a new one." },
    expired:          { title: "Link expired", body: "This invite link has expired. Ask your provider to send a fresh one." },
  };
  const msg = msgs[reason] || { title: "Invalid link", body: "This invite link is no longer valid." };

  return (
    <div style={{ minHeight: "100vh", background: T.base, fontFamily: F, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap')`}</style>
      <div style={{
        width: "64px", height: "64px", borderRadius: "50%", background: T.dangerBg,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px",
      }}>
        <svg width="26" height="26" fill="none" stroke="#C25E4A" strokeWidth="2.2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h2 style={{ fontFamily: F, fontSize: "22px", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 8px", textAlign: "center" }}>
        {msg.title}
      </h2>
      <p style={{ fontFamily: F, fontSize: "14px", color: T.muted, margin: "0 0 32px", textAlign: "center", lineHeight: 1.6, maxWidth: "280px" }}>
        {msg.body}
      </p>
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "14px 32px", borderRadius: "12px", border: "none",
          background: T.ink, color: "#fff", fontFamily: F, fontSize: "14px",
          fontWeight: 500, cursor: "pointer",
        }}
      >
        Go to kliques
      </button>
      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <Lbl color={T.faded} style={{ fontSize: "10px" }}>Powered by Kliques</Lbl>
      </div>
    </div>
  );
}

// ─── Screen 1 — Invite Landing ────────────────────────────────────────────────
function ScreenLanding({ provider, onAccept, onAlreadyHaveAccount }) {
  const displayName = provider?.business_name || provider?.name || "Your Provider";
  const providerInitials = initials(displayName);
  const subtitle = [formatCategory(provider?.category), provider?.city].filter(Boolean).join(" · ");

  const benefits = [
    {
      icon: (
        <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Your history, always saved",
      desc: "Every session, note, and recommendation in one timeline.",
    },
    {
      icon: (
        <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Easy booking & payment",
      desc: "Book sessions and pay securely, all through the platform.",
    },
    {
      icon: (
        <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      title: "Direct communication",
      desc: "Message your provider anytime — questions, updates, or session prep.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.base, fontFamily: F, display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}`}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px", textAlign: "center" }}>
        <span style={{ fontFamily: F, fontSize: "16px", fontWeight: 600, color: T.accent, letterSpacing: "-0.01em" }}>
          kliques
        </span>
      </div>

      {/* Provider hero card with topo texture */}
      <div style={{ margin: "0 16px 28px", background: T.hero, borderRadius: "28px", padding: "32px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, backgroundImage: TOPO_SVG,
          backgroundSize: "cover", opacity: 0.12, pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          {provider?.avatar || provider?.photo ? (
            <img
              src={provider.avatar || provider.photo}
              alt={displayName}
              style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", marginBottom: "16px", border: `2px solid rgba(255,255,255,0.6)` }}
            />
          ) : (
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "rgba(255,255,255,0.5)", border: "2px solid rgba(255,255,255,0.7)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "16px", boxShadow: "0 4px 16px rgba(61,35,30,0.08)",
            }}>
              <span style={{ fontFamily: F, fontSize: "26px", fontWeight: 400, color: T.ink }}>{providerInitials}</span>
            </div>
          )}
          <h1 style={{ fontFamily: F, fontSize: "24px", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 4px" }}>
            {displayName}
          </h1>
          {subtitle && (
            <p style={{ fontFamily: F, fontSize: "13px", color: T.muted, margin: "0 0 8px" }}>{subtitle}</p>
          )}
          {provider?.rating && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontFamily: F, fontSize: "13px", color: T.accent }}>
                {parseFloat(provider.rating).toFixed(1)} ★
              </span>
              {provider?.review_count && (
                <>
                  <span style={{ color: T.faded, fontSize: "13px" }}>·</span>
                  <span style={{ fontFamily: F, fontSize: "13px", color: T.muted }}>{provider.review_count} reviews</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <h2 style={{ fontFamily: F, fontSize: "22px", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 10px", lineHeight: 1.3 }}>
          {displayName.split(" ")[0]} invited you to join their klique.
        </h2>
        <p style={{ fontFamily: F, fontSize: "15px", color: T.muted, margin: "0 0 24px", lineHeight: 1.7 }}>
          Accept to build a lasting relationship — your session history, notes, and bookings will all live in one place.
        </p>

        <Divider />

        {/* Benefit rows */}
        {benefits.map((item) => (
          <div key={item.title}>
            <div style={{ display: "flex", gap: "14px", padding: "18px 0", alignItems: "flex-start" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px", background: T.hero,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontFamily: F, fontSize: "15px", fontWeight: 500, color: T.ink, margin: "0 0 3px" }}>{item.title}</p>
                <p style={{ fontFamily: F, fontSize: "13px", color: T.muted, margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
            <Divider />
          </div>
        ))}

        {/* CTAs */}
        <div style={{ marginTop: "auto", padding: "28px 0 20px" }}>
          <button
            onClick={onAccept}
            style={{
              width: "100%", padding: "16px", borderRadius: "12px", border: "none",
              background: T.ink, color: "#fff", fontFamily: F, fontSize: "14px",
              fontWeight: 500, cursor: "pointer", marginBottom: "12px",
            }}
          >
            Accept Invite
          </button>
          <button
            onClick={onAlreadyHaveAccount}
            style={{
              width: "100%", padding: "14px", borderRadius: "12px", border: "none",
              background: "transparent", fontFamily: F, fontSize: "14px",
              fontWeight: 500, color: T.accent, cursor: "pointer", textAlign: "center",
            }}
          >
            I already have an account
          </button>
        </div>

        <div style={{ paddingBottom: "20px", textAlign: "center" }}>
          <Lbl color={T.faded} style={{ fontSize: "10px" }}>Powered by Kliques</Lbl>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2 — Signup ───────────────────────────────────────────────────────
function ScreenSignup({ inviteCode, provider, onSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const displayName = provider?.business_name || provider?.name || "your provider";
  const canSubmit = name.trim() && isValidEmail(email) && phone.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.base, fontFamily: F, display: "flex", flexDirection: "column" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}`}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={onSuccess}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}
        >
          <svg width="24" height="24" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: F, fontSize: "16px", fontWeight: 600, color: T.accent, letterSpacing: "-0.01em" }}>
          kliques
        </span>
      </div>

      <div style={{ padding: "8px 24px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        <h1 style={{ fontFamily: F, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: T.ink, margin: "0 0 8px" }}>
          Create your account
        </h1>
        <p style={{ fontFamily: F, fontSize: "15px", color: T.muted, margin: "0 0 32px", lineHeight: 1.6 }}>
          Just a few details and you'll be connected with <strong style={{ color: T.ink, fontWeight: 500 }}>{displayName}</strong>.
        </p>

        <InputField
          label="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          hint="We'll send you a login link — no password needed."
          autoComplete="tel"
        />

        {error && (
          <p style={{ fontFamily: F, fontSize: "13px", color: T.accent, margin: "0 0 16px", textAlign: "center" }}>
            {error}
          </p>
        )}

        <div style={{ marginTop: "auto", paddingBottom: "32px" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%", padding: "16px", borderRadius: "12px", border: "none",
              background: canSubmit ? T.ink : T.faded,
              color: "#fff", fontFamily: F, fontSize: "14px", fontWeight: 500,
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            {submitting && (
              <span style={{
                width: "14px", height: "14px", borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                animation: "spin 0.8s linear infinite", display: "inline-block",
              }} />
            )}
            {submitting ? "Creating account…" : "Create Account & Connect"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2b — Magic Link (existing account) ───────────────────────────────
function ScreenMagicLink({ inviteCode, provider, onSuccess }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const { session } = useSession();

  // If already authenticated, accept immediately
  useEffect(() => {
    if (!session || !inviteCode) return;
    request(`/invites/${inviteCode}/accept`, { method: "POST" })
      .then(() => {
        sessionStorage.removeItem(INVITE_KEY);
        onSuccess();
      })
      .catch(() => {
        sessionStorage.removeItem(INVITE_KEY);
        onSuccess();
      });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!isValidEmail(email)) return;
    setSending(true);
    try {
      await request("/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {
      // Non-fatal
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.base, fontFamily: F, display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => setSent(false)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}
        >
          <svg width="24" height="24" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: F, fontSize: "16px", fontWeight: 600, color: T.accent, letterSpacing: "-0.01em" }}>
          kliques
        </span>
      </div>

      <div style={{ padding: "8px 24px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        {sent ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "48px", textAlign: "center" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "16px", background: T.hero,
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px",
            }}>
              <svg width="28" height="28" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ fontFamily: F, fontSize: "22px", fontWeight: 400, letterSpacing: "-0.02em", color: T.ink, margin: "0 0 8px" }}>
              Check your email.
            </h2>
            <p style={{ fontFamily: F, fontSize: "14px", color: T.muted, margin: 0, lineHeight: 1.6, maxWidth: "280px" }}>
              We sent a magic link to <strong style={{ color: T.ink, fontWeight: 500 }}>{email}</strong>. Tap it to sign in and complete your connection.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: F, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: T.ink, margin: "0 0 8px" }}>
              Sign in to kliques
            </h1>
            <p style={{ fontFamily: F, fontSize: "15px", color: T.muted, margin: "0 0 32px", lineHeight: 1.6 }}>
              We'll send a magic link to your email — no password needed.
            </p>
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
            <div style={{ marginTop: "auto", paddingBottom: "32px" }}>
              <button
                onClick={handleSend}
                disabled={!isValidEmail(email) || sending}
                style={{
                  width: "100%", padding: "16px", borderRadius: "12px", border: "none",
                  background: isValidEmail(email) && !sending ? T.ink : T.faded,
                  color: "#fff", fontFamily: F, fontSize: "14px", fontWeight: 500,
                  cursor: isValidEmail(email) && !sending ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {sending && (
                  <span style={{
                    width: "14px", height: "14px", borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff",
                    animation: "spin 0.8s linear infinite", display: "inline-block",
                  }} />
                )}
                {sending ? "Sending…" : "Send magic link"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Screen 3 — Connected ─────────────────────────────────────────────────────
function ScreenConnected({ provider, clientName }) {
  const navigate = useNavigate();
  const displayName = provider?.business_name || provider?.name || "Your Provider";
  const providerInitials = initials(displayName);
  const clientInitials = initials(clientName || "You");
  const subtitle = [formatCategory(provider?.category), provider?.city].filter(Boolean).join(" · ");

  return (
    <div style={{ minHeight: "100vh", background: T.base, fontFamily: F, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box;-webkit-font-smoothing:antialiased}`}</style>

      {/* Two avatars linked by terracotta line */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", background: T.avatarBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${T.base}`, zIndex: 2, position: "relative",
        }}>
          <span style={{ fontFamily: F, fontSize: "20px", fontWeight: 400, color: T.muted }}>{clientInitials}</span>
        </div>
        <div style={{ width: "32px", height: "2px", background: T.accent, margin: "0 -4px", zIndex: 1 }} />
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%", background: T.hero,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${T.base}`, zIndex: 2, position: "relative",
        }}>
          {provider?.avatar || provider?.photo ? (
            <img
              src={provider.avatar || provider.photo}
              alt={displayName}
              style={{ width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontFamily: F, fontSize: "20px", fontWeight: 400, color: T.ink }}>{providerInitials}</span>
          )}
        </div>
      </div>

      <h1 style={{ fontFamily: F, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: T.ink, margin: "0 0 8px", textAlign: "center" }}>
        You're connected.
      </h1>
      <p style={{ fontFamily: F, fontSize: "15px", color: T.muted, margin: "0 0 8px", textAlign: "center", lineHeight: 1.6 }}>
        You and {displayName} are now part of each other's klique.
      </p>
      <p style={{ fontFamily: F, fontSize: "14px", color: T.muted, margin: "0 0 40px", textAlign: "center", lineHeight: 1.6, maxWidth: "300px" }}>
        Your shared history starts here — every session, note, and milestone will build over time.
      </p>

      {/* Confirmation card */}
      <div style={{
        width: "100%", padding: "20px", background: T.avatarBg, borderRadius: "16px",
        display: "flex", alignItems: "center", gap: "14px", marginBottom: "40px",
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%", background: T.hero,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          {provider?.avatar || provider?.photo ? (
            <img
              src={provider.avatar || provider.photo}
              alt={displayName}
              style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontFamily: F, fontSize: "16px", fontWeight: 400, color: T.ink }}>{providerInitials}</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: F, fontSize: "15px", fontWeight: 500, color: T.ink, margin: "0 0 2px" }}>{displayName}</p>
          {subtitle && <p style={{ fontFamily: F, fontSize: "12px", color: T.muted, margin: 0 }}>{subtitle}</p>}
        </div>
        <div style={{ padding: "4px 10px", borderRadius: "9999px", background: T.successBg }}>
          <Lbl color={T.success} style={{ fontSize: "10px", margin: 0 }}>Connected</Lbl>
        </div>
      </div>

      <button
        onClick={() => navigate("/app")}
        style={{
          width: "100%", padding: "16px", borderRadius: "12px", border: "none",
          background: T.ink, color: "#fff", fontFamily: F, fontSize: "14px",
          fontWeight: 500, cursor: "pointer",
        }}
      >
        Go to My Kliques
      </button>

      <div style={{ marginTop: "32px", textAlign: "center" }}>
        <Lbl color={T.faded} style={{ fontSize: "10px" }}>Powered by Kliques</Lbl>
      </div>
    </div>
  );
}

// ─── Parent: InviteFlow ───────────────────────────────────────────────────────
function InviteFlow() {
  const { code } = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useSession();

  const [screen, setScreen] = useState("loading");
  const [provider, setProvider] = useState(null);
  const [invalidReason, setInvalidReason] = useState(null);

  useEffect(() => {
    if (!code) {
      setInvalidReason("not_found");
      setScreen("invalid");
      return;
    }

    // AuthCallback redirects here with ?accepted=true
    if (searchParams.get("accepted") === "true") {
      loadProviderAndShow(code, "connected");
      return;
    }

    sessionStorage.setItem(INVITE_KEY, code);
    loadInvite(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProviderAndShow = async (inviteCode, targetScreen) => {
    try {
      const data = await request(`/provider/invites/join/${inviteCode}`);
      if (data.provider) setProvider(data.provider);
    } catch {
      // Non-fatal
    }
    setScreen(targetScreen);
  };

  const loadInvite = async (inviteCode) => {
    try {
      const data = await request(`/provider/invites/join/${inviteCode}`);
      if (!data.valid) {
        setInvalidReason(data.reason || "not_found");
        setScreen("invalid");
        return;
      }
      setProvider(data.provider);

      // Already authenticated — accept immediately
      if (session) {
        await acceptAndAdvance(inviteCode);
        return;
      }

      setScreen("landing");
    } catch {
      setInvalidReason("not_found");
      setScreen("invalid");
    }
  };

  const acceptAndAdvance = async (inviteCode) => {
    try {
      await request(`/invites/${inviteCode}/accept`, { method: "POST" });
      sessionStorage.removeItem(INVITE_KEY);
    } catch {
      sessionStorage.removeItem(INVITE_KEY);
    }
    setScreen("connected");
  };

  if (screen === "loading") return <LoadingScreen />;
  if (screen === "invalid") return <ScreenInvalidInvite reason={invalidReason} />;

  if (screen === "landing") {
    return (
      <ScreenLanding
        provider={provider}
        onAccept={() => setScreen("signup")}
        onAlreadyHaveAccount={() => setScreen("magic_link")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <ScreenSignup
        inviteCode={code}
        provider={provider}
        onSuccess={() => setScreen("connected")}
      />
    );
  }

  if (screen === "magic_link") {
    return (
      <ScreenMagicLink
        inviteCode={code}
        provider={provider}
        onSuccess={() => setScreen("connected")}
      />
    );
  }

  if (screen === "connected") {
    return (
      <ScreenConnected
        provider={provider}
        clientName={session?.user?.user_metadata?.full_name}
      />
    );
  }

  return null;
}

export { INVITE_KEY };
export default InviteFlow;
