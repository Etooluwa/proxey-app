import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSession } from "../auth/authContext";
import { useToast } from "../components/ui/ToastProvider";
import { request } from "../data/apiClient";
import Card from "../components/ui/Card";
import Footer from "../components/ui/Footer";
import Logo from "../components/ui/Logo";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const ACCENT      = "#C25E4A";
const ACCENT_LIGHT = "#FFF0E6";
const BG          = "#FBF7F2";
const FG          = "#3D231E";
const MUTED       = "#6B7280";
const DIVIDER     = "rgba(140,106,100,0.2)";
const SUCCESS_BG  = "#F0FDF4";
const SUCCESS_FG  = "#15803D";
const DANGER      = "#EF4444";

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "barber",         emoji: "✂️",  label: "Barber" },
  { id: "nails",          emoji: "💅",  label: "Nails" },
  { id: "vocal_coach",    emoji: "🎤",  label: "Vocal Coach" },
  { id: "wellness",       emoji: "🧘",  label: "Wellness" },
  { id: "personal_trainer", emoji: "💪", label: "Personal Trainer" },
  { id: "cleaning",       emoji: "🧹",  label: "Cleaning" },
  { id: "auto",           emoji: "🚗",  label: "Auto" },
  { id: "other",          emoji: "⭐",  label: "Other" },
];

// ─── Duration options ─────────────────────────────────────────────────────────
const DURATIONS = [
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 hr" },
  { value: 90,  label: "1 hr 30 min" },
  { value: 120, label: "2 hr" },
];

const TIME_OPTIONS = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM","8:30 PM",
  "9:00 PM","9:30 PM","10:00 PM",
];

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
  acc[d.key] = { enabled: !isWeekend, from: "9:00 AM", to: "5:00 PM" };
  return acc;
}, {});

const STEP_TITLES = ["Category", "Profile", "Services", "Availability", "Go Live"];
const TOTAL_STEPS = 5;

// ─── Progress bar ─────────────────────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <div className="flex gap-1.5 px-5 pt-4 pb-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-full transition-all"
          style={{
            height: 4,
            background: i < step ? ACCENT : DIVIDER,
          }}
        />
      ))}
    </div>
  );
}

