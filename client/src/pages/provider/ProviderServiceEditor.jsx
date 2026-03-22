/**
 * ProviderServiceEditor — v6 Warm Editorial
 * Routes: /provider/services/new  →  create
 *         /provider/services/:id  →  edit
 *
 * API:
 *   GET  /api/provider/services/:id  → { service, questions }
 *   POST /api/services               → create
 *   PUT  /api/provider/services/:id  → update
 *   POST /api/provider/services/:serviceId/questions → add question
 *   PUT  /api/provider/questions/:id/options         → set options
 *   DELETE /api/provider/questions/:id               → remove question
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { request } from '../../data/apiClient';
import BackBtn from '../../components/ui/BackBtn';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Toggle from '../../components/ui/Toggle';
import { useToast } from '../../components/ui/ToastProvider';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt$ = (n) => `$${Number(n).toFixed(2)}`;

// ─── Primitives ───────────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
    <p className="text-[18px] font-semibold text-ink tracking-[-0.02em] m-0 mb-4">{children}</p>
);

const FieldLabel = ({ children, required }) => (
    <label className="block text-[13px] font-semibold text-muted uppercase tracking-[0.04em] mb-2">
        {children}{required && <span style={{ color: '#C25E4A' }}> *</span>}
    </label>
);

const FieldError = ({ msg }) =>
    msg ? <p className="text-[12px] mt-1 m-0" style={{ color: '#C25E4A' }}>{msg}</p> : null;

const inputBase = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 12,
    border: '1px solid rgba(140,106,100,0.2)',
    background: '#F2EBE5',
    fontFamily: 'inherit',
    fontSize: 15,
    color: '#3D231E',
    outline: 'none',
    boxSizing: 'border-box',
};

const inputError = { border: '1.5px solid #C25E4A' };

// Toggle
// Segment control (two options)
const Segment = ({ options, value, onChange }) => (
    <div className="flex gap-2">
        {options.map((opt) => {
            const active = value === opt.id;
            return (
                <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChange(opt.id)}
                    className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold focus:outline-none transition-colors"
                    style={{
                        border: active ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                        background: active ? '#FDDCC6' : 'transparent',
                        color: active ? '#C25E4A' : '#8C6A64',
                    }}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

// Section card (on cream — just a block with bottom divider)
const Section = ({ children, className = '' }) => (
    <div className={`px-5 py-5 ${className}`}>
        {children}
    </div>
);

// ─── Option pill ──────────────────────────────────────────────────────────────

const OptionPill = ({ text, onRemove }) => (
    <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] text-ink"
        style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.15)' }}
    >
        {text}
        <button type="button" onClick={onRemove} className="focus:outline-none flex-shrink-0">
            <svg width="11" height="11" fill="none" stroke="#B0948F" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
        </button>
    </span>
);

// ─── Inline option adder ──────────────────────────────────────────────────────

const OptionAdder = ({ onAdd }) => {
    const [val, setVal] = useState('');
    const ref = useRef(null);
    const submit = () => {
        if (!val.trim()) return;
        onAdd(val.trim());
        setVal('');
        ref.current?.focus();
    };
    return (
        <span
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[13px] font-semibold cursor-pointer"
            style={{ border: '1.5px dashed rgba(140,106,100,0.4)', color: '#C25E4A', background: 'transparent' }}
        >
            <input
                ref={ref}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
                placeholder="+ Add option"
                className="focus:outline-none bg-transparent text-[13px]"
                style={{ width: val ? Math.max(80, val.length * 9) : 88, color: '#C25E4A', fontFamily: 'inherit', border: 'none' }}
            />
            {val.trim() && (
                <button
                    type="button"
                    onClick={submit}
                    className="focus:outline-none flex-shrink-0 ml-1"
                    style={{ color: '#C25E4A', fontWeight: 700, fontSize: 15, lineHeight: 1 }}
                >
                    ↵
                </button>
            )}
        </span>
    );
};

// ─── Question card ────────────────────────────────────────────────────────────

const QuestionCard = ({ q, qi, onTextChange, onAddOption, onRemoveOption, onRemove }) => (
    <div
        className="mb-3 p-4 rounded-[14px]"
        style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.15)' }}
    >
        {/* Question text + trash */}
        <div className="flex items-start gap-2 mb-3">
            <input
                value={q.question_text}
                onChange={(e) => onTextChange(qi, e.target.value)}
                placeholder="Type your question…"
                className="flex-1 px-3 py-2.5 rounded-[10px] text-[14px] text-ink focus:outline-none"
                style={{ background: '#FFFFFF', border: '1px solid rgba(140,106,100,0.15)', fontFamily: 'inherit' }}
            />
            <button
                type="button"
                onClick={() => onRemove(qi)}
                className="mt-0.5 flex-shrink-0 focus:outline-none active:opacity-60"
            >
                <svg width="18" height="18" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>

        <Lbl className="block mb-2">Select options</Lbl>

        {/* Option pills + adder */}
        <div className="flex flex-wrap gap-1.5">
            {(q.options || []).map((opt, oi) => (
                <OptionPill
                    key={opt.id || opt._localId || oi}
                    text={opt.option_text}
                    onRemove={() => onRemoveOption(qi, oi)}
                />
            ))}
            <OptionAdder onAdd={(text) => onAddOption(qi, text)} />
        </div>
    </div>
);

