import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "../auth/authContext";
import { request } from "../data/apiClient";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import Footer from "../components/ui/Footer";
import Logo from "../components/ui/Logo";
import Nav from "../components/ui/Nav";

// ─── Stripe ───────────────────────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "");

// ─── Design tokens ────────────────────────────────────────────────────────────
const ACCENT = "#C25E4A";
const ACCENT_LIGHT = "#FFF0E6";
const BG = "#FBF7F2";
const FG = "#3D231E";
const MUTED = "#6B7280";
const DIVIDER = "rgba(140,106,100,0.2)";
const SUCCESS_BG = "#F0FDF4";
const SUCCESS_FG = "#22C55E";
const GRADIENT =
  "linear-gradient(180deg,#D45400 0%,#E87020 40%,#F09050 65%,#F5C4A0 82%,#FBF7F2 100%)";

// sessionStorage keys
const SS_PREFIX = "kliques.pub_booking.";
const SS = {
  provider:      SS_PREFIX + "provider",
  services:      SS_PREFIX + "services",
  selectedSvc:   SS_PREFIX + "selectedSvc",
  selectedSlot:  SS_PREFIX + "selectedSlot",
  email:         SS_PREFIX + "email",
  bookingResult: SS_PREFIX + "bookingResult",
  isNewUser:     SS_PREFIX + "isNewUser",   // true = Path B (new account)
  pendingPmId:   SS_PREFIX + "pendingPmId", // Stripe PM id stored pre-magic-link
  pendingName:   SS_PREFIX + "pendingName", // new user's name for profile upsert
};

