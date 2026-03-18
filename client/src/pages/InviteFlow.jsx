import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import { request } from "../data/apiClient";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Footer from "../components/ui/Footer";
import Logo from "../components/ui/Logo";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT      = "#FF751F";
const ACCENT_LIGHT = "#FFF0E6";
const BG          = "#F2F2F7";
const FG          = "#0D1619";
const MUTED       = "#6B7280";
const DIVIDER     = "#E5E5EA";
const SUCCESS_BG  = "#F0FDF4";
const SUCCESS_FG  = "#22C55E";
const GRADIENT    = "linear-gradient(180deg,#D45400 0%,#E87020 40%,#F09050 65%,#F5C4A0 82%,#F2F2F7 100%)";

// sessionStorage key for the invite code
const INVITE_KEY = "kliques.pending_invite_code";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatCategory(cat) {
  if (!cat) return "";
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Skeleton placeholders ────────────────────────────────────────────────────
function Skeleton({ width = "100%", height = 16, radius = 8, className = "" }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{ width, height, borderRadius: radius, background: "#E5E5EA" }}
    />
  );
}

function LoadingScreen() {
  return (
    <div className="flex flex-col min-h-screen font-manrope" style={{ background: BG }}>
      {/* Gradient stub */}
      <div
        style={{
          background: GRADIENT,
          borderRadius: "0 0 28px 28px",
          paddingBottom: 48,
          marginBottom: -20,
          zIndex: 1,
          position: "relative",
          padding: "20px 20px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Skeleton width={80} height={80} radius={40} />
        <Skeleton width={160} height={22} />
        <Skeleton width={120} height={16} />
      </div>
      <div className="px-4 pt-10 flex flex-col gap-3" style={{ zIndex: 2, position: "relative" }}>
        <Skeleton height={80} radius={16} />
        <Skeleton height={56} radius={16} />
        <Skeleton height={56} radius={16} />
      </div>
    </div>
  );
}

// ─── Screen 1 — Invite Landing ───────────────────────────────────────────────
function ScreenLanding({ provider, onAccept, onAlreadyHaveAccount }) {
  const displayName = provider.business_name || provider.name || "Your Provider";
  const initials    = getInitials(displayName);
  const photoSrc    = provider.photo || provider.avatar || null;

  return (
    <div className="flex flex-col min-h-screen font-manrope" style={{ background: BG }}>
      {/* Gradient header */}
      <div
        style={{
          background: GRADIENT,
          borderRadius: "0 0 28px 28px",
          paddingBottom: 48,
          marginBottom: -20,
          zIndex: 1,
          position: "relative",
        }}
      >
        {/* Logo row */}
        <div className="flex justify-center pt-4 pb-2">
          <Logo size={18} color="white" />
        </div>

        {/* Provider identity */}
        <div className="flex flex-col items-center px-5 pb-2 gap-3">
          <Avatar
            src={photoSrc}
            initials={initials}
            size={80}
            variant="glass"
          />
          <div className="text-center">
            <p
              className="font-manrope font-bold m-0 mb-1"
              style={{ fontSize: 22, color: "#fff" }}
            >
              {displayName}
            </p>
            <p
              className="font-manrope text-[14px] m-0"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {[formatCategory(provider.category), provider.city]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
      </div>

      {/* Below gradient */}
      <div
        className="flex-1 px-4 pb-4 flex flex-col"
        style={{ paddingTop: 36, zIndex: 2, position: "relative" }}
      >
        <Card className="mb-3">
          <p className="font-manrope text-[15px] m-0 mb-4" style={{ color: FG, lineHeight: 1.6 }}>
            <strong>{displayName}</strong> invited you to connect on kliques — where your booking
            history and relationship live in one place.
          </p>

          {[
            { icon: "📋", text: "Your full history together, automatically saved" },
            { icon: "💳", text: "Book and pay seamlessly through the platform" },
            { icon: "💬", text: "Provider notes and personalised recommendations" },
          ].map((point) => (
            <div key={point.text} className="flex items-start gap-3 mb-3 last:mb-0">
              <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                {point.icon}
              </span>
              <p
                className="font-manrope text-[14px] m-0"
                style={{ color: MUTED, lineHeight: 1.55 }}
              >
                {point.text}
              </p>
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-3 mt-2">
          <button
            onClick={onAccept}
            className="w-full py-4 rounded-xl font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{ background: FG, border: "none", cursor: "pointer" }}
          >
            Accept Invite
          </button>
          <button
            onClick={onAlreadyHaveAccount}
            className="w-full font-manrope text-[15px] font-semibold focus:outline-none"
            style={{
              background: "none",
              border: "none",
              color: ACCENT,
              cursor: "pointer",
              padding: "10px 0",
            }}
          >
            I already have an account
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── Invalid invite screen ────────────────────────────────────────────────────
function ScreenInvalidInvite({ reason }) {
  const navigate = useNavigate();
  const messages = {
    not_found:        { title: "Link not found", body: "This invite link doesn't exist. It may have been removed or mistyped." },
    already_accepted: { title: "Already accepted", body: "This invite link has already been used. Ask your provider to send a new one." },
    expired:          { title: "Link expired", body: "This invite link has expired. Ask your provider to send a fresh one." },
  };
  const msg = messages[reason] || { title: "Invalid link", body: "This invite link is no longer valid." };

  return (
    <div className="flex flex-col min-h-screen font-manrope" style={{ background: BG }}>
      <div className="flex justify-center pt-6 pb-4">
        <Logo size={18} color="accent" />
      </div>
      <div className="flex-1 px-4 flex flex-col justify-center pb-16">
        <Card className="text-center py-8">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#FEF2F2" }}
          >
            <svg width="28" height="28" fill="none" stroke="#EF4444" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h2 className="font-manrope text-[20px] font-bold m-0 mb-2" style={{ color: FG }}>
            {msg.title}
          </h2>
          <p className="font-manrope text-[14px] m-0" style={{ color: MUTED, lineHeight: 1.6 }}>
            {msg.body}
          </p>
        </Card>
        <button
          onClick={() => navigate("/")}
          className="mt-4 font-manrope text-[14px] font-semibold focus:outline-none"
          style={{ color: ACCENT, background: "none", border: "none", cursor: "pointer" }}
        >
          Go to kliques
        </button>
      </div>
      <Footer />
    </div>
  );
}

// ─── Screen 2 — Quick Signup ──────────────────────────────────────────────────
function ScreenSignup({ inviteCode, provider, onSuccess }) {
  const toast = useToast();
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit =
    name.trim() && email.trim() && phone.trim() && isValidEmail(email);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      // The invite code stays in sessionStorage — AuthCallback will call
      // POST /api/provider/invites/join/:code/accept after the magic link
      // authenticates the user (when client_id is valid).
      onSuccess();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      toast.push({ title: "Signup failed", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${DIVIDER}`,
    background: BG,
    fontFamily: "Manrope, sans-serif",
    fontSize: 15,
    color: FG,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="flex flex-col min-h-screen font-manrope" style={{ background: BG }}>
      {/* Logo */}
      <div className="flex justify-center pt-6 pb-2">
        <Logo size={22} color="accent" />
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col pt-4">
        <div className="mb-5 text-center">
          <h1 className="font-manrope text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
            Create your account
          </h1>
          <p className="font-manrope text-[14px] m-0" style={{ color: MUTED }}>
            Join kliques to connect with{" "}
            <strong style={{ color: FG }}>
              {provider?.business_name || provider?.name || "your provider"}
            </strong>
          </p>
        </div>

        <Card>
          <div className="mb-4">
            <p className="font-manrope text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>
              Full Name
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Jordan Lee"
              style={inputStyle}
              autoComplete="name"
            />
          </div>

          <div className="mb-4">
            <p className="font-manrope text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>
              Email
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div className="mb-1">
            <p className="font-manrope text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>
              Phone Number
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={inputStyle}
              autoComplete="tel"
            />
            <p className="font-manrope text-[12px] mt-2 m-0" style={{ color: MUTED }}>
              We'll send you a login link — no password needed.
            </p>
          </div>
        </Card>

        {error && (
          <p className="font-manrope text-[13px] text-center mt-3 m-0" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        <div className="mt-4">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-4 rounded-xl font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{
              background: canSubmit && !submitting ? FG : "#B0B0B0",
              border: "none",
              cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting && (
              <span
                className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"
              />
            )}
            {submitting ? "Creating account…" : "Continue"}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ─── Screen 2b — Magic Link (existing account) ───────────────────────────────
function ScreenMagicLink({ inviteCode, provider, onSuccess }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const [sending, setSending] = useState(false);
  const { session } = useSession();

  // If the user is already authenticated when this screen mounts (e.g. they
  // refreshed after a previous login), accept immediately and advance.
  useEffect(() => {
    if (!session || !inviteCode) return;
    request(`/provider/invites/join/${inviteCode}/accept`, { method: "POST" })
      .then(() => {
        sessionStorage.removeItem(INVITE_KEY); // clear only on success
        onSuccess();
      })
      .catch(() => {
        // Still advance — relationship may already exist (idempotent upsert)
        sessionStorage.removeItem(INVITE_KEY);
        onSuccess();
      });
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async () => {
    if (!isValidEmail(email)) return;
    setSending(true);
    try {
      // Existing user — send a magic login link (not a signup link)
      await request("/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      // Keep invite code in sessionStorage — AuthCallback will handle accept
      setSent(true);
    } catch (err) {
      toast.push({ title: "Couldn't send link", description: err.message, variant: "error" });
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${DIVIDER}`,
    background: BG,
    fontFamily: "Manrope, sans-serif",
    fontSize: 15,
    color: FG,
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div className="flex flex-col min-h-screen font-manrope" style={{ background: BG }}>
      <div className="flex justify-center pt-6 pb-2">
        <Logo size={22} color="accent" />
      </div>

      <div className="flex-1 px-4 pb-4 flex flex-col pt-4">
        <div className="mb-5 text-center">
          <h1 className="font-manrope text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
            Sign in to kliques
          </h1>
          <p className="font-manrope text-[14px] m-0" style={{ color: MUTED }}>
            We'll send a magic link to your email — no password needed.
          </p>
        </div>

        {sent ? (
          <Card className="text-center py-8">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: SUCCESS_BG }}
            >
              <svg width="26" height="26" fill="none" stroke={SUCCESS_FG} strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-manrope text-[16px] font-semibold m-0 mb-1" style={{ color: FG }}>
              Check your inbox
            </p>
            <p className="font-manrope text-[14px] m-0" style={{ color: MUTED, lineHeight: 1.6 }}>
              We sent a magic link to <strong style={{ color: FG }}>{email}</strong>.
              Tap it to sign in and complete your connection.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="mb-1">
              <p className="font-manrope text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>
                Email
              </p>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                autoComplete="email"
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
          </Card>
        )}

        {!sent && (
          <div className="mt-4">
            <button
              onClick={handleSend}
              disabled={!isValidEmail(email) || sending}
              className="w-full py-4 rounded-xl font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              style={{
                background: isValidEmail(email) && !sending ? FG : "#B0B0B0",
                border: "none",
                cursor: isValidEmail(email) && !sending ? "pointer" : "not-allowed",
              }}
            >
              {sending && (
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {sending ? "Sending…" : "Send magic link"}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ─── Screen 3 — Connected ─────────────────────────────────────────────────────
function ScreenConnected({ provider }) {
  const navigate  = useNavigate();
  const displayName = provider?.business_name || provider?.name || "Your Provider";
  const initials    = getInitials(displayName);
  const photoSrc    = provider?.photo || provider?.avatar || null;

  return (
    <div
      className="flex flex-col items-center min-h-screen font-manrope px-4 text-center"
      style={{ background: BG, paddingTop: 48, paddingBottom: 32 }}
    >
      {/* Success icon */}
      <div
        className="flex items-center justify-center rounded-full mb-6"
        style={{ width: 72, height: 72, background: SUCCESS_BG, flexShrink: 0 }}
      >
        <svg width="32" height="32" fill="none" stroke={SUCCESS_FG} strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Headline */}
      <h1
        className="font-manrope text-[28px] font-bold m-0 mb-3"
        style={{ color: FG, lineHeight: 1.25 }}
      >
        You're connected with{" "}
        <span style={{ color: FG }}>{displayName}.</span>
      </h1>

      {/* Body */}
      <p
        className="font-manrope text-[15px] m-0 mb-8"
        style={{ color: MUTED, lineHeight: 1.6, maxWidth: 320 }}
      >
        Your history together will build here over time — bookings, notes, and everything in between.
      </p>

      {/* Provider card */}
      <Card className="w-full mb-8">
        <div className="flex items-center gap-3.5">
          <Avatar
            src={photoSrc}
            initials={initials}
            size={52}
            variant="accent"
          />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-manrope text-[16px] font-semibold m-0 mb-0.5 truncate" style={{ color: FG }}>
              {displayName}
            </p>
            <p className="font-manrope text-[13px] m-0" style={{ color: MUTED }}>
              {formatCategory(provider?.category) || "Service Provider"}
            </p>
          </div>
          <Badge label="Connected" variant="accent" />
        </div>
      </Card>

      {/* CTA */}
      <button
        onClick={() => navigate("/app")}
        className="w-full py-4 rounded-xl font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
        style={{ background: FG, border: "none", cursor: "pointer" }}
      >
        Go to My kliques
      </button>

      <div className="mt-auto pt-8 w-full">
        <Footer />
      </div>
    </div>
  );
}

// ─── Parent: InviteFlow ───────────────────────────────────────────────────────
// Screens: "loading" | "landing" | "invalid" | "signup" | "magic_link" | "connected"

function InviteFlow() {
  const { code }          = useParams();
  const [searchParams]    = useSearchParams();
  const { session }       = useSession();
  const toast             = useToast();

  const [screen,   setScreen]   = useState("loading");
  const [invite,   setInvite]   = useState(null);
  const [provider, setProvider] = useState(null);
  const [invalidReason, setInvalidReason] = useState(null);

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!code) {
      setInvalidReason("not_found");
      setScreen("invalid");
      return;
    }

    // AuthCallback redirects here with ?accepted=true after successfully calling
    // the accept endpoint. Fetch the provider info and show the connected screen.
    if (searchParams.get("accepted") === "true") {
      loadProviderAndShow(code, "connected");
      return;
    }

    // Normal entry: store the code so AuthCallback can use it after magic link
    sessionStorage.setItem(INVITE_KEY, code);
    loadInvite(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch provider info for the connected screen (invite may be accepted so
  // we fall back to extracting provider from the invite lookup even if !valid)
  const loadProviderAndShow = async (inviteCode, targetScreen) => {
    try {
      const data = await request(`/provider/invites/join/${inviteCode}`);
      if (data.provider) setProvider(data.provider);
    } catch {
      // Non-fatal — show connected screen even without fresh provider data
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
      setInvite(data.invite);
      setProvider(data.provider);

      // Already authenticated — accept immediately and show connected screen
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
      await request(`/provider/invites/join/${inviteCode}/accept`, { method: "POST" });
      sessionStorage.removeItem(INVITE_KEY); // clear only after successful accept
    } catch {
      // Idempotent — relationship may already exist; still advance
      sessionStorage.removeItem(INVITE_KEY);
    }
    setScreen("connected");
  };

  // ── Landing CTAs ──────────────────────────────────────────────────────────
  const handleAcceptInvite = () => setScreen("signup");
  const handleAlreadyHaveAccount = () => setScreen("magic_link");

  // ── Signup success ────────────────────────────────────────────────────────
  const handleSignupSuccess = () => setScreen("connected");

  // ── Render ────────────────────────────────────────────────────────────────
  if (screen === "loading") return <LoadingScreen />;

  if (screen === "invalid") return <ScreenInvalidInvite reason={invalidReason} />;

  if (screen === "landing") {
    return (
      <ScreenLanding
        provider={provider}
        onAccept={handleAcceptInvite}
        onAlreadyHaveAccount={handleAlreadyHaveAccount}
      />
    );
  }

  if (screen === "signup") {
    return (
      <ScreenSignup
        inviteCode={code}
        provider={provider}
        onSuccess={handleSignupSuccess}
      />
    );
  }

  if (screen === "magic_link") {
    return (
      <ScreenMagicLink
        inviteCode={code}
        provider={provider}
        onSuccess={handleSignupSuccess}
      />
    );
  }

  if (screen === "connected") {
    return <ScreenConnected provider={provider} />;
  }

  return null;
}

export { INVITE_KEY };
export default InviteFlow;