// ─── Default form ─────────────────────────────────────────────────────────────

const EMPTY_FORM = {
    name: '',
    durationHr: 1,
    durationMin: 0,
    description: '',
    price: '',
    payType: 'full',
    depositType: 'percent',
    depositValue: 50,
    clientNotesEnabled: true,
    is_active: true,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderServiceEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isNew = !id || id === 'new';
    const toast = useToast();

    // Pre-selected group from ProviderServices "Add to group"
    const preGroupId = location.state?.groupId || null;

    const [form, setForm] = useState(EMPTY_FORM);
    const [questions, setQuestions] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [savingStatus, setSavingStatus] = useState('');

    // ── Load existing ────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        if (isNew) return;
        setLoading(true);
        try {
            const data = await request(`/provider/services/${id}`);
            const svc = data.service;
            if (svc) {
                const totalMins = svc.duration || 60;
                setForm({
                    name:               svc.name || '',
                    durationHr:         Math.floor(totalMins / 60),
                    durationMin:        totalMins % 60,
                    description:        svc.description || '',
                    price:              svc.base_price != null ? String(svc.base_price) : '',
                    payType:            svc.payment_type || 'full',
                    depositType:        svc.deposit_type || 'percent',
                    depositValue:       svc.deposit_value != null ? svc.deposit_value : 50,
                    clientNotesEnabled: svc.client_notes_enabled !== false,
                    is_active:          svc.is_active !== false,
                });
            }
            setQuestions(data.questions || []);
        } catch (err) {
            console.error('[ProviderServiceEditor] load error:', err);
        } finally {
            setLoading(false);
        }
    }, [id, isNew]);

    useEffect(() => { load(); }, [load]);

    const set = (field) => (val) =>
        setForm((p) => ({ ...p, [field]: val?.target ? val.target.value : val }));

    // ── Deposit calc ─────────────────────────────────────────────────────────
    const priceNum   = parseFloat(form.price) || 0;
    const depositAmt = form.depositType === 'percent'
        ? (priceNum * Number(form.depositValue)) / 100
        : Math.min(parseFloat(form.depositValue) || 0, priceNum);
    const remainder  = Math.max(priceNum - depositAmt, 0);

    // ── Question helpers ─────────────────────────────────────────────────────
    const addQuestion = () => {
        setQuestions((prev) => [
            ...prev,
            { id: null, _localId: Date.now(), question_text: '', question_type: 'select', sort_order: prev.length, options: [] },
        ]);
    };

    const updateQuestionText = (idx, text) => {
        setQuestions((prev) => {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], question_text: text };
            return updated;
        });
    };

    const removeQuestion = (idx) =>
        setQuestions((prev) => prev.filter((_, i) => i !== idx));

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

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.price || Number(form.price) <= 0) errs.price = 'Must be greater than 0';
        const totalMins = Number(form.durationHr) * 60 + Number(form.durationMin);
        if (totalMins <= 0) errs.duration = 'Must be greater than 0';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setSaving(true);
        setSavingStatus('Saving…');
        const slowTimer = setTimeout(() => setSavingStatus('Server is waking up…'), 5000);

        try {
            const servicePayload = {
                name:               form.name.trim(),
                description:        form.description,
                category:           'General',
                basePrice:          Number(form.price),
                duration:           totalMins,
                isActive:           form.is_active,
                paymentType:        form.payType,
                depositType:        form.payType === 'deposit' ? form.depositType : null,
                depositValue:       form.payType === 'deposit' ? Number(form.depositValue) : null,
                clientNotesEnabled: form.clientNotesEnabled,
            };

            let serviceId = id;

            if (isNew) {
                const res = await request('/services', {
                    method: 'POST',
                    body: JSON.stringify({ ...servicePayload, unit: 'visit' }),
                });
                serviceId = res.service?.id;
                // Assign to group if coming from "Add to group"
                if (serviceId && preGroupId) {
                    await request(`/provider/services/${serviceId}/group`, {
                        method: 'PATCH',
                        body: JSON.stringify({ group_id: preGroupId }),
                    }).catch(() => {});
                }
            } else {
                await request(`/provider/services/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(servicePayload),
                });
            }

            // Persist intake questions: delete-all + re-insert
            if (serviceId) {
                setSavingStatus('Saving questions…');
                const existing = await request(`/provider/services/${serviceId}/questions`).catch(() => ({ questions: [] }));
                await Promise.all(
                    (existing.questions || []).map((q) =>
                        request(`/provider/questions/${q.id}`, { method: 'DELETE' }).catch(() => {})
                    )
                );
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    if (!q.question_text.trim()) continue;
                    const created = await request(`/provider/services/${serviceId}/questions`, {
                        method: 'POST',
                        body: JSON.stringify({
                            questionText: q.question_text,
                            questionType: q.question_type || 'select',
                            sortOrder: i,
                        }),
                    });
                    const newQId = created.question?.id;
                    if (newQId && q.options?.length > 0) {
                        await request(`/provider/questions/${newQId}/options`, {
                            method: 'PUT',
                            body: JSON.stringify({ options: q.options.map((o) => o.option_text) }),
                        });
                    }
                }
            }

            toast.push({ title: 'Service saved', variant: 'success' });
            navigate('/provider/services');
        } catch (err) {
            console.error('[ProviderServiceEditor] save error:', err);
            toast.push({
                title: 'Failed to save',
                description: err.isTimeout ? 'Server is waking up — please try again.' : err.message,
                variant: 'error',
            });
        } finally {
            clearTimeout(slowTimer);
            setSaving(false);
            setSavingStatus('');
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base items-center justify-center">
                <div
                    className="w-9 h-9 rounded-full"
                    style={{
                        border: '2px solid rgba(140,106,100,0.2)',
                        borderTop: '2px solid #C25E4A',
                        animation: 'spin 0.8s linear infinite',
                    }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {/* ── Back nav ── */}
            <div className="flex items-center justify-between px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/services')} />
                <p className="text-[14px] font-semibold text-muted m-0">
                    {isNew ? 'New service' : 'Edit service'}
                </p>
                <div style={{ width: 36 }} /> {/* spacer */}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto pb-32">

                {/* ─ Basic details ─ */}
                <Section>
                    <SectionLabel>Basic details</SectionLabel>

                    <div className="mb-4">
                        <FieldLabel required>Service name</FieldLabel>
                        <input
                            value={form.name}
                            onChange={set('name')}
                            placeholder="e.g. 1-on-1 Vocal Lesson"
                            style={{ ...inputBase, ...(errors.name ? inputError : {}) }}
                        />
                        <FieldError msg={errors.name} />
                    </div>

                    <div className="mb-4">
                        <FieldLabel required>Duration</FieldLabel>
                        <div className="flex items-center gap-2">
                            <input
                                type="number" min={0}
                                value={form.durationHr}
                                onChange={set('durationHr')}
                                style={{ ...inputBase, width: 64, textAlign: 'center', padding: '13px 8px' }}
                            />
                            <span className="text-[15px] text-muted">hr</span>
                            <input
                                type="number" min={0} max={59}
                                value={form.durationMin}
                                onChange={set('durationMin')}
                                style={{ ...inputBase, width: 64, textAlign: 'center', padding: '13px 8px' }}
                            />
                            <span className="text-[15px] text-muted">min</span>
                        </div>
                        <FieldError msg={errors.duration} />
                    </div>

                    <div>
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Describe what this service includes…"
                            rows={3}
                            style={{ ...inputBase, resize: 'vertical' }}
                        />
                    </div>
                </Section>

                <Divider />

                {/* ─ Pricing ─ */}
                <Section>
                    <SectionLabel>Pricing</SectionLabel>

                    <div className="mb-4">
                        <FieldLabel required>Price</FieldLabel>
                        <div className="relative">
                            <span
                                className="absolute text-[15px] text-muted pointer-events-none"
                                style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
                            >$</span>
                            <input
                                type="number"
                                value={form.price}
                                onChange={set('price')}
                                placeholder="0"
                                style={{ ...inputBase, paddingLeft: 30, ...(errors.price ? inputError : {}) }}
                            />
                        </div>
                        <FieldError msg={errors.price} />
                    </div>

                    <div className="mb-3">
                        <FieldLabel>Payment collection</FieldLabel>
                        <Segment
                            options={[
                                { id: 'full', label: 'Full upfront' },
                                { id: 'deposit', label: 'Deposit + remainder' },
                            ]}
                            value={form.payType}
                            onChange={set('payType')}
                        />
                    </div>

                    {form.payType === 'deposit' && (
                        <>
                            <div className="mb-3 mt-4">
                                <FieldLabel>Deposit type</FieldLabel>
                                <Segment
                                    options={[
                                        { id: 'percent', label: 'Percentage' },
                                        { id: 'fixed', label: 'Fixed amount' },
                                    ]}
                                    value={form.depositType}
                                    onChange={set('depositType')}
                                />
                            </div>

                            <div className="mb-3">
                                <FieldLabel>
                                    {form.depositType === 'percent' ? 'Deposit (%)' : 'Deposit ($)'}
                                </FieldLabel>
                                <div className="relative">
                                    {form.depositType === 'fixed' && (
                                        <span
                                            className="absolute text-[15px] text-muted pointer-events-none"
                                            style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
                                        >$</span>
                                    )}
                                    <input
                                        type="number"
                                        value={form.depositValue}
                                        onChange={(e) => set('depositValue')(e.target.value)}
                                        placeholder={form.depositType === 'percent' ? '50' : '0'}
                                        style={{
                                            ...inputBase,
                                            paddingLeft: form.depositType === 'fixed' ? 30 : 16,
                                        }}
                                    />
                                </div>
                            </div>

                            {priceNum > 0 && (
                                <div
                                    className="px-4 py-3 rounded-[12px]"
                                    style={{ background: '#FFF5E6' }}
                                >
                                    <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#92400E' }}>
                                        Client pays now:{' '}
                                        <strong>
                                            {form.depositType === 'percent'
                                                ? `${form.depositValue}% (${fmt$(depositAmt)})`
                                                : fmt$(depositAmt)}
                                        </strong>
                                        <br />
                                        Remaining after service: <strong>{fmt$(remainder)}</strong>
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </Section>

                <Divider />

                {/* ─ Intake questions ─ */}
                <Section>
                    <SectionLabel>Intake questions</SectionLabel>

                    {questions.map((q, qi) => (
                        <QuestionCard
                            key={q.id || q._localId || qi}
                            q={q}
                            qi={qi}
                            onTextChange={updateQuestionText}
                            onAddOption={addOption}
                            onRemoveOption={removeOption}
                            onRemove={removeQuestion}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full py-3.5 rounded-[14px] text-[13px] font-semibold focus:outline-none active:opacity-60"
                        style={{
                            border: '1.5px dashed rgba(140,106,100,0.4)',
                            background: 'transparent',
                            color: '#8C6A64',
                        }}
                    >
                        + Add Question
                    </button>
                </Section>

                <Divider />

                {/* ─ Client notes toggle ─ */}
                <Section>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[16px] font-semibold text-ink m-0">Client notes</p>
                            <p className="text-[13px] text-muted m-0 mt-0.5">
                                Let clients add a note when booking
                            </p>
                        </div>
                        <Toggle
                            on={form.clientNotesEnabled}
                            onChange={() => set('clientNotesEnabled')(!form.clientNotesEnabled)}
                            activeColor="#3D231E"
                        />
                    </div>
                </Section>

                <Divider />

                {/* ─ Published toggle ─ */}
                <Section>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[16px] font-semibold text-ink m-0">Published</p>
                            <p className="text-[13px] text-muted m-0 mt-0.5">
                                Visible to clients when on
                            </p>
                        </div>
                        <Toggle
                            on={form.is_active}
                            onChange={() => set('is_active')(!form.is_active)}
                            activeColor="#3D231E"
                        />
                    </div>
                </Section>

            </div>

            {/* ── Sticky bottom bar ── */}
            <div
                className="fixed bottom-0 left-0 right-0 flex gap-3 px-5 py-3"
                style={{
                    background: '#FBF7F2',
                    borderTop: '1px solid rgba(140,106,100,0.15)',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
            >
                <button
                    type="button"
                    onClick={() => navigate('/provider/services')}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
                    style={{ background: '#3D231E', border: 'none', opacity: saving ? 0.7 : 1 }}
                >
                    {saving && (
                        <div
                            style={{
                                width: 14, height: 14, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #fff',
                                animation: 'spin 0.8s linear infinite',
                                flexShrink: 0,
                            }}
                        />
                    )}
                    <span style={{ fontSize: saving && savingStatus.length > 10 ? 12 : 13 }}>
                        {saving ? (savingStatus || 'Saving…') : 'Save Service'}
                    </span>
                </button>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ProviderServiceEditor;
