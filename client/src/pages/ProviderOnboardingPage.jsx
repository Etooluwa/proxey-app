import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import { request } from "../data/apiClient";
import { useCitySearch } from "../hooks/useCitySearch";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const t = {
  base:     "#FBF7F2",
  ink:      "#3D231E",
  muted:    "#8C6A64",
  faded:    "#B0948F",
  accent:   "#C25E4A",
  hero:     "#FDDCC6",
  avatarBg: "#F2EBE5",
  line:     "rgba(140,106,100,0.2)",
  success:  "#5A8A5E",
  successBg:"#EBF2EC",
  card:     "#FFFFFF",
  dangerBg: "#FDEDEA",
  danger:   "#C0392B",
};
const f = "'Sora',system-ui,sans-serif";
const topoSvg = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Barber & Haircuts","Hair Styling & Braiding","Nails & Manicure","Makeup & Aesthetics",
  "Lashes & Brows","Vocal Coaching","Music Lessons","Personal Training",
  "Yoga & Pilates","Wellness & Massage","Mental Health & Therapy","Nutrition & Dietetics",
  "Life Coaching","Tutoring & Education","Photography","Videography",
  "Cleaning Services","Home Maintenance","Auto Detailing","Pet Grooming & Care",
  "Tattoo & Piercing","Tailoring & Alterations","Event Planning","Other",
];

const TIME_OPTIONS = (() => {
  const slots = [];
  for (let h = 6; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? "AM" : "PM";
      const minStr = m === 0 ? "00" : String(m);
      slots.push(`${hour12}:${minStr} ${ampm}`);
    }
  }
  slots.push("12:00 AM"); // midnight
  return slots;
})();

const BUFFER_OPTIONS = [
  { value: 0,  label: "None" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
];

const WINDOW_OPTIONS = [
  { value: 1, label: "1 week ahead" },
  { value: 2, label: "2 weeks ahead" },
  { value: 4, label: "4 weeks ahead" },
  { value: 8, label: "8 weeks ahead" },
];

const DAYS = [
  { key: "monday",    label: "Mon" },
  { key: "tuesday",   label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday",  label: "Thu" },
  { key: "friday",    label: "Fri" },
  { key: "saturday",  label: "Sat" },
  { key: "sunday",    label: "Sun" },
];

const DEFAULT_AVAILABILITY = DAYS.reduce((acc, d) => {
  const isWeekend = d.key === "saturday" || d.key === "sunday";
  acc[d.key] = { enabled: !isWeekend, slots: [] };
  return acc;
}, {});

const TOTAL_STEPS = 4;

// ─── Shared micro-components ──────────────────────────────────────────────────
function Lbl({ children, color = t.muted, style = {} }) {
  return (
    <span style={{ fontFamily: f, fontSize: "11px", fontWeight: 500, color, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", ...style }}>
      {children}
    </span>
  );
}

function Divider() {
  return <div style={{ height: "1px", background: t.line }} />;
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex" }}>
      <svg width="24" height="24" fill="none" stroke={t.ink} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function StepBar({ current }) {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "0 24px", marginBottom: "28px" }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", background: i <= current ? t.accent : t.avatarBg }} />
      ))}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: "100%", padding: "16px", borderRadius: "12px", border: "none",
        background: disabled || loading ? t.faded : t.ink,
        color: "#fff", fontFamily: f, fontSize: "14px", fontWeight: 500,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
      }}
    >
      {loading && (
        <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
      )}
      {children}
    </button>
  );
}