// ─── Reusable inline label + field ───────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <p className="font-sora text-[13px] font-semibold text-foreground mb-1.5 m-0"
         style={{ color: MUTED }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength, type = "text", onBlur, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full font-sora text-[15px] focus:outline-none"
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${DIVIDER}`,
        background: "#fff",
        color: FG,
      }}
      {...rest}
    />
  );
}

function NativeSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full font-sora text-[15px] focus:outline-none appearance-none"
        style={{
          padding: "12px 40px 12px 14px",
          borderRadius: 12,
          border: `1px solid ${DIVIDER}`,
          background: "#fff",
          color: FG,
        }}
      >
        {children}
      </select>
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
           width="18" height="18" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ─── Continue button ──────────────────────────────────────────────────────────
function ContinueBtn({ onClick, disabled, loading, label = "Continue" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-card font-sora text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      style={{
        background: disabled || loading ? "#B0B0B0" : FG,
        cursor: disabled || loading ? "not-allowed" : "pointer",
      }}
    >
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
      )}
      {label}
    </button>
  );
}

// ─── Step 1 — Category ────────────────────────────────────────────────────────
function StepCategory({ selected, onChange }) {
  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-sora text-[26px] font-bold text-foreground m-0 mb-1" style={{ color: FG }}>
        What do you offer?
      </h2>
      <p className="font-sora text-[15px] m-0 mb-6" style={{ color: MUTED }}>
        Choose the category that best describes your services.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const isSel = selected === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onChange(cat.id)}
              className="flex flex-col items-center py-5 rounded-card font-sora focus:outline-none active:scale-[0.97] transition-transform"
              style={{
                background: isSel ? ACCENT_LIGHT : "#fff",
                border: isSel ? `2px solid ${ACCENT}` : `1px solid ${DIVIDER}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <span style={{ fontSize: 30, lineHeight: 1, marginBottom: 8 }}>{cat.emoji}</span>
              <span
                className="font-sora text-[14px] font-semibold"
                style={{ color: isSel ? ACCENT : FG }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2 — Profile ─────────────────────────────────────────────────────────
function StepProfile({ data, onChange }) {
  const fileInputRef = useRef(null);
  const bioMax = 160;

  const handlePhotoClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    onChange("photoFile", file);
    onChange("photoPreview", previewUrl);
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-sora text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
        Your profile
      </h2>
      <p className="font-sora text-[15px] m-0 mb-6" style={{ color: MUTED }}>
        This is what clients will see when they find you.
      </p>

      {/* Photo upload */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={handlePhotoClick}
          className="relative focus:outline-none"
          style={{ width: 96, height: 96 }}
          aria-label="Upload photo"
        >
          <div
            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
            style={{
              background: data.photoPreview ? "transparent" : ACCENT_LIGHT,
              border: `2px dashed ${data.photoPreview ? "transparent" : ACCENT}`,
            }}
          >
            {data.photoPreview ? (
              <img
                src={data.photoPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg width="28" height="28" fill="none" stroke={ACCENT} strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            )}
          </div>
          {/* Edit badge */}
          <div
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: ACCENT }}
          >
            <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <p className="font-sora text-[13px] mt-2 m-0" style={{ color: MUTED }}>
          {data.photoPreview ? "Tap to change photo" : "Tap to add photo"}
        </p>
      </div>

      <Card>
        <Field label="Business / Display Name">
          <TextInput
            value={data.businessName}
            onChange={(e) => onChange("businessName", e.target.value)}
            placeholder="e.g., Anny Wong Vocal Studio"
          />
        </Field>

        <Field label="City">
          <TextInput
            value={data.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="e.g., Toronto"
          />
        </Field>

        <Field label={`Short Bio (${data.bio.length}/${bioMax})`}>
          <textarea
            value={data.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            maxLength={bioMax}
            placeholder="Tell clients a little about yourself and your experience…"
            rows={4}
            className="w-full font-sora text-[15px] focus:outline-none resize-none"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: `1px solid ${DIVIDER}`,
              background: "#fff",
              color: FG,
              lineHeight: 1.55,
            }}
          />
        </Field>
      </Card>
    </div>
  );
}

// ─── Service modal ────────────────────────────────────────────────────────────
const EMPTY_SERVICE = {
  name: "", duration: 60, price: "", paymentType: "full",
  depositType: "percent", depositValue: "",
};

function ServiceModal({ initial, onSave, onClose }) {
  const [svc, setSvc] = useState(initial || EMPTY_SERVICE);
  const set = (k, v) => setSvc((p) => ({ ...p, [k]: v }));

  const canSave = svc.name.trim() && svc.price && parseFloat(svc.price) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end font-sora"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative flex flex-col"
        style={{
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: DIVIDER }} />
        </div>
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-3 pb-2 flex-shrink-0">
          <h2 className="font-sora text-[20px] font-bold m-0" style={{ color: FG }}>
            {initial ? "Edit service" : "Add service"}
          </h2>
          <button onClick={onClose} className="focus:outline-none -m-1 p-1">
            <svg width="22" height="22" fill="none" stroke={MUTED} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 pb-8">
          <Field label="Service name">
            <TextInput
              value={svc.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g., Vocal Lesson"
            />
          </Field>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <p className="font-sora text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>Duration</p>
              <NativeSelect value={svc.duration} onChange={(e) => set("duration", Number(e.target.value))}>
                {DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex-1">
              <p className="font-sora text-[13px] font-semibold mb-1.5 m-0" style={{ color: MUTED }}>Price ($)</p>
              <TextInput
                type="number"
                value={svc.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="85"
                min="0"
              />
            </div>
          </div>

          {/* Payment model */}
          <p className="font-sora text-[13px] font-semibold mb-3 m-0" style={{ color: MUTED }}>
            Payment model
          </p>
          {[
            { id: "full",    label: "Full payment at booking",      desc: null },
            { id: "deposit_fixed",   label: "Fixed deposit amount", desc: "deposit_fixed" },
            { id: "deposit_percent", label: "Percentage deposit",   desc: "deposit_percent" },
          ].map((opt) => {
            const isActive = svc.paymentType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => set("paymentType", opt.id)}
                className="mb-3 rounded-card p-4 cursor-pointer transition-all"
                style={{
                  border: isActive ? `2px solid ${ACCENT}` : `1px solid ${DIVIDER}`,
                  background: isActive ? ACCENT_LIGHT : "#fff",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      background: isActive ? ACCENT : "transparent",
                      border: isActive ? "none" : `2px solid ${DIVIDER}`,
                    }}
                  >
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span
                    className="font-sora text-[15px] font-semibold"
                    style={{ color: isActive ? ACCENT : FG }}
                  >
                    {opt.label}
                  </span>
                </div>

                {isActive && opt.id === "deposit_fixed" && (
                  <div className="mt-3 ml-8">
                    <TextInput
                      type="number"
                      value={svc.depositValue}
                      onChange={(e) => set("depositValue", e.target.value)}
                      placeholder="e.g., 25"
                      min="0"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="font-sora text-[12px] mt-1 m-0" style={{ color: MUTED }}>
                      Fixed deposit amount in $
                    </p>
                  </div>
                )}
                {isActive && opt.id === "deposit_percent" && (
                  <div className="mt-3 ml-8">
                    <TextInput
                      type="number"
                      value={svc.depositValue}
                      onChange={(e) => set("depositValue", e.target.value)}
                      placeholder="e.g., 30"
                      min="0"
                      max="100"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="font-sora text-[12px] mt-1 m-0" style={{ color: MUTED }}>
                      Percentage of total price
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={() => canSave && onSave(svc)}
            disabled={!canSave}
            className="w-full py-4 rounded-card font-sora text-[16px] font-bold text-white mt-2 focus:outline-none active:scale-[0.98] transition-transform"
            style={{ background: canSave ? FG : "#B0B0B0", cursor: canSave ? "pointer" : "not-allowed" }}
          >
            {initial ? "Save changes" : "Add service"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Services ────────────────────────────────────────────────────────
function StepServices({ services, onAdd, onEdit, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(null);

  const fmtPrice = (p) => `$${parseFloat(p).toFixed(0)}`;
  const fmtDuration = (m) => {
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} hr ${r} min` : `${h} hr`;
  };
  const payLabel = (s) => {
    if (s.paymentType === "deposit_fixed")   return `$${s.depositValue} deposit`;
    if (s.paymentType === "deposit_percent") return `${s.depositValue}% deposit`;
    return "Full at booking";
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-sora text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
        Your services
      </h2>
      <p className="font-sora text-[15px] m-0 mb-5" style={{ color: MUTED }}>
        Add the services you offer. You can edit these any time.
      </p>

      {/* Service cards */}
      {services.map((svc, i) => (
        <Card key={i} className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-sora text-[16px] font-semibold m-0 mb-0.5 truncate" style={{ color: FG }}>
                {svc.name}
              </p>
              <p className="font-sora text-[13px] m-0" style={{ color: MUTED }}>
                {fmtDuration(svc.duration)} · {fmtPrice(svc.price)} · {payLabel(svc)}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => { setEditingIdx(i); setModalOpen(true); }}
                className="focus:outline-none"
                style={{ padding: 6 }}
                aria-label="Edit"
              >
                <svg width="18" height="18" fill="none" stroke={MUTED} strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(i)}
                className="focus:outline-none"
                style={{ padding: 6 }}
                aria-label="Delete"
              >
                <svg width="18" height="18" fill="none" stroke={DANGER} strokeWidth="1.8" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </Card>
      ))}

      {/* Add service dashed button */}
      <button
        onClick={() => { setEditingIdx(null); setModalOpen(true); }}
        className="w-full flex items-center justify-center gap-2 font-sora text-[15px] font-semibold focus:outline-none active:scale-[0.98] transition-transform"
        style={{
          padding: "14px",
          borderRadius: 14,
          border: `1.5px dashed ${ACCENT}`,
          background: ACCENT_LIGHT,
          color: ACCENT,
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" fill="none" stroke={ACCENT} strokeWidth="2.2" viewBox="0 0 24 24">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Add a service
      </button>

      {services.length === 0 && (
        <p className="font-sora text-[13px] text-center mt-3 m-0" style={{ color: MUTED }}>
          Add at least one service to continue.
        </p>
      )}

      {modalOpen && (
        <ServiceModal
          initial={editingIdx !== null ? services[editingIdx] : null}
          onSave={(svc) => {
            if (editingIdx !== null) onEdit(editingIdx, svc);
            else onAdd(svc);
            setModalOpen(false);
            setEditingIdx(null);
          }}
          onClose={() => { setModalOpen(false); setEditingIdx(null); }}
        />
      )}
    </div>
  );
}

// ─── Step 4 — Availability ────────────────────────────────────────────────────
function StepAvailability({ availability, onChange, buffer, onBuffer, bookingWindow, onBookingWindow }) {
  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-sora text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
        Your availability
      </h2>
      <p className="font-sora text-[15px] m-0 mb-5" style={{ color: MUTED }}>
        Set your working hours. You can always update this later.
      </p>

      <Card className="mb-3">
        {DAYS.map((day, idx) => {
          const d = availability[day.key];
          return (
            <div key={day.key}>
              {idx > 0 && <div style={{ height: 1, background: DIVIDER, margin: "0 -16px" }} />}
              <div className="py-3">
                {/* Day row */}
                <div className="flex items-center justify-between mb-0">
                  <span
                    className="font-sora text-[15px] font-semibold"
                    style={{ color: d.enabled ? FG : MUTED }}
                  >
                    {day.label}
                  </span>
                  {/* Toggle */}
                  <button
                    onClick={() => onChange(day.key, "enabled", !d.enabled)}
                    className="focus:outline-none flex-shrink-0 relative"
                    style={{
                      width: 44, height: 26, borderRadius: 13,
                      background: d.enabled ? ACCENT : DIVIDER,
                      transition: "background 0.2s",
                      border: "none",
                      cursor: "pointer",
                    }}
                    aria-label={`Toggle ${day.label}`}
                  >
                    <span
                      className="absolute top-[3px] rounded-full bg-white"
                      style={{
                        width: 20, height: 20,
                        left: d.enabled ? 21 : 3,
                        transition: "left 0.2s",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    />
                  </button>
                </div>

                {/* Time pickers */}
                {d.enabled && (
                  <div className="flex items-center gap-2 mt-2.5">
                    <NativeSelect
                      value={d.from}
                      onChange={(e) => onChange(day.key, "from", e.target.value)}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </NativeSelect>
                    <span className="font-sora text-[13px]" style={{ color: MUTED, flexShrink: 0 }}>to</span>
                    <NativeSelect
                      value={d.to}
                      onChange={(e) => onChange(day.key, "to", e.target.value)}
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </NativeSelect>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      <Card>
        <Field label="Buffer between appointments">
          <NativeSelect value={buffer} onChange={(e) => onBuffer(Number(e.target.value))}>
            {BUFFER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Booking window">
          <NativeSelect value={bookingWindow} onChange={(e) => onBookingWindow(Number(e.target.value))}>
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </NativeSelect>
        </Field>
      </Card>
    </div>
  );
}

// ─── Step 5 — Handle + Stripe ─────────────────────────────────────────────────
function StepGoLive({ handle, onHandle, handleStatus, onCheckHandle, stripeConnected, onStripeConnect, stripeLoading }) {
  // handleStatus: null | "checking" | "available" | "taken" | "invalid"

  return (
    <div className="px-4 pt-2 pb-4">
      <h2 className="font-sora text-[26px] font-bold m-0 mb-1" style={{ color: FG }}>
        Go live
      </h2>
      <p className="font-sora text-[15px] m-0 mb-5" style={{ color: MUTED }}>
        Claim your booking link and connect your payout account.
      </p>

      {/* Handle */}
      <Card className="mb-4">
        <Field label="Your public handle">
          <div className="relative">
            <TextInput
              value={handle}
              onChange={(e) => onHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              onBlur={onCheckHandle}
              placeholder="e.g., anny-wong"
            />
            {/* Status icon */}
            {handleStatus === "checking" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin inline-block"
                      style={{ borderColor: MUTED, borderTopColor: "transparent" }} />
              </div>
            )}
            {handleStatus === "available" && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" fill="none" stroke={SUCCESS_FG} strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            {(handleStatus === "taken" || handleStatus === "invalid") && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg width="20" height="20" fill="none" stroke={DANGER} strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>

          {/* URL preview */}
          {handle && (
            <p className="font-sora text-[13px] mt-2 m-0" style={{ color: MUTED }}>
              mykliques.com/book/
              <span style={{ color: handleStatus === "available" ? SUCCESS_FG : handleStatus === "taken" || handleStatus === "invalid" ? DANGER : FG, fontWeight: 600 }}>
                {handle}
              </span>
            </p>
          )}

          {handleStatus === "taken" && (
            <p className="font-sora text-[13px] mt-1 m-0" style={{ color: DANGER }}>
              That handle is already taken. Try another.
            </p>
          )}
          {handleStatus === "invalid" && (
            <p className="font-sora text-[13px] mt-1 m-0" style={{ color: DANGER }}>
              Only lowercase letters, numbers, and hyphens allowed.
            </p>
          )}
        </Field>
      </Card>

      {/* Stripe Connect */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div
            className="flex items-center justify-center flex-shrink-0 rounded-xl"
            style={{ width: 44, height: 44, background: "#635BFF" }}
          >
            <svg width="22" height="22" viewBox="0 0 60 25" fill="white">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.86zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.77 0 14.51 0 9.95 0 7.04 2.28 5.3 5.62 5.3c1.36 0 2.72.2 4.09.75v3.88a9.23 9.23 0 0 0-4.1-1.06c-.86 0-1.44.25-1.44.93 0 1.85 6.29.97 6.29 5.88z" />
            </svg>
          </div>
          <div>
            <p className="font-sora text-[16px] font-semibold m-0 mb-0.5" style={{ color: FG }}>
              Connect with Stripe
            </p>
            <p className="font-sora text-[13px] m-0" style={{ color: MUTED }}>
              Receive payouts directly to your bank account.
            </p>
          </div>
        </div>

        {stripeConnected ? (
          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3"
            style={{ background: SUCCESS_BG }}
          >
            <svg width="20" height="20" fill="none" stroke={SUCCESS_FG} strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-sora text-[14px] font-semibold" style={{ color: SUCCESS_FG }}>
              Stripe account connected
            </span>
          </div>
        ) : (
          <button
            onClick={onStripeConnect}
            disabled={stripeLoading}
            className="w-full py-3.5 rounded-xl font-sora text-[15px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            style={{ background: stripeLoading ? "#B0B0B0" : "#635BFF", cursor: stripeLoading ? "not-allowed" : "pointer" }}
          >
            {stripeLoading && (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            )}
            {stripeLoading ? "Connecting…" : "Connect Stripe"}
          </button>
        )}
      </Card>
    </div>
  );
}

// ─── Parent: ProviderOnboardingPage ──────────────────────────────────────────
function ProviderOnboardingPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { session } = useSession();
  const toast       = useToast();

  // ── Form state (starts at defaults; overwritten once draft loads) ────────
  const [draftLoading, setDraftLoading]   = useState(true);
  const [step, setStep]                   = useState(1);

  // Step 1
  const [category, setCategory]           = useState("");
  // Step 2
  const [profile, setProfile]             = useState({
    businessName: "", city: "", bio: "", photoFile: null, photoPreview: null,
  });
  // Step 3
  const [services, setServices]           = useState([]);
  // Step 4
  const [availability, setAvailability]   = useState(DEFAULT_AVAILABILITY);
  const [bufferMins, setBufferMins]       = useState(0);
  const [bookingWindow, setBookingWindow] = useState(4);
  // Step 5
  const [handle, setHandle]               = useState("");
  const [handleStatus, setHandleStatus]   = useState(null); // null|checking|available|taken|invalid
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [submitting, setSubmitting]       = useState(false);

  // ── Load draft from Supabase on mount ────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    async function loadDraft() {
      try {
        const { draft } = await request("/provider/onboarding/draft");
        if (draft) {
          if (draft.step)         setStep(draft.step);
          if (draft.category)     setCategory(draft.category);
          if (draft.profile)      setProfile((p) => ({ ...p, ...draft.profile, photoFile: null }));
          if (draft.services)     setServices(draft.services);
          if (draft.availability) setAvailability(draft.availability);
          if (draft.bufferMins   != null) setBufferMins(draft.bufferMins);
          if (draft.bookingWindow != null) setBookingWindow(draft.bookingWindow);
          if (draft.handle)       setHandle(draft.handle);
          if (draft.stripeConnected) setStripeConnected(draft.stripeConnected);
        }
      } catch {
        // Non-critical — just start fresh
      } finally {
        setDraftLoading(false);
      }
    }
    loadDraft();
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle Stripe return ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("stripe") === "done") {
      setStripeConnected(true);
      setStep(5);
      toast.push({ title: "Stripe connected!", variant: "success" });
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced draft save to Supabase ─────────────────────────────────────
  // We use a ref-based debounce: 1.5 s after the last change fires the PUT.
  const saveTimer = useRef(null);
  useEffect(() => {
    if (draftLoading) return; // don't save while we're still loading
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      request("/provider/onboarding/draft", {
        method: "PUT",
        body: JSON.stringify({
          step,
          category,
          profile: { ...profile, photoFile: null, photoPreview: null },
          services,
          availability,
          bufferMins,
          bookingWindow,
          handle,
          stripeConnected,
        }),
      }).catch(() => {}); // fire-and-forget; errors are non-critical
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [step, category, profile, services, availability, bufferMins, bookingWindow, handle, stripeConnected, draftLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Availability helper ──────────────────────────────────────────────────
  const updateAvailability = (dayKey, field, value) => {
    setAvailability((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  // ── Profile helper ────────────────────────────────────────────────────────
  const updateProfile = (key, val) => setProfile((prev) => ({ ...prev, [key]: val }));

  // ── Handle check ─────────────────────────────────────────────────────────
  const checkHandle = async () => {
    if (!handle.trim()) return;
    if (!/^[a-z0-9-]+$/.test(handle)) {
      setHandleStatus("invalid");
      return;
    }
    setHandleStatus("checking");
    try {
      const data = await request(`/provider/check-handle?handle=${encodeURIComponent(handle)}`);
      setHandleStatus(data.available ? "available" : "taken");
    } catch {
      setHandleStatus(null);
    }
  };

  // ── Stripe connect ────────────────────────────────────────────────────────
  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const data = await request("/provider/stripe/connect", {
        method: "POST",
        body: JSON.stringify({
          refreshUrl: `${window.location.origin}/provider/onboarding?step=5`,
          returnUrl:  `${window.location.origin}/provider/onboarding?stripe=done`,
        }),
      });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.push({ title: "Stripe setup failed", description: err.message, variant: "error" });
      setStripeLoading(false);
    }
  };

  // ── Continue logic ────────────────────────────────────────────────────────
  const canContinue = () => {
    if (step === 1) return !!category;
    if (step === 2) return profile.businessName.trim() && profile.city.trim() && profile.bio.trim();
    if (step === 3) return services.length > 0;
    if (step === 4) return true; // always enabled
    if (step === 5) return handleStatus === "available" && stripeConnected;
    return false;
  };

  const handleContinue = async () => {
    if (step < 5) {
      setStep((s) => s + 1);
      return;
    }
    // Final submit
    setSubmitting(true);
    try {
      await request("/provider/onboarding/complete", {
        method: "POST",
        body: JSON.stringify({
          category,
          businessName: profile.businessName,
          city:         profile.city,
          bio:          profile.bio,
          handle,
          services,
          availability,
          bufferMinutes:      bufferMins,
          bookingWindowWeeks: bookingWindow,
        }),
      });
      // Clear the draft from Supabase
      request("/provider/onboarding/draft", { method: "DELETE" }).catch(() => {});
      toast.push({ title: "You're live!", description: "Welcome to Kliques.", variant: "success" });
      navigate("/provider");
    } catch (err) {
      toast.push({ title: "Setup failed", description: err.message, variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
    else navigate(-1);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (draftLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sora" style={{ background: BG }}>
        <Logo size={22} color="accent" />
        <div className="mt-6 w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: ACCENT, borderTopColor: "transparent" }} />
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-screen font-sora"
      style={{ background: BG }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 pt-3 pb-1 flex-shrink-0"
        style={{ background: BG }}
      >
        {/* Back */}
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="flex items-center focus:outline-none -ml-1"
            style={{ background: "none", border: "none", cursor: "pointer", padding: "8px" }}
          >
            <svg width="24" height="24" fill="none" stroke={FG} strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}

        {/* Logo */}
        <Logo size={18} color="accent" />

        {/* Step label */}
        <span
          className="font-sora text-[13px] font-semibold"
          style={{ color: MUTED, minWidth: 40, textAlign: "right" }}
        >
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <StepBar step={step} />

      {/* Step subtitle */}
      <p
        className="font-sora text-[12px] font-semibold tracking-wide uppercase px-5 mb-0 mt-1"
        style={{ color: ACCENT }}
      >
        {STEP_TITLES[step - 1]}
      </p>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-36">
        {step === 1 && (
          <StepCategory selected={category} onChange={setCategory} />
        )}
        {step === 2 && (
          <StepProfile data={profile} onChange={updateProfile} />
        )}
        {step === 3 && (
          <StepServices
            services={services}
            onAdd={(svc) => setServices((prev) => [...prev, svc])}
            onEdit={(idx, svc) => setServices((prev) => prev.map((s, i) => i === idx ? svc : s))}
            onDelete={(idx) => setServices((prev) => prev.filter((_, i) => i !== idx))}
          />
        )}
        {step === 4 && (
          <StepAvailability
            availability={availability}
            onChange={updateAvailability}
            buffer={bufferMins}
            onBuffer={setBufferMins}
            bookingWindow={bookingWindow}
            onBookingWindow={setBookingWindow}
          />
        )}
        {step === 5 && (
          <StepGoLive
            handle={handle}
            onHandle={(v) => { setHandle(v); setHandleStatus(null); }}
            handleStatus={handleStatus}
            onCheckHandle={checkHandle}
            stripeConnected={stripeConnected}
            onStripeConnect={handleStripeConnect}
            stripeLoading={stripeLoading}
          />
        )}

        <Footer />
      </div>

      {/* Sticky bottom bar */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-8 flex flex-col gap-3"
        style={{ background: BG, borderTop: `0.5px solid ${DIVIDER}` }}
      >
        <ContinueBtn
          onClick={handleContinue}
          disabled={!canContinue()}
          loading={submitting}
          label={step === 5 ? "Launch my page" : "Continue"}
        />
        {step === 4 && (
          <button
            onClick={handleContinue}
            className="font-sora text-[14px] font-semibold text-center focus:outline-none"
            style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}
          >
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

export default ProviderOnboardingPage;
