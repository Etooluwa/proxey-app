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
import { useSession } from '../../auth/authContext';
import { request } from '../../data/apiClient';
import { fetchProviderProfile } from '../../data/provider';
import { supabase } from '../../utils/supabase';
import BackBtn from '../../components/ui/BackBtn';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Toggle from '../../components/ui/Toggle';
import { useToast } from '../../components/ui/ToastProvider';
import { formatMoneyFromDollars } from '../../utils/formatMoney';
import { CURRENCIES } from '../../components/ui/CurrencySelect';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const APP_ORIGIN = process.env.REACT_APP_APP_URL || window.location.origin;

// fmt$ is called in render — receives currency from profile at call site
const fmt$ = (n, currency = 'cad') => formatMoneyFromDollars(Number(n), currency);

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

        <div className="mb-2">
            <Lbl className="block mb-0.5">Answer options</Lbl>
            <p className="text-[11px] m-0 leading-relaxed" style={{ color: '#B0948F' }}>
                Add options → client picks one from a list. Leave empty → client types a free-text answer.
            </p>
        </div>

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
    pricingType: 'fixed', // 'fixed' | 'per_hour'
    durationHr: 1,
    durationMin: 0,
    minHours: 1,
    maxHours: 8,
    description: '',
    price: '',
    payType: 'full',
    depositType: 'percent',
    depositValue: 50,
    clientNotesEnabled: true,
    autoAccept: false,
    is_active: true,
    group_id: null,
    preAppointmentInfo: [],
    imageUrl: '',
    noShowFeeEnabled: false,
    noShowFeeType: 'percent',   // 'percent' | 'fixed'
    noShowFeeValue: 50,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderServiceEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const isNew = !id || id === 'new';
    const toast = useToast();
    const { profile } = useSession();

    const [linkCopied, setLinkCopied] = useState(false);
    const bookingUrl = !isNew && profile?.handle ? `${APP_ORIGIN}/book/${profile.handle}?service=${id}` : null;

    const copyBookingLink = () => {
        if (!bookingUrl) return;
        navigator.clipboard.writeText(bookingUrl).then(() => {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        });
    };

    // Pre-selected group from ProviderServices "Add to group"
    const preGroupId = location.state?.groupId || null;

    const [form, setForm] = useState(EMPTY_FORM);
    const [groups, setGroups] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(!isNew);
    const [providerCurrency, setProviderCurrency] = useState('cad');
    const [saving, setSaving] = useState(false);
    const [savingStatus, setSavingStatus] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [photoUploading, setPhotoUploading] = useState(false);
    const photoInputRef = useRef(null);

    // ── Load existing ────────────────────────────────────────────────────────
    const load = useCallback(async () => {
        if (isNew) return;
        setLoading(true);
        try {
            const data = await request(`/provider/services/${id}`);
            const svc = data.service;
            if (svc) {
                const totalMins = svc.duration || 60;
                const pricingType = svc.metadata?.pricingType || 'fixed';
                setForm({
                    name:               svc.name || '',
                    pricingType,
                    durationHr:         Math.floor(totalMins / 60),
                    durationMin:        totalMins % 60,
                    minHours:           svc.metadata?.minHours ?? 1,
                    maxHours:           svc.metadata?.maxHours ?? 8,
                    description:        svc.description || '',
                    price:              svc.base_price != null ? String(svc.base_price / 100) : '',
                    payType:            svc.payment_type || 'full',
                    depositType:        svc.deposit_type || 'percent',
                    depositValue:       svc.deposit_value != null ? svc.deposit_value : 50,
                    clientNotesEnabled: svc.client_notes_enabled !== false,
                    autoAccept:         svc.metadata?.autoAccept === true,
                    noShowFeeEnabled:   svc.metadata?.noShowFee?.enabled === true,
                    noShowFeeType:      svc.metadata?.noShowFee?.type || 'percent',
                    noShowFeeValue:     svc.metadata?.noShowFee?.value ?? 50,
                    is_active:          svc.is_active !== false,
                    group_id:           svc.group_id || null,
                    preAppointmentInfo: svc.metadata?.preAppointmentInfo || [],
                    imageUrl:           svc.image_url || '',
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

    useEffect(() => {
        fetchProviderProfile().then((p) => {
            if (p?.currency) setProviderCurrency(p.currency.toLowerCase());
        }).catch(() => {});
    }, []);

    // Load groups for the group selector
    useEffect(() => {
        request('/provider/services')
            .then((data) => setGroups(data.groups || []))
            .catch(() => {});
    }, []);

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

    // ── Photo upload ─────────────────────────────────────────────────────────
    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.push({ title: 'Invalid file', description: 'Please select an image file.', variant: 'error' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.push({ title: 'File too large', description: 'Max photo size is 5 MB.', variant: 'error' });
            return;
        }
        setPhotoUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `service-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
            const { data, error } = await supabase.storage
                .from('kliques-media')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            const { data: { publicUrl } } = supabase.storage
                .from('kliques-media')
                .getPublicUrl(data.path);
            set('imageUrl')(publicUrl);
        } catch (err) {
            console.error('[ProviderServiceEditor] photo upload error:', err);
            toast.push({ title: 'Upload failed', description: err.message, variant: 'error' });
        } finally {
            setPhotoUploading(false);
            if (photoInputRef.current) photoInputRef.current.value = '';
        }
    };

    const handleRemovePhoto = () => set('imageUrl')('');

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        const errs = {};
        if (!form.name.trim()) errs.name = 'Required';
        if (!form.price || Number(form.price) <= 0) errs.price = 'Must be greater than 0';
        const totalMins = Number(form.durationHr) * 60 + Number(form.durationMin);
        if (form.pricingType !== 'per_hour' && totalMins <= 0) errs.duration = 'Must be greater than 0';
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
                duration:           form.pricingType === 'per_hour' ? Number(form.minHours) * 60 : totalMins,
                isActive:           form.is_active,
                paymentType:        form.payType,
                depositType:        form.payType === 'deposit' ? form.depositType : null,
                depositValue:       form.payType === 'deposit' ? Number(form.depositValue) : null,
                clientNotesEnabled: form.clientNotesEnabled,
                autoAccept:         form.autoAccept,
                preAppointmentInfo: form.preAppointmentInfo,
                noShowFee: form.noShowFeeEnabled ? {
                    enabled: true,
                    type:    form.noShowFeeType,
                    value:   Number(form.noShowFeeValue),
                } : { enabled: false },
                pricingType:        form.pricingType,
                minHours:           form.pricingType === 'per_hour' ? Number(form.minHours) : null,
                maxHours:           form.pricingType === 'per_hour' ? Number(form.maxHours) : null,
                imageUrl:           form.imageUrl || null,
            };

            let serviceId = id;

            // Resolve effective group: form selection > preGroupId (from "Add to group" nav)
            const effectiveGroupId = form.group_id || preGroupId || null;

            if (isNew) {
                const res = await request('/services', {
                    method: 'POST',
                    body: JSON.stringify({ ...servicePayload, unit: 'visit' }),
                });
                serviceId = res.service?.id;
                if (serviceId && effectiveGroupId) {
                    await request(`/provider/services/${serviceId}/group`, {
                        method: 'PATCH',
                        body: JSON.stringify({ group_id: effectiveGroupId }),
                    }).catch(() => {});
                }
            } else {
                await request(`/provider/services/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(servicePayload),
                });
                // Update group assignment
                await request(`/provider/services/${id}/group`, {
                    method: 'PATCH',
                    body: JSON.stringify({ group_id: effectiveGroupId }),
                }).catch(() => {});
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

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!window.confirm('Delete this service? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await request(`/services/${id}`, { method: 'DELETE' });
            toast.push({ title: 'Service deleted', variant: 'success' });
            navigate('/provider/services');
        } catch (err) {
            toast.push({ title: 'Failed to delete', description: err.message, variant: 'error' });
            setDeleting(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
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
                {bookingUrl ? (
                    <button
                        onClick={copyBookingLink}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold focus:outline-none active:opacity-60"
                        style={{
                            background: linkCopied ? '#EBF2EC' : 'rgba(140,106,100,0.1)',
                            color: linkCopied ? '#5A8A5E' : '#8C6A64',
                            border: 'none',
                            transition: 'all .2s',
                        }}
                        title="Copy booking link for this service"
                    >
                        {linkCopied ? (
                            <>
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Copied
                            </>
                        ) : (
                            <>
                                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M16 8h2a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                Copy link
                            </>
                        )}
                    </button>
                ) : (
                    <div style={{ width: 36 }} />
                )}
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

                    {form.pricingType !== 'per_hour' && (
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
                    )}

                    <div className="mb-4">
                        <FieldLabel>Description</FieldLabel>
                        <textarea
                            value={form.description}
                            onChange={set('description')}
                            placeholder="Describe what this service includes…"
                            rows={3}
                            style={{ ...inputBase, resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <FieldLabel>Group</FieldLabel>
                        <select
                            value={form.group_id || ''}
                            onChange={(e) => set('group_id')(e.target.value || null)}
                            style={{ ...inputBase, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 7L11 1' stroke='%238C6A64' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 }}
                        >
                            <option value="">General (no group)</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                </Section>

                <Divider />

                {/* ─ Service photo ─ */}
                <Section>
                    <SectionLabel>Service photo</SectionLabel>
                    <p className="text-[13px] text-muted m-0 mb-4 leading-relaxed">
                        Add a photo to showcase this service on your booking page. Optional.
                    </p>

                    <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                    />

                    {form.imageUrl ? (
                        <div className="relative" style={{ width: '100%', borderRadius: 14, overflow: 'hidden', aspectRatio: '16/9' }}>
                            <img
                                src={form.imageUrl}
                                alt="Service"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                            <div
                                className="absolute inset-0 flex items-end justify-end p-3"
                                style={{ background: 'linear-gradient(to top, rgba(61,35,30,0.5) 0%, transparent 60%)' }}
                            >
                                <button
                                    type="button"
                                    onClick={handleRemovePhoto}
                                    className="px-3 py-1.5 rounded-lg text-[12px] font-semibold focus:outline-none"
                                    style={{ background: 'rgba(61,35,30,0.7)', color: '#fff', border: 'none' }}
                                >
                                    Remove
                                </button>
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    className="ml-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold focus:outline-none"
                                    style={{ background: 'rgba(255,255,255,0.85)', color: '#3D231E', border: 'none' }}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => !photoUploading && photoInputRef.current?.click()}
                            disabled={photoUploading}
                            className="w-full flex flex-col items-center justify-center gap-2 focus:outline-none"
                            style={{
                                border: '1.5px dashed rgba(140,106,100,0.4)',
                                borderRadius: 14,
                                background: 'transparent',
                                padding: '32px 16px',
                                cursor: photoUploading ? 'not-allowed' : 'pointer',
                                opacity: photoUploading ? 0.6 : 1,
                            }}
                        >
                            {photoUploading ? (
                                <>
                                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(140,106,100,0.2)', borderTop: '2px solid #C25E4A', animation: 'spin 0.8s linear infinite' }} />
                                    <span className="text-[13px] text-muted">Uploading…</span>
                                </>
                            ) : (
                                <>
                                    <svg width="28" height="28" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M4 16l4-4 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" />
                                        <rect x="3" y="3" width="18" height="18" rx="3" />
                                    </svg>
                                    <span className="text-[13px] font-medium" style={{ color: '#8C6A64' }}>Tap to upload photo</span>
                                    <span className="text-[11px]" style={{ color: '#B0948F' }}>JPG, PNG, WEBP · Max 5 MB</span>
                                </>
                            )}
                        </button>
                    )}
                </Section>

                <Divider />

                {/* ─ Pricing ─ */}
                <Section>
                    <SectionLabel>Pricing</SectionLabel>

                    {/* Currency info — read-only, inherited from provider profile */}
                    <div className="mb-5 px-4 py-3 rounded-[12px]" style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.15)' }}>
                        <p className="text-[13px] m-0" style={{ color: '#8C6A64' }}>
                            Prices are in <strong style={{ color: '#3D231E' }}>{(providerCurrency || 'cad').toUpperCase()}</strong> — set in your{' '}
                            <button
                                type="button"
                                onClick={() => navigate('/provider/settings/personal')}
                                className="underline focus:outline-none"
                                style={{ color: '#C25E4A', fontFamily: 'inherit', fontSize: 'inherit', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            >
                                profile settings
                            </button>.
                        </p>
                    </div>

                    <div className="mb-4">
                        <FieldLabel>Pricing type</FieldLabel>
                        <Segment
                            options={[
                                { id: 'fixed', label: 'Fixed Price' },
                                { id: 'per_hour', label: 'Per Hour' },
                            ]}
                            value={form.pricingType}
                            onChange={set('pricingType')}
                        />
                    </div>

                    <div className="mb-4">
                        <FieldLabel required>{form.pricingType === 'per_hour' ? 'Price per hour' : 'Price'}</FieldLabel>
                        <div className="relative">
                            <span
                                className="absolute text-[15px] text-muted pointer-events-none"
                                style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}
                            >{CURRENCIES.find(c => c.code === providerCurrency)?.symbol || '$'}</span>
                            <input
                                type="number"
                                value={form.price}
                                onChange={set('price')}
                                placeholder="0"
                                style={{ ...inputBase, paddingLeft: 30, ...(errors.price ? inputError : {}) }}
                            />
                            {form.pricingType === 'per_hour' && (
                                <span
                                    className="absolute text-[13px] text-muted pointer-events-none"
                                    style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}
                                >/hr</span>
                            )}
                        </div>
                        <FieldError msg={errors.price} />
                    </div>

                    {form.pricingType === 'per_hour' && (
                        <div className="mb-4">
                            <FieldLabel>Booking hours range</FieldLabel>
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <p className="text-[11px] text-muted uppercase tracking-wider mb-1.5">Min hours</p>
                                    <input
                                        type="number" min={1}
                                        value={form.minHours}
                                        onChange={set('minHours')}
                                        style={{ ...inputBase, textAlign: 'center' }}
                                    />
                                </div>
                                <span className="text-muted text-[15px] mt-5">–</span>
                                <div className="flex-1">
                                    <p className="text-[11px] text-muted uppercase tracking-wider mb-1.5">Max hours</p>
                                    <input
                                        type="number" min={1}
                                        value={form.maxHours}
                                        onChange={set('maxHours')}
                                        style={{ ...inputBase, textAlign: 'center' }}
                                    />
                                </div>
                            </div>
                            <p className="text-[12px] text-muted mt-2">
                                Clients can book between {form.minHours}–{form.maxHours} hours. Total cost is calculated at booking.
                            </p>
                        </div>
                    )}

                    <div className="mb-3">
                        <FieldLabel>Payment collection</FieldLabel>
                        <Segment
                            options={[
                                { id: 'save_card', label: 'Card on file' },
                                { id: 'deposit', label: 'Deposit' },
                                { id: 'full', label: 'Full upfront' },
                            ]}
                            value={form.payType}
                            onChange={set('payType')}
                        />
                    </div>

                    {form.payType === 'save_card' && (
                        <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                            <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#92400E' }}>
                                Client saves a card at booking — no charge is made upfront. You charge the full amount from your bookings page once the session is complete.
                            </p>
                        </div>
                    )}

                    {form.payType === 'full' && (
                        <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                            <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#92400E' }}>
                                {priceNum > 0 ? (
                                    <>Client pays <strong>{fmt$(priceNum, providerCurrency)}</strong> in full at booking. You still confirm before the session takes place.</>
                                ) : (
                                    <>Client pays the full service amount at booking. You still confirm before the session takes place.</>
                                )}
                            </p>
                        </div>
                    )}

                    {form.payType === 'deposit' && (
                        <>
                            <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                                <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#92400E' }}>
                                    Client pays a deposit at booking, and the remaining balance is charged after the session is complete.
                                </p>
                            </div>

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
                                                ? `${form.depositValue}% (${fmt$(depositAmt, providerCurrency)})`
                                                : fmt$(depositAmt, providerCurrency)}
                                        </strong>
                                        <br />
                                        Remaining after service: <strong>{fmt$(remainder, providerCurrency)}</strong>
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </Section>

                <Divider />

                {/* ─ No-show fee — only shown when Card on file is selected ─ */}
                {form.payType === 'save_card' && (
                <>
                <Section>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[16px] font-semibold text-ink m-0">No-show fee</p>
                            <p className="text-[13px] text-muted m-0 mt-0.5">
                                Charge clients who don't show up
                            </p>
                        </div>
                        <Toggle
                            on={form.noShowFeeEnabled}
                            onChange={() => set('noShowFeeEnabled')(!form.noShowFeeEnabled)}
                            activeColor="#3D231E"
                        />
                    </div>

                    {form.noShowFeeEnabled && (
                        <div className="mt-4">
                            <div className="flex gap-2 mb-3">
                                {[
                                    { value: 'percent', label: 'Percentage' },
                                    { value: 'fixed',   label: 'Fixed amount' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('noShowFeeType')(opt.value)}
                                        className="flex-1 py-2 rounded-[10px] text-[13px] font-semibold focus:outline-none transition-colors"
                                        style={{
                                            background: form.noShowFeeType === opt.value ? '#3D231E' : 'transparent',
                                            color:      form.noShowFeeType === opt.value ? '#fff' : '#8C6A64',
                                            border:     `1.5px solid ${form.noShowFeeType === opt.value ? '#3D231E' : 'rgba(140,106,100,0.3)'}`,
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                {form.noShowFeeType === 'fixed' && (
                                    <span className="absolute text-[15px] text-muted pointer-events-none" style={{ left: 16, top: '50%', transform: 'translateY(-50%)' }}>
                                        {CURRENCIES.find(c => c.code === providerCurrency)?.symbol || '$'}
                                    </span>
                                )}
                                <input
                                    type="number"
                                    min={1}
                                    max={form.noShowFeeType === 'percent' ? 100 : undefined}
                                    value={form.noShowFeeValue}
                                    onChange={e => set('noShowFeeValue')(e.target.value)}
                                    style={{
                                        ...inputBase,
                                        paddingLeft: form.noShowFeeType === 'fixed' ? 30 : 16,
                                        paddingRight: form.noShowFeeType === 'percent' ? 36 : 16,
                                    }}
                                />
                                {form.noShowFeeType === 'percent' && (
                                    <span className="absolute text-[15px] text-muted pointer-events-none" style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}>%</span>
                                )}
                            </div>
                            <p className="text-[12px] text-muted mt-2 mb-0">
                                {form.noShowFeeType === 'percent'
                                    ? `Client will be charged ${form.noShowFeeValue || 0}% of the service price if they don't show up.`
                                    : `Client will be charged a flat ${CURRENCIES.find(c => c.code === providerCurrency)?.symbol || '$'}${form.noShowFeeValue || 0} fee if they don't show up.`
                                }
                            </p>
                        </div>
                    )}
                </Section>
                <Divider />
                </>
                )}

                <Divider />

                {/* ─ Intake questions ─ */}
                <Section>
                    <SectionLabel>Intake questions</SectionLabel>
                    <p className="text-[13px] text-muted m-0 mb-4 leading-relaxed">
                        Ask clients questions when they book. Their answers will be visible to you on the appointment.
                    </p>

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

                {/* ─ Must-knows / Pre-appointment info ─ */}
                <Section>
                    <SectionLabel>Before the appointment</SectionLabel>
                    <p className="text-[13px] text-muted m-0 mb-4 leading-relaxed">
                        Add things clients should know or prepare before coming. These will be shown during booking and in their confirmation.
                    </p>

                    {(form.preAppointmentInfo || []).map((item, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div
                                className="flex-1 flex items-center gap-2 px-4 py-3 rounded-[12px]"
                                style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.15)' }}
                            >
                                <span className="text-[13px] text-muted flex-shrink-0">•</span>
                                <input
                                    value={item}
                                    onChange={(e) => {
                                        const updated = [...form.preAppointmentInfo];
                                        updated[i] = e.target.value;
                                        set('preAppointmentInfo')(updated);
                                    }}
                                    placeholder="e.g. Bring a leather jacket"
                                    className="flex-1 bg-transparent text-[14px] text-ink focus:outline-none placeholder:text-faded"
                                    style={{ fontFamily: 'inherit', border: 'none' }}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const updated = form.preAppointmentInfo.filter((_, idx) => idx !== i);
                                    set('preAppointmentInfo')(updated);
                                }}
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center focus:outline-none active:opacity-60"
                            >
                                <svg width="16" height="16" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={() => set('preAppointmentInfo')([...(form.preAppointmentInfo || []), ''])}
                        className="w-full py-3 rounded-[12px] text-[13px] font-semibold focus:outline-none active:opacity-60 mt-1"
                        style={{ border: '1.5px dashed rgba(140,106,100,0.4)', background: 'transparent', color: '#8C6A64' }}
                    >
                        + Add item
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

                {/* ─ Auto-accept toggle ─ */}
                <Section>
                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4">
                            <p className="text-[16px] font-semibold text-ink m-0">Instant booking</p>
                            <p className="text-[13px] text-muted m-0 mt-0.5">
                                {form.autoAccept
                                    ? 'Bookings are confirmed automatically'
                                    : 'You must approve each booking request'}
                            </p>
                        </div>
                        <Toggle
                            on={form.autoAccept}
                            onChange={() => set('autoAccept')(!form.autoAccept)}
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
                className="fixed bottom-0 left-0 right-0 py-3"
                style={{
                    background: '#FBF7F2',
                    borderTop: '1px solid rgba(140,106,100,0.15)',
                    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                }}
            >
                <div className="mx-auto px-5" style={{ maxWidth: 640 }}>
                <div className="flex gap-3 items-center">
                {/* Delete — left side, only for existing services */}
                {!isNew && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="py-3.5 px-6 rounded-[12px] text-[13px] font-semibold focus:outline-none active:opacity-70"
                        style={{ border: '1px solid rgba(176,64,64,0.3)', background: 'transparent', color: '#B04040', opacity: deleting ? 0.6 : 1 }}
                    >
                        {deleting ? 'Deleting…' : 'Delete Service'}
                    </button>
                )}
                {/* Spacer pushes Cancel + Save to the right */}
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={() => navigate('/provider/services')}
                    className="py-3.5 px-6 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="py-3.5 px-8 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
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
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ProviderServiceEditor;