// ─── Step 0 — Welcome splash ──────────────────────────────────────────────────
function StepWelcome({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: t.base, display: "flex", flexDirection: "column" }}>
      <div style={{ background: t.hero, margin: "16px", borderRadius: "28px", padding: "40px 28px", position: "relative", overflow: "hidden", minHeight: "300px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: topoSvg, backgroundSize: "cover", opacity: 0.12, pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Lbl color={t.accent} style={{ fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>Kliques for Providers</Lbl>
          <h1 style={{ fontFamily: f, fontSize: "32px", fontWeight: 400, letterSpacing: "-0.03em", lineHeight: 1.15, color: t.ink, margin: "0 0 10px" }}>Build your<br />practice here.</h1>
          <p style={{ fontFamily: f, fontSize: "15px", color: t.muted, margin: 0, lineHeight: 1.6 }}>Set up your profile, services, and start getting booked in minutes.</p>
        </div>
      </div>

      <div style={{ padding: "28px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        {["Category", "Profile & Photo", "Availability", "Handle & Payouts"].map((s, i) => (
          <div key={s}>
            <div style={{ display: "flex", gap: "14px", padding: "14px 0", alignItems: "center" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: t.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: f, fontSize: "12px", fontWeight: 500, color: t.muted, flexShrink: 0 }}>{i + 1}</div>
              <p style={{ fontFamily: f, fontSize: "15px", fontWeight: 400, color: t.ink, margin: 0 }}>{s}</p>
            </div>
            {i < 3 && <Divider />}
          </div>
        ))}

        <div style={{ marginTop: "auto", paddingTop: "20px" }}>
          <PrimaryBtn onClick={onStart}>Get Started</PrimaryBtn>
        </div>
      </div>
    </div>
  );
}