function ssGet(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}
function ssSet(key, val) {
  sessionStorage.setItem(key, JSON.stringify(val));
}
function ssClear() {
  Object.values(SS).forEach((k) => sessionStorage.removeItem(k));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function fmtPrice(cents) {
  if (cents == null) return "—";
  return "$" + (cents / 100).toFixed(2);
}

function calcDeposit(service, priceOverride) {
  const total = priceOverride ?? (service?.base_price ?? 0); // cents
  if (service?.payment_type !== "deposit") return { isDeposit: false, total, deposit: total, remaining: 0 };
  let deposit;
  if (service.deposit_type === "percent") {
    deposit = Math.round((total * (service.deposit_value || 0)) / 100);
  } else {
    deposit = Math.round((service.deposit_value || 0) * 100);
  }
  return { isDeposit: true, total, deposit, remaining: total - deposit };
}

function formatDate(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function formatTime(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function brandIcon(brand) {
  const icons = { visa: "💳", mastercard: "💳", amex: "💳", discover: "💳" };
  return icons[brand?.toLowerCase()] || "💳";
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function PageShell({ children, onBack, title }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Sora', system-ui, sans-serif",
      }}
    >
      <Nav onBack={onBack} title={title} />
      <div style={{ flex: 1, padding: "0 16px 32px", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}

function StickyBar({ children, disabled, loading, onClick, label }) {
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        padding: "12px 16px 28px",
        background: "rgba(242,242,247,0.95)",
        backdropFilter: "blur(8px)",
        borderTop: `0.5px solid ${DIVIDER}`,
        marginLeft: -16,
        marginRight: -16,
      }}
    >
      {children || (
        <button
          onClick={onClick}
          disabled={disabled || loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "none",
            background: disabled || loading ? "#C7C7CC" : FG,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Sora', system-ui, sans-serif",
            cursor: disabled || loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Please wait…" : label}
        </button>
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: GRADIENT,
          borderRadius: "0 0 28px 28px",
          padding: "48px 24px 56px",
          marginBottom: -16,
        }}
      >
        <Logo size={24} color="white" />
      </div>
      <div style={{ padding: "28px 16px" }}>
        {[180, 140, 120, 100].map((w, i) => (
          <div
            key={i}
            style={{
              height: 16,
              width: w,
              borderRadius: 8,
              background: DIVIDER,
              marginBottom: 12,
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ProviderHero({ provider }) {
  return (
    <div
      style={{
        background: GRADIENT,
        borderRadius: "0 0 28px 28px",
        padding: "20px 24px 56px",
        marginBottom: -16,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <Avatar
        initials={initials(provider?.name)}
        src={provider?.avatar}
        size={64}
        variant="glass"
      />
      <div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 2,
          }}
        >
          {provider?.business_name || provider?.name}
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
          {provider?.category?.replace(/_/g, " ")} · {provider?.city}
        </div>
        {provider?.rating && (
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
            ★ {parseFloat(provider.rating).toFixed(1)}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 1: Provider + Services ─────────────────────────────────────────────
function StepServices({ provider, services, onNext }) {
  const [selected, setSelected] = useState([]);

  function toggle(svc) {
    setSelected((prev) =>
      prev.some((s) => s.id === svc.id) ? prev.filter((s) => s.id !== svc.id) : [...prev, svc]
    );
  }

  function handleContinue() {
    ssSet(SS.selectedSvc, selected[0]); // single service for now
    onNext(selected[0]);
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", fontFamily: "'Sora', system-ui, sans-serif" }}>
      <ProviderHero provider={provider} />
      <div style={{ flex: 1, padding: "24px 16px 0" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: FG, margin: "0 0 16px" }}>
          Select a service
        </h2>
        {services.map((svc) => {
          const isSel = selected.some((s) => s.id === svc.id);
          const dep = calcDeposit(svc);
          return (
            <Card key={svc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, paddingRight: 16 }}>
                <p style={{ fontSize: 17, fontWeight: 600, color: FG, margin: "0 0 4px" }}>
                  {svc.name}
                </p>
                <p style={{ fontSize: 14, color: MUTED, margin: "0 0 6px" }}>
                  {svc.duration}
                </p>
                <p style={{ fontSize: 15, fontWeight: 600, color: FG, margin: 0 }}>
                  {fmtPrice(svc.base_price)}
                  {dep.isDeposit && (
                    <span style={{ fontSize: 12, color: MUTED, fontWeight: 400 }}>
                      {" "}· {fmtPrice(dep.deposit)} deposit
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => toggle(svc)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: isSel ? "none" : `1.5px solid ${DIVIDER}`,
                  background: isSel ? ACCENT : "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  flexShrink: 0,
                  marginTop: 4,
                }}
                aria-label={isSel ? "Deselect" : "Select"}
              >
                <svg width="16" height="16" fill="none" stroke={isSel ? "#fff" : FG} strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    d={isSel ? "M5 13l4 4L19 7" : "M12 5v14M5 12h14"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </Card>
          );
        })}
      </div>
      <StickyBar
        disabled={selected.length === 0}
        onClick={handleContinue}
        label={selected.length > 0 ? `${selected.length} selected · Continue` : "Select a service"}
      />
    </div>
  );
}

// ─── Step 2: Select Time ──────────────────────────────────────────────────────
function StepTime({ provider, service, onNext, onBack }) {
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Build the next 7 days
  const today = new Date();
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return d;
  });
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const selectedDate = dates[selectedDateIdx];

  useEffect(() => {
    if (!provider?.id) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    const dateStr = selectedDate.toISOString().slice(0, 10);
    request(`/provider/${provider.id}/availability?startDate=${dateStr}&endDate=${dateStr}&limit=20`)
      .then((data) => setSlots(data?.availability || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [provider?.id, selectedDateIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleContinue() {
    ssSet(SS.selectedSlot, selectedSlot);
    onNext(selectedSlot);
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <PageShell onBack={onBack} title="Select time">
      {/* Date row */}
      <Card style={{ display: "flex", gap: 8, justifyContent: "center", padding: "20px 8px", marginTop: 12 }}>
        {dates.map((d, i) => {
          const isSel = i === selectedDateIdx;
          return (
            <button
              key={i}
              onClick={() => setSelectedDateIdx(i)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: isSel ? ACCENT : "transparent",
                  border: isSel ? "none" : `1.5px solid ${DIVIDER}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 17, fontWeight: 700, color: isSel ? "#fff" : FG }}>
                  {d.getDate()}
                </span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>
                {DAY_LABELS[d.getDay()]}
              </span>
            </button>
          );
        })}
      </Card>

      <p style={{ fontSize: 15, fontWeight: 700, color: FG, margin: "8px 0 12px" }}>
        Available times
      </p>

      {loadingSlots ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : slots.length === 0 ? (
        <Card>
          <p style={{ color: MUTED, fontSize: 14, textAlign: "center", margin: 0 }}>
            No availability on this day
          </p>
        </Card>
      ) : (
        slots.map((slot) => {
          const isSel = selectedSlot?.id === slot.id;
          return (
            <Card
              key={slot.id}
              onClick={() => setSelectedSlot(slot)}
              style={{
                border: isSel ? `2px solid ${ACCENT}` : "1px solid transparent",
                cursor: "pointer",
                padding: "14px 16px",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500, color: FG }}>
                {formatTime(slot.datetime)}
              </span>
            </Card>
          );
        })
      )}

      <StickyBar
        disabled={!selectedSlot}
        onClick={handleContinue}
        label="Continue"
      />
    </PageShell>
  );
}

// ─── Step 3: Email Check ──────────────────────────────────────────────────────
function StepEmail({ onNext, onBack }) {
  const [email, setEmail] = useState(ssGet(SS.email) || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { exists } = await request("/auth/check-email", {
        method: "POST",
        body: JSON.stringify({ email: trimmed }),
      });
      ssSet(SS.email, trimmed);
      onNext({ email: trimmed, exists });
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell onBack={onBack}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 400, margin: "0 auto", width: "100%", paddingTop: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: FG, margin: "0 0 8px" }}>
          Almost there
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 28px" }}>
          Enter your email to continue.
        </p>
        <Card>
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: FG, marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="you@example.com"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: `1px solid ${DIVIDER}`,
                background: BG,
                fontSize: 16,
                fontFamily: "'Sora', system-ui, sans-serif",
                color: FG,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            {error && (
              <p style={{ fontSize: 13, color: "#EF4444", margin: "8px 0 0" }}>{error}</p>
            )}
          </form>
        </Card>
        <button
          onClick={handleSubmit}
          disabled={!email.trim() || loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "none",
            background: !email.trim() || loading ? "#C7C7CC" : FG,
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "'Sora', system-ui, sans-serif",
            cursor: !email.trim() || loading ? "not-allowed" : "pointer",
            marginTop: 4,
          }}
        >
          {loading ? "Checking…" : "Continue"}
        </button>
      </div>
    </PageShell>
  );
}

// ─── Path A — Step A4: Magic Link Sent ───────────────────────────────────────
function StepMagicLink({ email, onBack }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sendLink();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function sendLink() {
    setSent(false);
    setLoading(true);
    setError("");
    try {
      await request("/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell onBack={onBack}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: 24,
          maxWidth: 380,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: ACCENT_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg width="32" height="32" fill="none" stroke={ACCENT} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: FG, margin: "0 0 12px" }}>
          Check your email
        </h1>
        {loading ? (
          <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: 0 }}>Sending…</p>
        ) : error ? (
          <>
            <p style={{ fontSize: 14, color: "#EF4444", margin: "0 0 16px" }}>{error}</p>
            <button
              onClick={sendLink}
              style={{ color: ACCENT, background: "none", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
            >
              Resend link
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: "0 0 16px" }}>
              We sent a login link to <strong style={{ color: FG }}>{email}</strong>. Tap it to continue your booking.
            </p>
            <p style={{ fontSize: 13, color: MUTED, margin: "0 0 24px" }}>
              Your booking details are saved — nothing will be lost.
            </p>
            <button
              onClick={sendLink}
              style={{ color: ACCENT, background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}
            >
              Resend link
            </button>
          </>
        )}
      </div>
    </PageShell>
  );
}

// ─── Path B — Magic link sent screen (after new account creation) ────────────
function StepMagicLinkNew({ email, onBack }) {
  const [resending, setResending] = useState(false);

  async function resend() {
    setResending(true);
    try {
      await request("/auth/signup", {
        method: "POST",
        // name/phone from sessionStorage so we don't ask again
        body: JSON.stringify({
          name: ssGet(SS.pendingName) || "",
          email,
          phone: "resend",
        }),
      });
    } catch { /* non-fatal */ }
    finally { setResending(false); }
  }

  return (
    <PageShell onBack={onBack}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          paddingTop: 24,
          maxWidth: 380,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: ACCENT_LIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg width="32" height="32" fill="none" stroke={ACCENT} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: FG, margin: "0 0 12px" }}>
          Check your email
        </h1>
        <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.6, margin: "0 0 8px" }}>
          We sent a link to <strong style={{ color: FG }}>{email}</strong>.
        </p>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
          Tap it to confirm your account — your booking details and payment are saved and will be completed automatically.
        </p>
        <button
          onClick={resend}
          disabled={resending}
          style={{ color: ACCENT, background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Sora', system-ui, sans-serif" }}
        >
          {resending ? "Sending…" : "Resend link"}
        </button>
      </div>
    </PageShell>
  );
}

// ─── Path B — Resume booking after magic link (runs with active session) ──────
function StepResumeBooking({ provider, service, slot, onConfirmed }) {
  const stripeRef = useStripe();
  const [error, setError] = useState("");

  useEffect(() => {
    completeBooking();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function completeBooking() {
    const pmId = ssGet(SS.pendingPmId);
    const name = ssGet(SS.pendingName);
    const email = ssGet(SS.email);
    const dep = calcDeposit(service);

    try {
      // 1. Save the payment method via setup intent (now we have a valid session/userId)
      if (pmId) {
        try {
          const { clientSecret } = await request("/payments/setup-intent", {
            method: "POST",
            body: JSON.stringify({ email, name }),
          });
          if (clientSecret && stripeRef) {
            await stripeRef.confirmCardSetup(clientSecret, { payment_method: pmId });
          }
        } catch (siErr) {
          console.warn("[resume] setup-intent:", siErr.message);
        }
      }

      // 2. Create the booking — session is now active so userId is valid
      const { bookingId } = await request("/bookings/create", {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          providerId: provider.id,
          scheduledAt: slot?.datetime,
          price: dep.total / 100,
          depositAmount: dep.isDeposit ? dep.deposit / 100 : null,
          paymentMethodId: pmId,
          saveCard: true,
        }),
      });

      // 3. Send password setup email
      request("/auth/send-password-setup", {
        method: "POST",
        body: JSON.stringify({ email }),
      }).catch(() => {});

      const result = { bookingId, service, provider, slot, dep, isNewUser: true, name };
      ssSet(SS.bookingResult, result);
      ssClear();
      onConfirmed(result);
    } catch (err) {
      setError(err.message || "Failed to complete booking. Please try again.");
    }
  }

  if (error) {
    return (
      <PageShell>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 16, color: "#EF4444", marginBottom: 16 }}>{error}</p>
          <button
            onClick={completeBooking}
            style={{ color: ACCENT, background: "none", border: "none", fontSize: 15, fontWeight: 600, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "'Sora', system-ui, sans-serif" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(140,106,100,0.2)", borderTop: `3px solid ${ACCENT}`, borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <p style={{ color: MUTED, fontSize: 15 }}>Completing your booking…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Path A — Step A5: Payment (existing user) ────────────────────────────────
function PaymentCardForm({ onToken }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function createPM() {
    if (!stripe || !elements) return null;
    const card = elements.getElement(CardElement);
    const { paymentMethod, error: err } = await stripe.createPaymentMethod({
      type: "card",
      card,
    });
    if (err) { setError(err.message); return null; }
    return paymentMethod.id;
  }

  // Expose createPM via ref callback pattern
  useEffect(() => {
    if (onToken) onToken({ createPM });
  }); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${DIVIDER}`,
          background: BG,
        }}
      >
        <CardElement
          options={{ style: { base: { fontSize: "16px", fontFamily: "'Sora', system-ui, sans-serif", color: FG } } }}
          onChange={(e) => { setReady(e.complete); setError(e.error?.message || ""); }}
        />
      </div>
      {error && <p style={{ fontSize: 13, color: "#EF4444", margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}

function StepPaymentExisting({ service, provider, slot, onNext, onBack, session }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPm, setSelectedPm] = useState(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [saveCard, setSaveCard] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const newCardRef = useRef(null);

  const dep = calcDeposit(service);

  useEffect(() => {
    request("/payments/methods")
      .then((data) => {
        const pms = data?.paymentMethods || [];
        setPaymentMethods(pms);
        const def = pms.find((p) => p.isDefault) || pms[0];
        if (def) setSelectedPm(def);
        else setUseNewCard(true);
      })
      .catch(() => setUseNewCard(true))
      .finally(() => setLoading(false));
  }, []);

  async function handlePay() {
    setSubmitting(true);
    setError("");
    try {
      let pmId = selectedPm?.id;

      if (useNewCard) {
        const fn = newCardRef.current?.createPM;
        if (!fn) { setError("Card form not ready."); setSubmitting(false); return; }
        pmId = await fn();
        if (!pmId) { setSubmitting(false); return; }
      }

      const { bookingId } = await request("/bookings/create", {
        method: "POST",
        body: JSON.stringify({
          serviceId: service.id,
          providerId: provider.id,
          scheduledAt: slot?.datetime,
          price: dep.total / 100,
          depositAmount: dep.isDeposit ? dep.deposit / 100 : null,
          paymentMethodId: pmId,
          saveCard,
        }),
      });

      const result = { bookingId, service, provider, slot, dep, isNewUser: false };
      ssSet(SS.bookingResult, result);
      ssClear();
      onNext(result);
    } catch (err) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageShell onBack={onBack}><p style={{ color: MUTED, padding: 24 }}>Loading…</p></PageShell>;

  return (
    <PageShell onBack={onBack} title="Payment">
      {/* Booking summary */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: FG, margin: "20px 0 12px" }}>
        Booking summary
      </h2>
      <Card>
        {[
          ["Service", service.name],
          ["Duration", service.duration],
          ["Provider", provider.business_name || provider.name],
          ["Date", formatDate(slot?.datetime)],
          ["Time", formatTime(slot?.datetime)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: MUTED }}>{k}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: DIVIDER, margin: "8px 0" }} />
        {dep.isDeposit ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, color: MUTED }}>Due now (deposit)</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{fmtPrice(dep.deposit)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: MUTED }}>Due after service</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: MUTED }}>{fmtPrice(dep.remaining)}</span>
            </div>
            <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
              The remaining balance is collected by your provider after the appointment.
            </p>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>{fmtPrice(dep.total)}</span>
          </div>
        )}
      </Card>

      {/* Payment method */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: FG, margin: "16px 0 12px" }}>
        Payment method
      </h2>
      <Card>
        {!useNewCard && selectedPm ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 24 }}>{brandIcon(selectedPm.brand)}</span>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: FG, margin: 0 }}>
                    {selectedPm.brand?.charAt(0).toUpperCase() + selectedPm.brand?.slice(1)} ···· {selectedPm.last4}
                  </p>
                  <p style={{ fontSize: 13, color: MUTED, margin: 0 }}>
                    Expires {selectedPm.expMonth}/{selectedPm.expYear}
                  </p>
                </div>
              </div>
              {selectedPm.isDefault && (
                <Badge variant="success" label="Default" />
              )}
            </div>
            <button
              onClick={() => setUseNewCard(true)}
              style={{ color: ACCENT, background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: "'Sora', system-ui, sans-serif" }}
            >
              Use a different card
            </button>
          </>
        ) : (
          <>
            <Elements stripe={stripePromise}>
              <PaymentCardForm onToken={(ref) => { newCardRef.current = ref; }} />
            </Elements>
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={saveCard}
                onChange={(e) => setSaveCard(e.target.checked)}
                style={{ accentColor: ACCENT, width: 18, height: 18 }}
              />
              <span style={{ fontSize: 14, color: FG }}>Save this card for future bookings</span>
            </label>
            {paymentMethods.length > 0 && (
              <button
                onClick={() => { setUseNewCard(false); setSelectedPm(paymentMethods.find((p) => p.isDefault) || paymentMethods[0]); }}
                style={{ color: ACCENT, background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8, padding: 0, fontFamily: "'Sora', system-ui, sans-serif" }}
              >
                Use saved card
              </button>
            )}
          </>
        )}
      </Card>

      {error && (
        <p style={{ fontSize: 13, color: "#EF4444", margin: "0 0 12px" }}>{error}</p>
      )}

      <StickyBar
        disabled={!useNewCard && !selectedPm}
        loading={submitting}
        onClick={handlePay}
        label={dep.isDeposit ? `Pay ${fmtPrice(dep.deposit)} deposit` : `Pay ${fmtPrice(dep.total)}`}
      />
    </PageShell>
  );
}

// ─── Path A — Step A6: Booking Confirmed ─────────────────────────────────────
function StepConfirmedExisting({ result }) {
  const navigate = useNavigate();
  const { service, provider, slot, dep } = result || {};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Sora', system-ui, sans-serif",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px 32px", textAlign: "center" }}>
        {/* Success icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: SUCCESS_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg width="32" height="32" fill="none" stroke={SUCCESS_FG} strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: FG, margin: "0 0 8px" }}>
          You're booked!
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 32px", lineHeight: 1.6 }}>
          {service?.name} with {provider?.business_name || provider?.name}
        </p>

        {/* Receipt */}
        <Card style={{ width: "100%", textAlign: "left" }}>
          {[
            ["Service", service?.name],
            ["Duration", service?.duration],
            ["Provider", provider?.business_name || provider?.name],
            ["Date", formatDate(slot?.datetime)],
            ["Time", formatTime(slot?.datetime)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: MUTED }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: DIVIDER, margin: "8px 0" }} />
          {dep?.isDeposit ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: MUTED }}>Deposit paid</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{fmtPrice(dep.deposit)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: MUTED }}>Remaining (after service)</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: MUTED }}>{fmtPrice(dep.remaining)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>{fmtPrice(dep?.total)}</span>
            </div>
          )}
        </Card>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
          <button
            onClick={() => navigate("/app/messages")}
            style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: FG, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "'Sora', system-ui, sans-serif", cursor: "pointer" }}
          >
            Message {provider?.name?.split(" ")[0]}
          </button>
          <button
            onClick={() => navigate("/app")}
            style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${DIVIDER}`, background: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "'Sora', system-ui, sans-serif", color: FG, cursor: "pointer" }}
          >
            View my kliques
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Path B — Step B4: Create Account + Payment ───────────────────────────────
function StepCreateAccountPayment({ service, provider, slot, email, onNext, onBack }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const stripeRef = useStripe();
  const elementsRef = useElements();

  const dep = calcDeposit(service);

  async function handleSubmit() {
    if (!name.trim() || !phone.trim()) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      // 1. Tokenise the card NOW (before the magic link redirect clears Stripe state)
      const card = elementsRef?.getElement(CardElement);
      let pmId = null;
      if (card && stripeRef) {
        const { paymentMethod, error: pmErr } = await stripeRef.createPaymentMethod({
          type: "card",
          card,
          billing_details: { name: name.trim(), email },
        });
        if (pmErr) { setError(pmErr.message); setSubmitting(false); return; }
        pmId = paymentMethod.id;
      }

      // 2. Persist all booking data to sessionStorage so AuthCallback / resume
      //    can recreate the booking after the magic link authenticates the user.
      ssSet(SS.isNewUser, true);
      ssSet(SS.pendingPmId, pmId);
      ssSet(SS.pendingName, name.trim());
      // provider, selectedSvc, selectedSlot, email are already in sessionStorage

      // 3. Create auth account + send magic link
      //    The server also tries to pre-create the client_profiles row.
      await request("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email, phone: phone.trim() }),
      });

      // 4. Show the "check your email" screen — onNext advances to magic_link_new
      onNext();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: `1px solid ${DIVIDER}`,
    background: BG,
    fontSize: 16,
    fontFamily: "'Sora', system-ui, sans-serif",
    color: FG,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  };

  return (
    <PageShell onBack={onBack} title="Create account">
      <h2 style={{ fontSize: 20, fontWeight: 700, color: FG, margin: "20px 0 16px" }}>
        Create your account
      </h2>
      <Card>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: FG, marginBottom: 6 }}>Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          style={fieldStyle}
        />
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: FG, marginBottom: 6 }}>Phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 (555) 000-0000"
          style={fieldStyle}
        />

        <div style={{ height: 1, background: DIVIDER, margin: "4px 0 16px" }} />

        <p style={{ fontSize: 15, fontWeight: 700, color: FG, margin: "0 0 12px" }}>
          Payment details
        </p>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${DIVIDER}`,
            background: BG,
            marginBottom: 8,
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  fontFamily: "'Sora', system-ui, sans-serif",
                  color: FG,
                },
              },
            }}
          />
        </div>
        <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>
          Your card will be saved securely for future bookings.
        </p>
      </Card>

      {/* Booking summary */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: FG, margin: "16px 0 12px" }}>
        Booking summary
      </h2>
      <Card>
        {[
          ["Service", service?.name],
          ["Provider", provider?.business_name || provider?.name],
          ["Date", formatDate(slot?.datetime)],
          ["Time", formatTime(slot?.datetime)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, color: MUTED }}>{k}</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{v}</span>
          </div>
        ))}
        <div style={{ height: 1, background: DIVIDER, margin: "8px 0" }} />
        {dep.isDeposit ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 14, color: MUTED }}>Due now</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{fmtPrice(dep.deposit)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, color: MUTED }}>Due after service</span>
              <span style={{ fontSize: 14, color: MUTED }}>{fmtPrice(dep.remaining)}</span>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>Total</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>{fmtPrice(dep.total)}</span>
          </div>
        )}
      </Card>

      {error && <p style={{ fontSize: 13, color: "#EF4444", margin: "0 0 12px" }}>{error}</p>}

      <StickyBar
        disabled={!name.trim() || !phone.trim()}
        loading={submitting}
        onClick={handleSubmit}
        label={dep.isDeposit ? `Pay ${fmtPrice(dep.deposit)} deposit & Book` : "Pay & Book"}
      />
    </PageShell>
  );
}

