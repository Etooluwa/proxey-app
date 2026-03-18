import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "../../auth/authContext";
import { CATEGORIES } from "../../constants";
import { request } from "../../data/apiClient";
import Nav from "../../components/ui/Nav";
import Card from "../../components/ui/Card";
import { useToast } from "../../components/ui/ToastProvider";

// ─── Small UI primitives ──────────────────────────────────────────────────────

function SectionTitle({ children }) {
  return (
    <h2 className="font-manrope text-[18px] font-bold text-foreground m-0 mb-3">
      {children}
    </h2>
  );
}

function Label({ children, required }) {
  return (
    <label className="font-manrope text-[14px] font-semibold text-foreground block mb-1.5">
      {children}
      {required && <span className="text-accent"> *</span>}
    </label>
  );
}

function FieldInput({ value, onChange, placeholder, type = "text", prefix, error, ...rest }) {
  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-manrope text-[15px] text-muted pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full font-manrope text-[15px] text-foreground rounded-card focus:outline-none"
        style={{
          padding: prefix ? "14px 16px 14px 28px" : "14px 16px",
          background: "#F2F2F7",
          border: error ? "1.5px solid #EF4444" : "1px solid transparent",
        }}
        {...rest}
      />
      {error && <p className="font-manrope text-[12px] text-danger mt-1">{error}</p>}
    </div>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="focus:outline-none flex-shrink-0"
      style={{
        width: 44, height: 26, borderRadius: 13,
        background: on ? "#0D1619" : "#E5E5EA",
        position: "relative",
        transition: "background 0.2s",
        border: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          left: on ? 21 : 3,
          width: 20, height: 20,
          borderRadius: "50%",
          background: "#FFFFFF",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ─── Default form state ────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  category: "",
  durationHr: 1,
  durationMin: 0,
  description: "",
  photos: [],
  price: "",
  payType: "full",
  depositType: "percent",
  depositValue: 50,
  clientNotesEnabled: true,
  is_active: true,
};

// ─── Inline option input ──────────────────────────────────────────────────────

function OptionInput({ onAdd }) {
  const [val, setVal] = useState("");
  const ref = useRef(null);
  const submit = () => {
    if (!val.trim()) return;
    onAdd(val.trim());
    setVal("");
    ref.current?.focus();
  };
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
        placeholder="Option label…"
        className="flex-1 px-3 py-1.5 rounded-[10px] font-manrope text-[13px] text-foreground focus:outline-none"
        style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
      />
      <button
        type="button"
        onClick={submit}
        className="px-3 py-1.5 rounded-[10px] font-manrope text-[13px] font-semibold focus:outline-none"
        style={{ background: "#0D1619", color: "#FFFFFF", border: "none" }}
      >
        Add
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderServiceEditor = () => {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const isNew      = !id || id === "new";
  const { session } = useSession();
  const toast      = useToast();

  const [form, setForm]       = useState(EMPTY_FORM);
  const [questions, setQuestions] = useState([]); // [{ id, question_text, question_type, sort_order, options: [{id, option_text}] }]
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving]   = useState(false);

  const photoInputRef = useRef(null);

  // ── Load existing service ────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await request(`/provider/services/${id}`);
      const svc = data.service;
      if (svc) {
        const totalMins = svc.duration || 60;
        const meta = svc.metadata || {};
        setForm({
          name:               svc.name || "",
          category:           svc.category || "",
          durationHr:         Math.floor(totalMins / 60),
          durationMin:        totalMins % 60,
          description:        svc.description || "",
          photos:             meta.photos || [],
          price:              svc.base_price != null ? String(svc.base_price) : "",
          payType:            svc.payment_type || "full",
          depositType:        svc.deposit_type || "percent",
          depositValue:       svc.deposit_value != null ? svc.deposit_value : 50,
          clientNotesEnabled: svc.client_notes_enabled !== false,
          is_active:          svc.is_active !== false,
        });
      }
      // Intake questions come back with nested options
      setQuestions(data.questions || []);
    } catch (err) {
      console.error("Failed to load service", err);
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => { load(); }, [load]);

  const set = (field) => (val) =>
    setForm((p) => ({ ...p, [field]: val?.target ? val.target.value : val }));

  // ── Deposit split calc ────────────────────────────────────────────────────
  const priceNum   = parseFloat(form.price) || 0;
  const depositAmt = form.depositType === "percent"
    ? (priceNum * form.depositValue) / 100
    : Math.min(parseFloat(form.depositValue) || 0, priceNum);
  const remainder  = Math.max(priceNum - depositAmt, 0);
  const fmt$ = (n) => `$${n.toFixed(2)}`;

  // ── Question helpers (optimistic local + deferred persist) ────────────────

  const addQuestion = () => {
    // Add a local "unsaved" question (no id yet)
    setQuestions((prev) => [
      ...prev,
      { id: null, _localId: Date.now(), question_text: "", question_type: "select", sort_order: prev.length, options: [] },
    ]);
  };

  const updateQuestionText = (idx, text) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], question_text: text };
      return updated;
    });
  };

  const removeQuestion = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const addOption = (qIdx, optionText) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      q.options = [...(q.options || []), { id: null, _localId: Date.now(), option_text: optionText }];
      updated[qIdx] = q;
      return updated;
    });
  };

  const removeOption = (qIdx, oIdx) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      q.options = q.options.filter((_, i) => i !== oIdx);
      updated[qIdx] = q;
      return updated;
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = {};
    if (!form.name.trim())              errs.name     = "Required";
    if (!form.category)                 errs.category = "Required";
    if (!form.price || Number(form.price) <= 0) errs.price = "Must be > 0";
    const totalMins = Number(form.durationHr) * 60 + Number(form.durationMin);
    if (totalMins <= 0)                 errs.duration = "Must be > 0";
    setErrors(errs);
    if (Object.keys(errs).length > 0)  return;

    setSaving(true);
    try {
      const servicePayload = {
        name:               form.name.trim(),
        description:        form.description,
        category:           form.category,
        basePrice:          Number(form.price),
        duration:           totalMins,
        isActive:           form.is_active,
        paymentType:        form.payType,
        depositType:        form.payType === "deposit" ? form.depositType : null,
        depositValue:       form.payType === "deposit" ? Number(form.depositValue) : null,
        clientNotesEnabled: form.clientNotesEnabled,
        photos:             form.photos,
      };

      let serviceId = id;

      if (isNew) {
        // Create via POST /api/services
        const res = await request("/services", {
          method: "POST",
          body: JSON.stringify({ ...servicePayload, unit: "visit" }),
        });
        serviceId = res.service?.id;
      } else {
        // Update via PUT /api/provider/services/:id
        await request(`/provider/services/${id}`, {
          method: "PUT",
          body: JSON.stringify(servicePayload),
        });
      }

      // Persist intake questions: delete-all + re-insert is simplest for MVP
      if (serviceId) {
        // Fetch existing saved questions to delete them
        const existing = await request(`/provider/services/${serviceId}/questions`).catch(() => ({ questions: [] }));
        // Delete all existing questions (cascade deletes options)
        await Promise.all(
          (existing.questions || []).map((q) =>
            request(`/provider/questions/${q.id}`, { method: "DELETE" }).catch(() => {})
          )
        );

        // Re-insert current questions
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          if (!q.question_text.trim()) continue;
          const created = await request(`/provider/services/${serviceId}/questions`, {
            method: "POST",
            body: JSON.stringify({
              questionText: q.question_text,
              questionType: q.question_type || "select",
              sortOrder: i,
            }),
          });
          const newQId = created.question?.id;
          if (newQId && q.options?.length > 0) {
            await request(`/provider/questions/${newQId}/options`, {
              method: "PUT",
              body: JSON.stringify({ options: q.options.map((o) => o.option_text) }),
            });
          }
        }
      }

      toast.push({ title: "Service saved", variant: "success" });
      navigate("/provider/services");
    } catch (err) {
      console.error("Failed to save service:", err);
      const description = err.isTimeout
        ? "Server is waking up — please try again in a moment."
        : err.message;
      toast.push({ title: "Failed to save", description, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col font-manrope bg-background" style={{ minHeight: "100dvh" }}>

      <Nav
        onBack={() => navigate("/provider/services")}
        title={isNew ? "Add service" : "Edit service"}
        onClose={() => navigate("/provider/services")}
      />

      <div className="flex-1 overflow-y-auto px-4 py-3 pb-28 flex flex-col gap-3">

        {/* ── Basic details ─────────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Basic details</SectionTitle>

          <div className="mb-3">
            <Label required>Service name</Label>
            <FieldInput
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. 1-on-1 Vocal Lesson"
              error={errors.name}
            />
          </div>

          <div className="mb-3">
            <Label required>Category</Label>
            <select
              value={form.category}
              onChange={set("category")}
              className="w-full font-manrope text-[15px] text-foreground rounded-card focus:outline-none appearance-none"
              style={{
                padding: "14px 16px",
                background: "#F2F2F7",
                border: errors.category ? "1.5px solid #EF4444" : "1px solid transparent",
              }}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            {errors.category && (
              <p className="font-manrope text-[12px] text-danger mt-1">{errors.category}</p>
            )}
          </div>

          <div className="mb-3">
            <Label required>Duration</Label>
            {errors.duration && (
              <p className="font-manrope text-[12px] text-danger mb-1">{errors.duration}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="number" min={0}
                value={form.durationHr}
                onChange={set("durationHr")}
                className="w-16 font-manrope text-[15px] text-foreground text-center rounded-card focus:outline-none"
                style={{ padding: "14px 8px", background: "#F2F2F7", border: "1px solid transparent" }}
              />
              <span className="font-manrope text-[15px] text-muted">hr</span>
              <input
                type="number" min={0} max={59}
                value={form.durationMin}
                onChange={set("durationMin")}
                className="w-16 font-manrope text-[15px] text-foreground text-center rounded-card focus:outline-none"
                style={{ padding: "14px 8px", background: "#F2F2F7", border: "1px solid transparent" }}
              />
              <span className="font-manrope text-[15px] text-muted">min</span>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Describe what this service includes…"
              rows={3}
              className="w-full font-manrope text-[15px] text-foreground rounded-card focus:outline-none resize-none"
              style={{ padding: "14px 16px", background: "#F2F2F7", border: "1px solid transparent" }}
            />
          </div>
        </Card>

        {/* ── Photos ────────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Photos</SectionTitle>
          <div className="flex gap-2 flex-wrap">
            {form.photos.map((url, i) => (
              <div key={i} className="relative" style={{ width: 76, height: 76, borderRadius: 12, overflow: "hidden" }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, photos: p.photos.filter((_, j) => j !== i) }))}
                  className="absolute top-1 right-1 flex items-center justify-center focus:outline-none"
                  style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.5)" }}
                >
                  <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 focus:outline-none"
              style={{ width: 76, height: 76, borderRadius: 12, border: "1.5px dashed #D1D5DB", background: "#F2F2F7" }}
            >
              <svg width="20" height="20" fill="none" stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span className="font-manrope text-[11px] text-muted">Add</span>
            </button>
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" />
          </div>
        </Card>

        {/* ── Pricing ───────────────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Pricing</SectionTitle>

          <div className="mb-4">
            <Label required>Price</Label>
            <FieldInput
              type="number"
              value={form.price}
              onChange={set("price")}
              placeholder="0"
              prefix="$"
              error={errors.price}
            />
          </div>

          <div className="mb-3">
            <Label>Payment collection</Label>
            <div className="flex gap-2">
              {[
                { id: "full", label: "Full upfront" },
                { id: "deposit", label: "Deposit + remainder" },
              ].map((opt) => {
                const active = form.payType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => set("payType")(opt.id)}
                    className="flex-1 font-manrope text-[13px] font-semibold rounded-card focus:outline-none transition-colors"
                    style={{
                      padding: "12px",
                      border: active ? "2px solid #FF751F" : "1px solid #E5E5EA",
                      background: active ? "#FFF0E6" : "#F2F2F7",
                      color: active ? "#FF751F" : "#0D1619",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {form.payType === "deposit" && (
            <>
              <div className="flex gap-2 mb-3">
                {[
                  { id: "percent", label: "Percentage" },
                  { id: "fixed", label: "Fixed amount" },
                ].map((opt) => {
                  const active = form.depositType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => set("depositType")(opt.id)}
                      className="flex-1 font-manrope text-[13px] font-semibold rounded-card focus:outline-none transition-colors"
                      style={{
                        padding: "10px",
                        border: active ? "2px solid #FF751F" : "1px solid #E5E5EA",
                        background: active ? "#FFF0E6" : "#F2F2F7",
                        color: active ? "#FF751F" : "#0D1619",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="mb-3">
                <Label>Deposit {form.depositType === "percent" ? "(%)" : "($)"}</Label>
                <FieldInput
                  type="number"
                  value={form.depositValue}
                  onChange={(e) => set("depositValue")(e.target.value)}
                  placeholder={form.depositType === "percent" ? "50" : "0"}
                  prefix={form.depositType === "fixed" ? "$" : undefined}
                />
              </div>

              {priceNum > 0 && (
                <div className="px-3 py-3 rounded-[10px]" style={{ background: "#FFFBEB" }}>
                  <p className="font-manrope text-[13px] m-0" style={{ color: "#92400E", lineHeight: 1.5 }}>
                    Client pays{" "}
                    <strong>
                      {form.depositType === "percent"
                        ? `${form.depositValue}% (${fmt$(depositAmt)})`
                        : fmt$(depositAmt)}
                    </strong>{" "}
                    at booking. Remaining <strong>{fmt$(remainder)}</strong> collected after service.
                  </p>
                </div>
              )}
            </>
          )}
        </Card>

        {/* ── Intake questions ──────────────────────────────────────────── */}
        <Card>
          <SectionTitle>Intake questions</SectionTitle>

          {questions.map((q, qi) => (
            <div
              key={q.id || q._localId || qi}
              className="mb-3 p-3.5 rounded-[12px]"
              style={{ border: "1px solid #E5E5EA", background: "#F9F9F9" }}
            >
              {/* Question text + remove */}
              <div className="flex items-start gap-2 mb-2">
                <input
                  value={q.question_text}
                  onChange={(e) => updateQuestionText(qi, e.target.value)}
                  placeholder="Type your question…"
                  className="flex-1 px-3 py-2.5 rounded-[10px] font-manrope text-[14px] text-foreground focus:outline-none"
                  style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="mt-0.5 flex-shrink-0 focus:outline-none"
                >
                  <svg width="18" height="18" fill="none" stroke="#6B7280" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <p className="font-manrope text-[12px] font-semibold text-muted mb-2 ml-0.5">
                Select from options
              </p>

              {/* Option pills */}
              <div className="flex flex-wrap gap-1.5">
                {(q.options || []).map((opt, oi) => (
                  <span
                    key={opt.id || opt._localId || oi}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full font-manrope text-[13px] text-foreground"
                    style={{ background: "#F2F2F7" }}
                  >
                    {opt.option_text}
                    <button
                      type="button"
                      onClick={() => removeOption(qi, oi)}
                      className="focus:outline-none ml-0.5"
                    >
                      <svg width="12" height="12" fill="none" stroke="#6B7280" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>

              {/* Inline option input */}
              <OptionInput onAdd={(text) => addOption(qi, text)} />
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full py-3 rounded-card font-manrope text-[14px] font-semibold text-muted focus:outline-none"
            style={{ border: "1.5px dashed #D1D5DB", background: "transparent" }}
          >
            + Add question
          </button>
        </Card>

        {/* ── Client notes ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-manrope text-[16px] font-semibold text-foreground m-0">Client notes</p>
              <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">
                Let clients add a note when booking
              </p>
            </div>
            <Toggle
              on={form.clientNotesEnabled}
              onToggle={() => set("clientNotesEnabled")(!form.clientNotesEnabled)}
            />
          </div>
        </Card>

        {/* ── Published ─────────────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-manrope text-[16px] font-semibold text-foreground m-0">Published</p>
              <p className="font-manrope text-[13px] text-muted m-0 mt-0.5">Visible to clients when on</p>
            </div>
            <Toggle
              on={form.is_active}
              onToggle={() => set("is_active")(!form.is_active)}
            />
          </div>
        </Card>

      </div>

      {/* ── Sticky bottom bar ─────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 flex gap-2.5 px-4 py-3 bg-white"
        style={{ borderTop: "0.5px solid #E5E5EA", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={() => navigate("/provider/services")}
          className="flex-1 py-4 rounded-card font-manrope text-[16px] font-semibold text-foreground focus:outline-none"
          style={{ background: "#FFFFFF", border: "1px solid #E5E5EA" }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="font-manrope text-[16px] font-bold text-white rounded-card focus:outline-none"
          style={{
            flex: 2, padding: "16px",
            background: saving ? "#B0B0B0" : "#0D1619",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save service"}
        </button>
      </div>
    </div>
  );
};

export default ProviderServiceEditor;