// ─── Step 1 — Category ────────────────────────────────────────────────────────
function StepCategory({ selected, customCat, onSelect, onCustomCat }) {
  const canContinue = selected && (selected !== "Other" || customCat.trim().length > 0);
  return (
    <div style={{ minHeight: "100vh", background: t.base, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 24px 16px" }} />
      <StepBar current={0} />
      <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Lbl style={{ marginBottom: "6px" }}>Step 1 of 4</Lbl>
        <h1 style={{ fontFamily: f, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: t.ink, margin: "0 0 8px" }}>What do you do?</h1>
        <p style={{ fontFamily: f, fontSize: "15px", color: t.muted, margin: "0 0 24px", lineHeight: 1.6 }}>Pick the category that best describes your work.</p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
          {CATEGORIES.map((c) => {
            const active = selected === c;
            return (
              <button
                key={c}
                onClick={() => { onSelect(c); if (c !== "Other") onCustomCat(""); }}
                style={{
                  padding: "10px 16px", borderRadius: "9999px",
                  border: active ? `2px solid ${t.accent}` : `1px solid ${t.line}`,
                  background: active ? t.hero : "transparent",
                  fontFamily: f, fontSize: "13px", fontWeight: active ? 500 : 400,
                  color: active ? t.accent : t.ink, cursor: "pointer",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {selected === "Other" && (
          <div style={{ marginBottom: "16px" }}>
            <Lbl style={{ marginBottom: "8px" }}>Tell us what you do</Lbl>
            <input
              value={customCat}
              onChange={(e) => onCustomCat(e.target.value)}
              placeholder="e.g., Dog Training, Interior Design, DJ Services..."
              style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: `1px solid ${customCat.length > 0 ? t.accent : t.line}`, fontFamily: f, fontSize: "14px", color: t.ink, outline: "none", background: t.avatarBg, boxSizing: "border-box" }}
            />
            <p style={{ fontFamily: f, fontSize: "12px", color: t.faded, margin: "6px 0 0" }}>We'll create a custom category for you.</p>
          </div>
        )}

        <div style={{ marginTop: "auto", padding: "20px 0 100px" }} />
      </div>

      {/* Sticky footer */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px", background: t.base, borderTop: `1px solid ${t.line}` }}>
        <PrimaryBtn disabled={!canContinue}>Continue</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Step 2 — Profile ─────────────────────────────────────────────────────────
function StepProfile({ data, onChange }) {
  const fileInputRef = useRef(null);
  const bioMax = 160;
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const { suggestions: citySuggestions, loading: cityLoading } = useCitySearch(data.city);
  const cityBorderActive = showCitySuggestions && (citySuggestions.length > 0 || cityLoading);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange("photoFile", file);
    onChange("photoPreview", URL.createObjectURL(file));
  };

  return (
    <div style={{ minHeight: "100vh", background: t.base, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 24px 16px" }} />
      <StepBar current={1} />
      <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Lbl style={{ marginBottom: "6px" }}>Step 2 of 4</Lbl>
        <h1 style={{ fontFamily: f, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: t.ink, margin: "0 0 8px" }}>Your profile.</h1>
        <p style={{ fontFamily: f, fontSize: "15px", color: t.muted, margin: "0 0 28px", lineHeight: 1.6 }}>This is what clients see when they find you.</p>

        {/* Photo upload */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ width: "88px", height: "88px", borderRadius: "50%", background: data.photoPreview ? "transparent" : t.avatarBg, border: `2px dashed ${data.photoPreview ? "transparent" : t.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}
          >
            {data.photoPreview ? (
              <img src={data.photoPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <svg width="28" height="28" fill="none" stroke={t.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
          <p style={{ fontFamily: f, fontSize: "12px", color: t.accent, margin: "8px 0 0", fontWeight: 500, cursor: "pointer" }} onClick={() => fileInputRef.current?.click()}>
            {data.photoPreview ? "Change photo" : "Upload photo"}
          </p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <Lbl style={{ marginBottom: "8px" }}>Business / Display Name</Lbl>
          <input
            value={data.businessName}
            onChange={(e) => onChange("businessName", e.target.value)}
            placeholder="e.g., Anny Wong Vocal Studio"
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: `1px solid ${t.line}`, fontFamily: f, fontSize: "14px", color: t.ink, outline: "none", background: t.avatarBg, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ marginBottom: "20px", position: "relative" }}>
          <Lbl style={{ marginBottom: "8px" }}>City</Lbl>
          <div style={{ position: "relative" }}>
            <input
              value={data.city}
              onChange={(e) => { onChange("city", e.target.value); setShowCitySuggestions(true); }}
              onFocus={() => data.city.length > 0 && setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
              placeholder="Start typing your city…"
              autoComplete="off"
              style={{ width: "100%", padding: "14px 16px", paddingRight: "36px", borderRadius: "12px", border: `1px solid ${cityBorderActive ? t.accent : t.line}`, fontFamily: f, fontSize: "14px", color: t.ink, outline: "none", background: t.avatarBg, boxSizing: "border-box" }}
            />
            {data.city.length > 0 && (
              <button onClick={() => { onChange("city", ""); setShowCitySuggestions(false); }}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                <svg width="16" height="16" fill="none" stroke={t.faded} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
          {showCitySuggestions && data.city.trim().length >= 2 && (cityLoading || citySuggestions.length > 0) && (
            <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px", background: t.card, borderRadius: "12px", border: `1px solid ${t.line}`, boxShadow: "0 8px 24px rgba(61,35,30,0.08)", zIndex: 20, overflow: "hidden", maxHeight: "220px", overflowY: "auto" }}>
              {cityLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 16px", fontFamily: f, fontSize: "13px", color: t.muted }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${t.line}`, borderTopColor: t.accent, animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
                  Searching…
                </div>
              ) : citySuggestions.map((c) => (
                <button key={c} onMouseDown={() => { onChange("city", c); setShowCitySuggestions(false); }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", background: "none", border: "none", borderBottom: `1px solid ${t.line}`, cursor: "pointer", width: "100%", textAlign: "left", fontFamily: f }}>
                  <svg width="14" height="14" fill="none" stroke={t.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <span style={{ fontFamily: f, fontSize: "14px", color: t.ink }}>{c}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "20px" }}>
          <Lbl style={{ marginBottom: "8px" }}>Short Bio</Lbl>
          <textarea
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            maxLength={bioMax}
            placeholder="Tell clients what you do and what makes your approach unique..."
            rows={3}
            style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: `1px solid ${t.line}`, fontFamily: f, fontSize: "13px", color: t.ink, outline: "none", resize: "vertical", background: t.avatarBg, boxSizing: "border-box" }}
          />
          <p style={{ fontFamily: f, fontSize: "11px", color: t.faded, margin: "6px 0 0", textAlign: "right" }}>{data.bio.length} / {bioMax}</p>
        </div>

        <div style={{ paddingBottom: "100px" }} />
      </div>
    </div>
  );
}

// ─── Step 3 — Availability ────────────────────────────────────────────────────
function StepAvailability({ availability, onChange, buffer, onBuffer, bookingWindow, onBookingWindow }) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [customWindow, setCustomWindow] = useState("");
  const isCustomActive = !WINDOW_OPTIONS.find((w) => w.value === bookingWindow);

  const toggleSlot = (dayKey, slot) => {
    const current = availability[dayKey].slots || [];
    const next = current.includes(slot) ? current.filter((s) => s !== slot) : [...current, slot].sort((a, b) => TIME_OPTIONS.indexOf(a) - TIME_OPTIONS.indexOf(b));
    onChange(dayKey, "slots", next);
  };

  const handleCustomWindow = (val) => {
    setCustomWindow(val);
    const num = parseInt(val, 10);
    if (num > 0) onBookingWindow(num);
  };

  return (
    <div style={{ minHeight: "100vh", background: t.base, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 24px 16px" }} />
      <StepBar current={2} />
      <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Lbl style={{ marginBottom: "6px" }}>Step 3 of 4</Lbl>
        <h1 style={{ fontFamily: f, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: t.ink, margin: "0 0 8px" }}>Availability.</h1>
        <p style={{ fontFamily: f, fontSize: "15px", color: t.muted, margin: "0 0 20px", lineHeight: 1.6 }}>Choose which days you work and tap the time slots you're available.</p>

        <Divider />
        {DAYS.map((day) => {
          const d = availability[day.key];
          const isOpen = expandedDay === day.key;
          const slotCount = (d.slots || []).length;
          return (
            <div key={day.key}>
              {/* Day header row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <button
                    onClick={() => {
                      const enabling = !d.enabled;
                      onChange(day.key, "enabled", enabling);
                      if (enabling) setExpandedDay(day.key);
                      else if (expandedDay === day.key) setExpandedDay(null);
                    }}
                    style={{ width: "22px", height: "22px", borderRadius: "6px", border: d.enabled ? "none" : `1.5px solid ${t.line}`, background: d.enabled ? t.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                  >
                    {d.enabled && <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                  </button>
                  <span style={{ fontFamily: f, fontSize: "15px", fontWeight: 400, color: d.enabled ? t.ink : t.faded }}>{day.label}</span>
                </div>
                {d.enabled ? (
                  <button
                    onClick={() => setExpandedDay(isOpen ? null : day.key)}
                    style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <span style={{ fontFamily: f, fontSize: "12px", color: slotCount > 0 ? t.accent : t.faded }}>
                      {slotCount > 0 ? `${slotCount} slot${slotCount > 1 ? "s" : ""}` : "Pick times"}
                    </span>
                    <svg width="14" height="14" fill="none" stroke={t.faded} strokeWidth="2" viewBox="0 0 24 24" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : (
                  <span style={{ fontFamily: f, fontSize: "13px", color: t.faded }}>Off</span>
                )}
              </div>

              {/* Time slot picker — expands when day is enabled & open */}
              {d.enabled && isOpen && (
                <div style={{ paddingBottom: "16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {TIME_OPTIONS.map((slot) => {
                      const active = (d.slots || []).includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleSlot(day.key, slot)}
                          style={{
                            padding: "8px 12px", borderRadius: "8px",
                            border: active ? `2px solid ${t.accent}` : `1px solid ${t.line}`,
                            background: active ? t.hero : "transparent",
                            fontFamily: f, fontSize: "12px", fontWeight: active ? 500 : 400,
                            color: active ? t.accent : t.ink, cursor: "pointer",
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <Divider />
            </div>
          );
        })}

        <Lbl style={{ margin: "20px 0 12px" }}>Buffer Between Sessions</Lbl>
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {BUFFER_OPTIONS.map((b) => {
            const active = buffer === b.value;
            return (
              <button key={b.value} onClick={() => onBuffer(b.value)}
                style={{ flex: 1, padding: "10px 4px", borderRadius: "10px", border: active ? `2px solid ${t.accent}` : `1px solid ${t.line}`, background: active ? t.hero : "transparent", fontFamily: f, fontSize: "12px", fontWeight: active ? 500 : 400, color: active ? t.accent : t.ink, cursor: "pointer" }}>
                {b.label}
              </button>
            );
          })}
        </div>

        <Lbl style={{ marginBottom: "12px" }}>Booking Window</Lbl>
        <p style={{ fontFamily: f, fontSize: "13px", color: t.muted, margin: "0 0 12px" }}>How far ahead can clients book?</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
          {WINDOW_OPTIONS.map((w) => {
            const active = bookingWindow === w.value && !isCustomActive;
            return (
              <button key={w.value} onClick={() => { onBookingWindow(w.value); setCustomWindow(""); }}
                style={{ padding: "10px 16px", borderRadius: "10px", border: active ? `2px solid ${t.accent}` : `1px solid ${t.line}`, background: active ? t.hero : "transparent", fontFamily: f, fontSize: "12px", fontWeight: active ? 500 : 400, color: active ? t.accent : t.ink, cursor: "pointer" }}>
                {w.label}
              </button>
            );
          })}
          <button
            onClick={() => { setCustomWindow(isCustomActive ? customWindow : ""); if (!isCustomActive) onBookingWindow(0); }}
            style={{ padding: "10px 16px", borderRadius: "10px", border: isCustomActive ? `2px solid ${t.accent}` : `1px solid ${t.line}`, background: isCustomActive ? t.hero : "transparent", fontFamily: f, fontSize: "12px", fontWeight: isCustomActive ? 500 : 400, color: isCustomActive ? t.accent : t.ink, cursor: "pointer" }}>
            Custom
          </button>
        </div>
        {isCustomActive && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <input
              type="number"
              value={customWindow}
              onChange={(e) => handleCustomWindow(e.target.value)}
              placeholder="e.g., 6"
              min="1"
              max="52"
              style={{ width: "80px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${t.accent}`, fontFamily: f, fontSize: "14px", color: t.ink, outline: "none", background: t.avatarBg, textAlign: "center" }}
            />
            <span style={{ fontFamily: f, fontSize: "14px", color: t.muted }}>weeks ahead</span>
          </div>
        )}

        <div style={{ paddingBottom: "160px" }} />
      </div>
    </div>
  );
}

// ─── Step 5 — Handle + Stripe ─────────────────────────────────────────────────
function StepGoLive({ handle, onHandle, handleStatus, stripeConnected, onStripeConnect, stripeLoading }) {
  return (
    <div style={{ minHeight: "100vh", background: t.base, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "32px 24px 16px" }} />
      <StepBar current={3} />
      <div style={{ padding: "0 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Lbl style={{ marginBottom: "6px" }}>Step 4 of 4</Lbl>
        <h1 style={{ fontFamily: f, fontSize: "28px", fontWeight: 400, letterSpacing: "-0.03em", color: t.ink, margin: "0 0 8px" }}>Almost there.</h1>
        <p style={{ fontFamily: f, fontSize: "15px", color: t.muted, margin: "0 0 28px", lineHeight: 1.6 }}>Choose your public handle and connect your payout method.</p>

        <Lbl style={{ marginBottom: "8px" }}>Your Handle</Lbl>
        <input
          value={handle}
          onChange={(e) => onHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="e.g., anny-wong"
          style={{ width: "100%", padding: "14px 16px", borderRadius: "12px", border: `1px solid ${handleStatus === "taken" || handleStatus === "invalid" ? t.danger : handleStatus === "available" ? t.success : t.line}`, fontFamily: f, fontSize: "14px", color: t.ink, outline: "none", background: t.avatarBg, boxSizing: "border-box", marginBottom: "6px" }}
        />

        {handle && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            {handleStatus === "available" && (
              <svg width="14" height="14" fill="none" stroke={t.success} strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            <p style={{ fontFamily: f, fontSize: "13px", color: handleStatus === "available" ? t.success : handleStatus === "taken" || handleStatus === "invalid" ? t.danger : t.muted, margin: 0 }}>
              {handleStatus === "available" && `mykliques.com/book/${handle} is available`}
              {handleStatus === "taken" && "That handle is already taken. Try another."}
              {handleStatus === "invalid" && "Only lowercase letters, numbers, and hyphens allowed."}
              {handleStatus === "checking" && "Checking..."}
              {!handleStatus && `mykliques.com/book/${handle}`}
            </p>
          </div>
        )}

        <Divider />

        <div style={{ padding: "20px 0" }}>
          <Lbl style={{ marginBottom: "8px" }}>Connect Payouts</Lbl>
          <p style={{ fontFamily: f, fontSize: "14px", color: t.muted, margin: "0 0 16px", lineHeight: 1.5 }}>Connect your Stripe account so you can receive payments from clients securely.</p>

          {stripeConnected ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", borderRadius: "12px", padding: "14px 16px", background: t.successBg }}>
              <svg width="20" height="20" fill="none" stroke={t.success} strokeWidth="2.2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span style={{ fontFamily: f, fontSize: "14px", fontWeight: 500, color: t.success }}>Stripe account connected</span>
            </div>
          ) : (
            <>
              <button
                onClick={onStripeConnect}
                disabled={stripeLoading}
                style={{ width: "100%", padding: "16px", borderRadius: "12px", border: `1px solid ${t.line}`, background: t.card, fontFamily: f, fontSize: "14px", fontWeight: 500, color: t.ink, cursor: stripeLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {stripeLoading ? (
                  <span style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(61,35,30,0.2)", borderTopColor: t.ink, display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/></svg>
                )}
                {stripeLoading ? "Connecting…" : "Connect Stripe"}
              </button>
              <p style={{ fontFamily: f, fontSize: "12px", color: t.faded, margin: "12px 0 0" }}>Optional for now. You can finish payout setup later in Profile → Payouts &amp; Billing.</p>
            </>
          )}
        </div>

        <div style={{ paddingBottom: "120px" }} />
      </div>
    </div>
  );
}

// ─── Parent: ProviderOnboardingPage ──────────────────────────────────────────
function ProviderOnboardingPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { session, updateProfile } = useSession();
  const toast     = useToast();

  const [draftLoading, setDraftLoading] = useState(true);
  const [step, setStep]                 = useState(0); // 0 = welcome splash

  // Step 1
  const [category, setCategory]   = useState("");
  const [customCat, setCustomCat] = useState("");
  // Step 2
  const [profile, setProfile]     = useState({ businessName: "", city: "", bio: "", photoFile: null, photoPreview: null });
  // Step 3
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [bufferMins, setBufferMins]     = useState(0);
  const [bookingWindow, setBookingWindow] = useState(4);
  // Step 4
  const [handle, setHandle]             = useState("");
  const [handleStatus, setHandleStatus] = useState(null);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading]     = useState(false);
  const [submitting, setSubmitting]           = useState(false);

  // ── Load draft ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    async function loadDraft() {
      try {
        const { draft } = await request("/provider/onboarding/draft");
        if (draft) {
          if (draft.step != null && draft.step > 0) setStep(draft.step);
          if (draft.category)     setCategory(draft.category);
          if (draft.customCat)    setCustomCat(draft.customCat);
          if (draft.profile)      setProfile((p) => ({ ...p, ...draft.profile, photoFile: null }));
          if (draft.availability) setAvailability(draft.availability);
          if (draft.bufferMins   != null) setBufferMins(draft.bufferMins);
          if (draft.bookingWindow != null) setBookingWindow(draft.bookingWindow);
          if (draft.handle)       setHandle(draft.handle);
          if (draft.stripeConnected) setStripeConnected(draft.stripeConnected);
        }
      } catch {
        // non-critical
      } finally {
        setDraftLoading(false);
      }
    }
    loadDraft();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stripe return ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("stripe") === "done") {
      setStripeConnected(true);
      setStep(4);
      toast.push({ title: "Stripe connected!", variant: "success" });
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced draft save ──────────────────────────────────────────────────
  const saveTimer = useRef(null);
  useEffect(() => {
    if (draftLoading || step === 0) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      request("/provider/onboarding/draft", {
        method: "PUT",
        body: JSON.stringify({
          step, category, customCat,
          profile: { ...profile, photoFile: null, photoPreview: null },
          availability, bufferMins, bookingWindow, handle, stripeConnected,
        }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [step, category, customCat, profile, availability, bufferMins, bookingWindow, handle, stripeConnected, draftLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateAvailability = (dayKey, field, value) =>
    setAvailability((prev) => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: value } }));
  const setProfileField = (key, val) => setProfile((prev) => ({ ...prev, [key]: val }));

  // ── Debounced handle check — fires 600ms after user stops typing ─────────
  const handleCheckTimer = useRef(null);
  useEffect(() => {
    if (step !== 4) return;
    clearTimeout(handleCheckTimer.current);
    if (!handle.trim()) { setHandleStatus(null); return; }
    if (!/^[a-z0-9-]+$/.test(handle)) { setHandleStatus("invalid"); return; }
    setHandleStatus("checking");
    handleCheckTimer.current = setTimeout(async () => {
      try {
        const data = await request(`/provider/check-handle?handle=${encodeURIComponent(handle)}`);
        setHandleStatus(data.available ? "available" : "taken");
      } catch {
        setHandleStatus(null);
      }
    }, 600);
    return () => clearTimeout(handleCheckTimer.current);
  }, [handle, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const data = await request("/provider/stripe/connect", {
        method: "POST",
        body: JSON.stringify({
          refreshUrl: `${window.location.origin}/provider/onboarding?step=4`,
          returnUrl:  `${window.location.origin}/provider/onboarding?stripe=done`,
        }),
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      toast.push({ title: "Stripe setup failed", description: err.message, variant: "error" });
      setStripeLoading(false);
    }
  };

  const canContinue = () => {
    if (step === 1) return !!category && (category !== "Other" || customCat.trim().length > 0);
    if (step === 2) return profile.businessName.trim() && profile.city.trim() && profile.bio.trim();
    if (step === 3) return true;
    if (step === 4) return handleStatus === "available";
    return false;
  };

  const handleContinue = async () => {
    if (step < 4) { setStep((s) => s + 1); return; }
    setSubmitting(true);
    // Cancel any pending draft save so it doesn't overwrite after navigate
    clearTimeout(saveTimer.current);
    try {
      await request("/provider/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          category: category === "Other" ? customCat : category,
          businessName: profile.businessName,
          city: profile.city,
          bio: profile.bio,
          handle, availability,
          bufferMinutes: bufferMins,
          bookingWindowWeeks: bookingWindow,
        }),
      });
      // Delete draft first, then update local profile, then navigate
      await request("/provider/onboarding/draft", { method: "DELETE" }).catch(() => {});
      await updateProfile({ isProfileComplete: true });
      toast.push({ title: "You're live!", description: "Welcome to Kliques.", variant: "success" });
      navigate("/provider", { replace: true });
    } catch (err) {
      toast.push({ title: "Setup failed", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else if (step === 1) setStep(0);
    else navigate(-1);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (draftLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: t.base }}>
        <span style={{ fontFamily: f, fontSize: "20px", fontWeight: 600, color: t.accent, letterSpacing: "-0.02em" }}>kliques</span>
        <div style={{ marginTop: 24, width: 32, height: 32, borderRadius: "50%", border: `2px solid ${t.line}`, borderTopColor: t.accent, animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Step 0: Welcome splash (no back bar, no step bar) ─────────────────────
  if (step === 0) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <StepWelcome onStart={() => setStep(1)} />
      </>
    );
  }

  // ── Steps 1–4 ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ minHeight: "100vh", background: t.base, position: "relative" }}>
        {/* Top nav */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: t.base, padding: "16px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <BackBtn onClick={handleBack} />
          <span style={{ fontFamily: f, fontSize: "20px", fontWeight: 600, color: t.accent, letterSpacing: "-0.02em" }}>kliques</span>
          <span style={{ fontFamily: f, fontSize: "13px", color: t.faded, minWidth: 40, textAlign: "right" }}>{step}/{TOTAL_STEPS}</span>
        </div>

        {/* Content offset for fixed nav */}
        <div style={{ paddingTop: "64px" }}>
          {step === 1 && (
            <StepCategory selected={category} customCat={customCat} onSelect={setCategory} onCustomCat={setCustomCat} />
          )}
          {step === 2 && (
            <StepProfile data={profile} onChange={setProfileField} />
          )}
          {step === 3 && (
            <StepAvailability
              availability={availability}
              onChange={updateAvailability}
              buffer={bufferMins}
              onBuffer={setBufferMins}
              bookingWindow={bookingWindow}
              onBookingWindow={setBookingWindow}
            />
          )}
          {step === 4 && (
            <StepGoLive
              handle={handle}
              onHandle={setHandle}
              handleStatus={handleStatus}
              stripeConnected={stripeConnected}
              onStripeConnect={handleStripeConnect}
              stripeLoading={stripeLoading}
            />
          )}
        </div>

        {/* Sticky bottom bar */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 24px 32px", background: t.base, borderTop: `1px solid ${t.line}`, zIndex: 10 }}>
          <PrimaryBtn onClick={handleContinue} disabled={!canContinue()} loading={submitting}>
            {step === 4 ? "Launch My Page" : "Continue"}
          </PrimaryBtn>
          {step === 3 && (
            <button
              onClick={handleContinue}
              style={{ width: "100%", marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontFamily: f, fontSize: "14px", color: t.muted }}
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </>
  );
}

export default ProviderOnboardingPage;