// ─── Path B — Step B5: Confirmed + Account Notice ────────────────────────────
function StepConfirmedNew({ result }) {
  const navigate = useNavigate();
  const { service, provider, slot, dep, name } = result || {};

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Sora', system-ui, sans-serif",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 24px 32px", textAlign: "center" }}>
        {/* Success icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: SUCCESS_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg width="32" height="32" fill="none" stroke={SUCCESS_FG} strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: FG, margin: "0 0 8px" }}>
          You're booked!
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 32px", lineHeight: 1.6 }}>
          {service?.name} with {provider?.business_name || provider?.name}
        </p>

        {/* Receipt */}
        <Card style={{ width: "100%", textAlign: "left" }}>
          {[
            ["Service", service?.name],
            ["Duration", service?.duration],
            ["Provider", provider?.business_name || provider?.name],
            ["Date", formatDate(slot?.datetime)],
            ["Time", formatTime(slot?.datetime)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: MUTED }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: FG }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: DIVIDER, margin: "8px 0" }} />
          {dep?.isDeposit ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 14, color: MUTED }}>Deposit paid</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: FG }}>{fmtPrice(dep.deposit)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, color: MUTED }}>Remaining (to be collected after your appointment)</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: MUTED }}>{fmtPrice(dep.remaining)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>Total</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: FG }}>{fmtPrice(dep?.total)}</span>
            </div>
          )}
        </Card>

        {/* Account notice */}
        <Card style={{ width: "100%", textAlign: "left", background: ACCENT_LIGHT, border: `1px solid #FFD4B0` }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: FG, margin: "0 0 8px" }}>
            One more thing
          </p>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            We've emailed you a link to set up your password and view your full history with{" "}
            <strong style={{ color: FG }}>{provider?.business_name || provider?.name}</strong>.
          </p>
        </Card>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
          <button
            onClick={() => navigate("/app/messages")}
            style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: FG, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "'Sora', system-ui, sans-serif", cursor: "pointer" }}
          >
            Message {provider?.name?.split(" ")[0]}
          </button>
          <button
            onClick={() => navigate("/app")}
            style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px solid ${DIVIDER}`, background: "#fff", fontSize: 16, fontWeight: 600, fontFamily: "'Sora', system-ui, sans-serif", color: FG, cursor: "pointer" }}
          >
            View my kliques
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// ─── Inner flow (needs Stripe Elements context) ───────────────────────────────
function BookingFlowInner() {
  const { handle } = useParams();
  const [searchParams] = useSearchParams();
  const { session } = useSession();
  const [step, setStep] = useState("loading");

  // Data
  const [provider, setProvider] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [email, setEmail] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    const isResume = searchParams.get("resume") === "true";
    const savedProvider = ssGet(SS.provider);
    const savedServices = ssGet(SS.services);
    const savedSvc = ssGet(SS.selectedSvc);
    const savedSlot = ssGet(SS.selectedSlot);
    const savedEmail = ssGet(SS.email);
    const savedResult = ssGet(SS.bookingResult);
    const savedIsNewUser = ssGet(SS.isNewUser);

    // Already confirmed — show receipt immediately
    if (savedResult) {
      setBookingResult(savedResult);
      setStep(savedResult.isNewUser ? "confirmed_new" : "confirmed_existing");
      return;
    }

    const load = async () => {
      try {
        let prov = savedProvider;
        let svcs = savedServices;
        if (!prov) {
          const data = await request(`/provider/public/${handle}`);
          prov = data.provider;
          svcs = data.services;
          ssSet(SS.provider, prov);
          ssSet(SS.services, svcs);
        }
        setProvider(prov);
        setServices(svcs || []);
        if (savedSvc) setSelectedService(savedSvc);
        if (savedSlot) setSelectedSlot(savedSlot);
        if (savedEmail) setEmail(savedEmail);

        // ── Returning from magic link ──────────────────────────────────────
        if (isResume && session && savedSvc && savedSlot) {
          if (savedIsNewUser) {
            // Path B: session now valid — auto-complete the booking
            setStep("resume_booking");
          } else {
            // Path A: existing user — go to payment with saved card
            setStep("payment_existing");
          }
          return;
        }

        // ── Normal entry / partial resume ─────────────────────────────────
        if (savedSlot && savedEmail) {
          setStep("email");
        } else if (savedSlot) {
          setStep("email");
        } else if (savedSvc) {
          setStep("time");
        } else {
          setStep("services");
        }
      } catch (err) {
        console.error("[PublicBookingFlow load]", err);
        setStep("services");
      }
    };

    load();
  }, [handle]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Navigation helpers ────────────────────────────────────────────────────
  function goService(svc) {
    setSelectedService(svc);
    setStep("time");
  }

  function goTime(slot) {
    setSelectedSlot(slot);
    setStep("email");
  }

  function goEmailResult({ email: em, exists }) {
    setEmail(em);
    if (exists) {
      setStep("magic_link");
    } else {
      setStep("create_account");
    }
  }

  function goConfirmedExisting(result) {
    setBookingResult(result);
    setStep("confirmed_existing");
  }

  function goConfirmedNew(result) {
    setBookingResult(result);
    setStep("confirmed_new");
  }

  // Path B: account creation step done — show the magic link screen
  function goMagicLinkNew() {
    setStep("magic_link_new");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (step === "loading") return <LoadingScreen />;

  if (step === "services") {
    return (
      <StepServices
        provider={provider}
        services={services}
        onNext={goService}
      />
    );
  }

  if (step === "time") {
    return (
      <StepTime
        provider={provider}
        service={selectedService}
        onNext={goTime}
        onBack={() => setStep("services")}
      />
    );
  }

  if (step === "email") {
    return (
      <StepEmail
        onNext={goEmailResult}
        onBack={() => setStep("time")}
      />
    );
  }

  // Path A: existing user waiting for magic link
  if (step === "magic_link") {
    return (
      <StepMagicLink
        email={email}
        onBack={() => setStep("email")}
      />
    );
  }

  // Path A: payment with saved/new card
  if (step === "payment_existing") {
    return (
      <StepPaymentExisting
        service={selectedService}
        provider={provider}
        slot={selectedSlot}
        session={session}
        onNext={goConfirmedExisting}
        onBack={() => setStep("email")}
      />
    );
  }

  // Path B: collect name, phone, card → tokenise → send magic link
  if (step === "create_account") {
    return (
      <StepCreateAccountPayment
        service={selectedService}
        provider={provider}
        slot={selectedSlot}
        email={email}
        onNext={goMagicLinkNew}
        onBack={() => setStep("email")}
      />
    );
  }

  // Path B: waiting for magic link click
  if (step === "magic_link_new") {
    return (
      <StepMagicLinkNew
        email={email}
        onBack={() => setStep("create_account")}
      />
    );
  }

  // Path B: back on /book/:handle?resume=true after magic link — complete the booking
  if (step === "resume_booking") {
    return (
      <StepResumeBooking
        provider={provider}
        service={selectedService}
        slot={selectedSlot}
        onConfirmed={goConfirmedNew}
      />
    );
  }

  if (step === "confirmed_existing") {
    return <StepConfirmedExisting result={bookingResult} />;
  }

  if (step === "confirmed_new") {
    return <StepConfirmedNew result={bookingResult} />;
  }

  return null;
}

// ─── Root export (wraps in Elements for existing-user payment path) ───────────
export default function PublicBookingFlow() {
  return (
    <Elements stripe={stripePromise}>
      <BookingFlowInner />
    </Elements>
  );
}
