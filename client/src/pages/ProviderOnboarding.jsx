/**
 * ProviderOnboarding — v6 Warm Editorial
 * Route: /provider/onboarding
 *
 * 5 steps (+ welcome screen at step 0):
 *   0 — Welcome (hero card + step list + "Get Started")
 *   1 — Category (pills + "Other" custom input)
 *   2 — Profile (photo upload, business name, city, bio 160 chars)
 *   3 — Services (add/edit services inline)
 *   4 — Availability (7-day checklist + buffer + booking window)
 *   5 — Handle + Stripe (handle check + Stripe Connect + "Launch My Page")
 *
 * APIs:
 *   PATCH /api/provider/me           → save profile
 *   POST  /api/provider/services     → create service
 *   POST  /api/provider/weekly-hours → save availability
 *   GET   /api/provider/check-handle → { available }
 *   POST  /api/provider/connected-account   → { accountId }
 *   POST  /api/provider/onboarding-link     → { url }
 */
import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import BackBtn from '../components/ui/BackBtn';
import Divider from '../components/ui/Divider';
import { useCitySearch } from '../hooks/useCitySearch';
import { uploadProfilePhoto } from '../utils/photoUpload';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

const CATEGORIES = [
    'Barber & Haircuts','Hair Styling & Braiding','Nails & Manicure','Makeup & Aesthetics',
    'Lashes & Brows','Vocal Coaching','Music Lessons','Personal Training','Yoga & Pilates',
    'Wellness & Massage','Mental Health & Therapy','Nutrition & Dietetics','Life Coaching',
    'Tutoring & Education','Photography','Videography','Cleaning Services','Home Maintenance',
    'Auto Detailing','Pet Grooming & Care','Tattoo & Piercing','Tailoring & Alterations',
    'Event Planning','Other',
];

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const TIME_OPTIONS = [];
for (let h = 6; h <= 22; h++) {
    for (const m of [0, 30]) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hr = h % 12 || 12;
        TIME_OPTIONS.push(`${hr}:${String(m).padStart(2,'0')} ${ampm}`);
    }
}

const BUFFER_OPTIONS = ['None','10 min','15 min','30 min'];
const BUFFER_VALUES  = [0, 10, 15, 30];

const WINDOW_OPTIONS = ['1 week','2 weeks','4 weeks','8 weeks','Custom'];
const WINDOW_VALUES  = [7, 14, 28, 56, null];

const TOTAL_STEPS = 3; // steps 1-3 (step 0 is welcome)

// ─── Shared components ────────────────────────────────────────────────────────

const inputStyle = {
    background: '#F2EBE5',
    border: '1px solid rgba(140,106,100,0.2)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const Lbl = ({ children, className = '' }) => (
    <span className={`text-[11px] font-medium uppercase tracking-[0.05em] text-muted block ${className}`}>
        {children}
    </span>
);

const Field = ({ label, children }) => (
    <div className="mb-5">
        <Lbl className="mb-2">{label}</Lbl>
        {children}
    </div>
);

const TextInput = ({ value, onChange, placeholder, type = 'text', maxLength, style = {} }) => (
    <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-4 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none"
        style={{ ...inputStyle, ...style }}
    />
);

const ContinueBtn = ({ onClick, disabled, loading, label = 'Continue' }) => (
    <button
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
        style={{ background: disabled || loading ? '#B0948F' : '#3D231E', border: 'none' }}
    >
        {loading && (
            <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', animation:'spin 0.8s linear infinite', flexShrink:0 }} />
        )}
        {label}
    </button>
);

// ─── Step progress bar ────────────────────────────────────────────────────────

const StepBar = ({ current }) => (
    <div className="flex gap-1 px-6 mb-6">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
                key={i}
                className="flex-1 rounded-full"
                style={{ height: 3, background: i < current ? '#C25E4A' : '#F2EBE5' }}
            />
        ))}
    </div>
);

// ─── Error block ──────────────────────────────────────────────────────────────

const Err = ({ msg }) => msg ? (
    <div className="px-4 py-3 rounded-[10px] text-[13px] mb-4" style={{ background: '#FDEDEA', color: '#B04040' }}>
        {msg}
    </div>
) : null;

// ─── Step shell ──────────────────────────────────────────────────────────────

const StepShell = ({ step, onBack, children }) => (
    <div className="flex flex-col" style={{ minHeight: '100dvh', background: '#FBF7F2' }}>
        <div className="px-5 pt-12 pb-2">
            <BackBtn onClick={onBack} />
        </div>
        <StepBar current={step} />
        <div className="flex-1 flex flex-col px-6 pb-8">
            {children}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

const StepHeader = ({ step, total, title, sub }) => (
    <>
        <Lbl className="mb-1.5">Step {step} of {total}</Lbl>
        <h1 className="font-semibold text-ink tracking-[-0.03em] mb-2" style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 8px' }}>
            {title}
        </h1>
        <p className="text-[15px] text-muted leading-relaxed mb-7">{sub}</p>
    </>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 0: Welcome
// ═══════════════════════════════════════════════════════════════════════════════

const STEP_LIST = ['Category','Profile & Photo','Handle & Payouts'];

const WelcomeStep = ({ onNext }) => (
    <div className="flex flex-col" style={{ minHeight: '100dvh', background: '#FBF7F2' }}>
        <div className="m-4">
            <div
                className="relative overflow-hidden flex flex-col justify-end p-7"
                style={{ background: '#FDDCC6', borderRadius: 28, minHeight: 300 }}
            >
                <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: TOPO_SVG, backgroundSize: 'cover', opacity: 0.12 }} />
                <div className="relative z-10">
                    <span className="block font-semibold mb-4 tracking-[-0.01em]" style={{ fontSize: 13, color: '#C25E4A' }}>
                        Kliques for Providers
                    </span>
                    <h1 className="font-semibold text-ink tracking-[-0.03em] mb-2" style={{ fontSize: 32, lineHeight: 1.15, margin: '0 0 10px' }}>
                        Build your<br />practice here.
                    </h1>
                    <p className="text-[15px] text-muted leading-relaxed m-0">
                        Set up your profile, availability, and start getting booked in minutes.
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col px-6 pt-2 pb-8">
            {STEP_LIST.map((s, i) => (
                <div key={s}>
                    <div className="flex items-center gap-3.5 py-3.5">
                        <div
                            className="flex items-center justify-center rounded-full flex-shrink-0 text-[12px] font-medium text-muted"
                            style={{ width: 28, height: 28, background: '#F2EBE5' }}
                        >
                            {i + 1}
                        </div>
                        <p className="text-[15px] text-ink m-0">{s}</p>
                    </div>
                    {i < STEP_LIST.length - 1 && <Divider />}
                </div>
            ))}
            <div className="mt-auto pt-5">
                <button onClick={onNext} className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none" style={{ background: '#3D231E', border: 'none' }}>
                    Get Started
                </button>
            </div>
        </div>
    </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1: Category
// ═══════════════════════════════════════════════════════════════════════════════

const CategoryStep = ({ category, customCat, onCategory, onCustom, onNext, onBack, error }) => {
    const canContinue = category && (category !== 'Other' || customCat.trim().length > 0);
    return (
        <StepShell step={1} onBack={onBack}>
            <StepHeader step={1} total={5} title="What do you do?" sub="Pick the category that best describes your work." />
            <div className="flex flex-wrap gap-2 mb-4">
                {CATEGORIES.map((c) => {
                    const active = category === c;
                    return (
                        <button
                            key={c}
                            onClick={() => { onCategory(c); if (c !== 'Other') onCustom(''); }}
                            className="px-4 py-2.5 rounded-full text-[13px] focus:outline-none"
                            style={{
                                border: active ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                background: active ? '#FDDCC6' : 'transparent',
                                fontWeight: active ? 500 : 400,
                                color: active ? '#C25E4A' : '#3D231E',
                            }}
                        >
                            {c}
                        </button>
                    );
                })}
            </div>

            {category === 'Other' && (
                <div className="mb-4">
                    <Lbl className="mb-2">Tell us what you do</Lbl>
                    <TextInput
                        value={customCat}
                        onChange={onCustom}
                        placeholder="e.g., Dog Training, Interior Design, DJ Services…"
                        style={{ ...inputStyle, border: `1px solid ${customCat.length > 0 ? '#C25E4A' : 'rgba(140,106,100,0.2)'}` }}
                    />
                    <p className="text-[12px] text-faded mt-1.5">We'll create a custom category for you.</p>
                </div>
            )}

            <Err msg={error} />
            <div className="mt-auto pt-4">
                <ContinueBtn onClick={onNext} disabled={!canContinue} />
            </div>
        </StepShell>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2: Profile
// ═══════════════════════════════════════════════════════════════════════════════

const ProfileStep = ({ profile, onChange, onNext, onBack, saving, error }) => {
    const fileRef = useRef(null);
    const [showCitySuggestions, setShowCitySuggestions] = useState(false);
    const { suggestions: citySuggestions, loading: cityLoading } = useCitySearch(profile.city);

    return (
        <StepShell step={2} onBack={onBack}>
            <StepHeader step={2} total={5} title="Your profile." sub="This is what clients see when they find you." />

            {/* Photo upload */}
            <div className="flex flex-col items-center mb-7">
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center justify-center rounded-full focus:outline-none"
                    style={{ width: 88, height: 88, background: '#F2EBE5', border: '2px dashed rgba(140,106,100,0.3)' }}
                >
                    {profile.photoPreview ? (
                        <img src={profile.photoPreview} alt="preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <svg width="28" height="28" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="text-[12px] font-medium mt-2 focus:outline-none"
                    style={{ color: '#C25E4A', background: 'none', border: 'none' }}
                >
                    {profile.photoPreview ? 'Change photo' : 'Upload photo'}
                </button>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onChange('photoFile', file, URL.createObjectURL(file));
                    }}
                />
            </div>

            <Field label="Business / Display Name">
                <TextInput value={profile.businessName} onChange={(v) => onChange('businessName', v)} placeholder="e.g., Anny Wong Vocal Studio" />
            </Field>

            {/* City with autocomplete */}
            <div className="mb-5 relative">
                <Lbl className="mb-2">City</Lbl>
                <div className="relative">
                    <input
                        type="text"
                        value={profile.city}
                        onChange={(e) => { onChange('city', e.target.value); setShowCitySuggestions(true); }}
                        onFocus={() => profile.city.length > 0 && setShowCitySuggestions(true)}
                        onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
                        placeholder="Start typing your city…"
                        autoComplete="off"
                        className="w-full px-4 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none"
                        style={{ ...inputStyle, border: `1px solid ${showCitySuggestions && citySuggestions.length > 0 ? '#C25E4A' : 'rgba(140,106,100,0.2)'}` }}
                    />
                </div>
                {showCitySuggestions && profile.city.trim().length >= 2 && (cityLoading || citySuggestions.length > 0) && (
                    <div className="absolute left-0 right-0 mt-1 z-10 overflow-hidden"
                        style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', boxShadow: '0 8px 24px rgba(61,35,30,0.08)', maxHeight: 220, overflowY: 'auto' }}>
                        {cityLoading ? (
                            <div className="flex items-center gap-2 px-4 py-3.5 text-[13px]" style={{ color: '#8C6A64' }}>
                                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(140,106,100,0.2)', borderTop: '2px solid #C25E4A', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                Searching…
                            </div>
                        ) : citySuggestions.map((c) => (
                            <button key={c} type="button"
                                onMouseDown={() => { onChange('city', c); setShowCitySuggestions(false); }}
                                className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left focus:outline-none text-[14px] text-ink"
                                style={{ background: 'none', border: 'none', borderBottom: '1px solid rgba(140,106,100,0.1)', fontFamily: 'inherit' }}>
                                <svg width="14" height="14" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                {c}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Bio */}
            <div className="mb-5">
                <Lbl className="mb-2">Short Bio</Lbl>
                <textarea
                    value={profile.bio}
                    onChange={(e) => onChange('bio', e.target.value)}
                    placeholder="Tell clients what you do and what makes your approach unique…"
                    rows={3}
                    maxLength={160}
                    className="w-full px-4 py-3.5 rounded-[12px] text-[13px] text-ink focus:outline-none resize-none"
                    style={{ ...inputStyle }}
                />
                <p className="text-[11px] text-faded mt-1 text-right">{profile.bio.length} / 160</p>
            </div>

            <Err msg={error} />
            <div className="mt-auto pt-2">
                <ContinueBtn onClick={onNext} loading={saving} />
            </div>
        </StepShell>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3: Services
// ═══════════════════════════════════════════════════════════════════════════════

const DURATION_OPTIONS = ['15 min','30 min','45 min','60 min','90 min','120 min'];

const ServiceForm = ({ service, onChange, onSave, onCancel }) => (
    <div className="mb-4 p-4 rounded-[14px]" style={{ background: '#F2EBE5' }}>
        <Field label="Service Name">
            <TextInput value={service.name} onChange={(v) => onChange('name', v)} placeholder="e.g., 1-on-1 Vocal Lesson" />
        </Field>
        <div className="flex gap-3 mb-5">
            <div className="flex-1">
                <Lbl className="mb-2">Duration</Lbl>
                <select
                    value={service.duration}
                    onChange={(e) => onChange('duration', e.target.value)}
                    className="w-full px-3 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none appearance-none"
                    style={{ ...inputStyle }}
                >
                    {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="flex-1">
                <Lbl className="mb-2">Price ($)</Lbl>
                <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-muted">$</span>
                    <input
                        type="number"
                        value={service.price}
                        onChange={(e) => onChange('price', e.target.value)}
                        placeholder="85"
                        className="w-full pl-7 pr-4 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none"
                        style={{ ...inputStyle }}
                    />
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 rounded-[10px] text-[13px] font-medium text-muted focus:outline-none" style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent' }}>
                Cancel
            </button>
            <button
                onClick={onSave}
                disabled={!service.name.trim() || !service.price}
                className="flex-1 py-3 rounded-[10px] text-[13px] font-semibold text-white focus:outline-none"
                style={{ background: !service.name.trim() || !service.price ? '#B0948F' : '#3D231E', border: 'none' }}
            >
                Save Service
            </button>
        </div>
    </div>
);

const ServicesStep = ({ services, onAdd, onEdit, onNext, onBack, error }) => {
    const [showForm, setShowForm] = useState(services.length === 0);
    const [editingIdx, setEditingIdx] = useState(null);
    const [draft, setDraft] = useState({ name: '', duration: '60 min', price: '' });

    const handleDraftChange = (field, val) => setDraft((p) => ({ ...p, [field]: val }));

    const handleSave = () => {
        if (!draft.name.trim() || !draft.price) return;
        if (editingIdx !== null) {
            onEdit(editingIdx, { ...draft });
            setEditingIdx(null);
        } else {
            onAdd({ ...draft });
        }
        setDraft({ name: '', duration: '60 min', price: '' });
        setShowForm(false);
    };

    const handleStartEdit = (i) => {
        setDraft({ ...services[i] });
        setEditingIdx(i);
        setShowForm(true);
    };

    return (
        <StepShell step={3} onBack={onBack}>
            <StepHeader step={3} total={5} title="Your services." sub="Add at least one service. You can always add more later." />

            <Divider />
            {services.map((s, i) => (
                editingIdx === i && showForm ? null : (
                    <div key={i}>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <p className="text-[15px] text-ink m-0 mb-0.5">{s.name}</p>
                                <p className="text-[13px] text-muted m-0">{s.duration} · ${s.price}</p>
                            </div>
                            <button onClick={() => handleStartEdit(i)} className="p-1 focus:outline-none" style={{ background: 'none', border: 'none' }}>
                                <svg width="16" height="16" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                        <Divider />
                    </div>
                )
            ))}

            {showForm ? (
                <ServiceForm
                    service={draft}
                    onChange={handleDraftChange}
                    onSave={handleSave}
                    onCancel={() => { setShowForm(false); setEditingIdx(null); setDraft({ name: '', duration: '60 min', price: '' }); }}
                />
            ) : (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-4 rounded-[14px] my-4 focus:outline-none"
                    style={{ border: '1px dashed rgba(140,106,100,0.3)', background: 'transparent' }}
                >
                    <svg width="14" height="14" fill="none" stroke="#C25E4A" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    <span className="text-[13px] font-medium" style={{ color: '#C25E4A' }}>Add Service</span>
                </button>
            )}

            <Err msg={error} />
            <div className="mt-auto pt-2">
                <ContinueBtn onClick={onNext} disabled={services.length === 0} label="Continue" />
            </div>
        </StepShell>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 4: Availability
// ═══════════════════════════════════════════════════════════════════════════════

const TimeSelect = ({ value, onChange }) => (
    <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-[10px] text-[13px] text-ink focus:outline-none appearance-none"
        style={{ background: '#F2EBE5', border: '1px solid rgba(140,106,100,0.2)', fontFamily: 'inherit', minWidth: 100 }}
    >
        {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
);

const AvailabilityStep = ({ avail, onToggle, onTime, buffer, onBuffer, window: windowIdx, onWindow, customDays, onCustomDays, onNext, onBack, error }) => (
    <StepShell step={3} onBack={onBack}>
        <StepHeader step={3} total={4} title="Availability." sub="Set your weekly schedule. You can always adjust this later." />

        <Divider />
        {DAYS.map((d, i) => {
            const day = avail[i];
            return (
                <div key={d}>
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3.5">
                            <button
                                onClick={() => onToggle(i)}
                                className="flex items-center justify-center rounded-[6px] focus:outline-none flex-shrink-0"
                                style={{ width: 22, height: 22, border: day.enabled ? 'none' : '1.5px solid rgba(140,106,100,0.3)', background: day.enabled ? '#C25E4A' : 'transparent' }}
                            >
                                {day.enabled && (
                                    <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </button>
                            <span className="text-[15px]" style={{ color: day.enabled ? '#3D231E' : '#B0948F' }}>{d}</span>
                        </div>
                        {day.enabled ? (
                            <div className="flex items-center gap-2">
                                <TimeSelect value={day.from} onChange={(v) => onTime(i, 'from', v)} />
                                <span className="text-[13px] text-faded">–</span>
                                <TimeSelect value={day.to} onChange={(v) => onTime(i, 'to', v)} />
                            </div>
                        ) : (
                            <span className="text-[13px] text-faded">Off</span>
                        )}
                    </div>
                    <Divider />
                </div>
            );
        })}

        {/* Buffer */}
        <Lbl className="mt-5 mb-3">Buffer Between Sessions</Lbl>
        <div className="flex gap-2 mb-5">
            {BUFFER_OPTIONS.map((b, i) => (
                <button
                    key={b}
                    onClick={() => onBuffer(i)}
                    className="flex-1 py-2.5 rounded-[10px] text-[12px] focus:outline-none"
                    style={{
                        border: buffer === i ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                        background: buffer === i ? '#FDDCC6' : 'transparent',
                        fontWeight: buffer === i ? 500 : 400,
                        color: buffer === i ? '#C25E4A' : '#3D231E',
                    }}
                >
                    {b}
                </button>
            ))}
        </div>

        {/* Booking window */}
        <Lbl className="mb-3">Booking Window</Lbl>
        <div className="flex flex-wrap gap-2 mb-2">
            {WINDOW_OPTIONS.map((w, i) => (
                <button
                    key={w}
                    onClick={() => onWindow(i)}
                    className="px-3.5 py-2 rounded-full text-[12px] focus:outline-none"
                    style={{
                        border: windowIdx === i ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                        background: windowIdx === i ? '#FDDCC6' : 'transparent',
                        fontWeight: windowIdx === i ? 500 : 400,
                        color: windowIdx === i ? '#C25E4A' : '#3D231E',
                    }}
                >
                    {w}
                </button>
            ))}
        </div>
        {windowIdx === 4 && (
            <div className="flex items-center gap-2 mt-2 mb-2">
                <input
                    type="number"
                    value={customDays}
                    onChange={(e) => onCustomDays(e.target.value)}
                    placeholder="30"
                    className="w-20 px-3 py-2.5 rounded-[10px] text-[14px] text-ink focus:outline-none"
                    style={{ ...inputStyle }}
                />
                <span className="text-[13px] text-muted">days in advance</span>
            </div>
        )}

        <Err msg={error} />
        <div className="mt-auto pt-5">
            <ContinueBtn onClick={onNext} />
        </div>
    </StepShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 5: Handle + Stripe
// ═══════════════════════════════════════════════════════════════════════════════

const HandleStep = ({ handle, onHandle, handleStatus, stripeConnected, onStripe, stripeLoading, onLaunch, launching, onBack, error }) => (
    <StepShell step={3} onBack={onBack}>
        <StepHeader step={3} total={3} title="Almost there." sub="Choose your public handle now. Stripe can be connected later before you accept paid bookings." />

        {/* Handle */}
        <Lbl className="mb-2">Your Handle</Lbl>
        <TextInput
            value={handle}
            onChange={onHandle}
            placeholder="yourname"
            style={{ ...inputStyle, border: `1px solid ${handleStatus === 'available' ? '#5A8A5E' : handleStatus === 'taken' ? '#B04040' : 'rgba(140,106,100,0.2)'}` }}
        />
        {/* Handle status */}
        <div className="flex items-center gap-1.5 mt-1.5 mb-6" style={{ minHeight: 20 }}>
            {handleStatus === 'available' && (
                <>
                    <svg width="14" height="14" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[13px] m-0" style={{ color: '#5A8A5E' }}>
                        mykliques.com/book/{handle} is available
                    </p>
                </>
            )}
            {handleStatus === 'taken' && (
                <>
                    <svg width="14" height="14" fill="none" stroke="#B04040" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                    </svg>
                    <p className="text-[13px] m-0" style={{ color: '#B04040' }}>This handle is already taken</p>
                </>
            )}
            {handleStatus === 'checking' && (
                <p className="text-[13px] text-faded m-0">Checking availability…</p>
            )}
            {handleStatus === 'invalid' && (
                <p className="text-[13px] m-0" style={{ color: '#B04040' }}>Lowercase letters, numbers, and hyphens only</p>
            )}
        </div>

        <Divider />

        {/* Stripe Connect */}
        <div className="py-5">
            <Lbl className="mb-2">Connect Payouts</Lbl>
            <p className="text-[14px] text-muted leading-relaxed mb-4">
                Connect your Stripe account to receive payments from clients securely when you're ready.
            </p>
            {stripeConnected ? (
                <div className="flex items-center gap-2 px-4 py-3.5 rounded-[12px]" style={{ background: '#EBF2EC' }}>
                    <svg width="16" height="16" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[14px] font-medium" style={{ color: '#3D6B41' }}>Stripe connected</span>
                </div>
            ) : (
                <button
                    onClick={onStripe}
                    disabled={stripeLoading}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-[12px] text-[14px] font-medium text-ink focus:outline-none"
                    style={{ border: '1px solid rgba(140,106,100,0.2)', background: stripeLoading ? '#F2EBE5' : '#FFFFFF' }}
                >
                    {stripeLoading ? (
                        <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(140,106,100,0.3)', borderTop:'2px solid #8C6A64', animation:'spin 0.8s linear infinite' }} />
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF"/>
                        </svg>
                    )}
                    Connect Stripe
                </button>
            )}
            {!stripeConnected && (
                <p className="text-[12px] text-faded mt-3 mb-0">
                    Optional for now. You can finish payout setup later in Profile → Payouts &amp; Billing.
                </p>
            )}
        </div>

        <Err msg={error} />
        <div className="mt-auto pt-2">
            <ContinueBtn onClick={onLaunch} loading={launching} disabled={handleStatus !== 'available'} label="Launch My Page" />
            <p className="text-[12px] text-faded text-center mt-3">You can always update everything from your profile later.</p>
        </div>
    </StepShell>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE — orchestrates all steps
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_AVAIL = DAYS.map((_, i) => ({
    enabled: i < 5, // Mon-Fri on by default
    from: '9:00 AM',
    to: '5:00 PM',
}));

export default function ProviderOnboarding() {
    const navigate = useNavigate();
    const { session, updateProfile } = useSession();

    const [step, setStep] = useState(0);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);

    // Step 1 — category
    const [category, setCategory] = useState(null);
    const [customCat, setCustomCat] = useState('');

    // Step 2 — profile
    const [profile, setProfile] = useState({ businessName: '', city: '', bio: '', photoFile: null, photoPreview: null });

    // Step 3 — services
    const [services, setServices] = useState([]);

    // Step 4 — availability
    const [avail, setAvail] = useState(DEFAULT_AVAIL);
    const [bufferIdx, setBufferIdx] = useState(0);
    const [windowIdx, setWindowIdx] = useState(2); // 4 weeks default
    const [customDays, setCustomDays] = useState('30');

    // Step 5 — handle + stripe
    const [handle, setHandle] = useState('');
    const [handleStatus, setHandleStatus] = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
    const [stripeConnected, setStripeConnected] = useState(false);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [launching, setLaunching] = useState(false);

    const handleCheckTimer = useRef(null);

    const go = (n) => { setError(null); setStep(n); };

    // ── Step 1: category ──────────────────────────────────────────────────────
    const submitCategory = () => {
        if (!category) { setError('Please pick a category.'); return; }
        if (category === 'Other' && !customCat.trim()) { setError('Please describe what you do.'); return; }
        go(2);
    };

    // ── Step 2: profile ───────────────────────────────────────────────────────
    const changeProfile = (field, value, extra) => {
        if (field === 'photoFile') {
            setProfile((p) => ({ ...p, photoFile: value, photoPreview: extra }));
        } else {
            setProfile((p) => ({ ...p, [field]: value }));
        }
    };

    const submitProfile = async () => {
        if (!profile.businessName.trim()) { setError('Please enter your business name.'); return; }
        if (!profile.city.trim()) { setError('Please enter your city.'); return; }
        setSaving(true);
        try {
            const cat = category === 'Other' ? customCat.trim() : category;
            const uploadedPhotoUrl = profile.photoFile
                ? await uploadProfilePhoto(profile.photoFile, session?.user?.id)
                : null;

            const patchBody = {
                business_name: profile.businessName.trim(),
                city: profile.city.trim(),
                bio: profile.bio.trim(),
                category: cat,
            };
            if (uploadedPhotoUrl) {
                patchBody.photo = uploadedPhotoUrl;
                patchBody.avatar = uploadedPhotoUrl;
            }

            await request('/provider/me', {
                method: 'PATCH',
                body: JSON.stringify(patchBody),
            });

            const profileUpdate = {
                name: profile.businessName.trim(),
                city: profile.city.trim(),
                bio: profile.bio.trim(),
            };
            if (uploadedPhotoUrl) {
                profileUpdate.photo = uploadedPhotoUrl;
                profileUpdate.avatar = uploadedPhotoUrl;
            }
            await updateProfile(profileUpdate);
            // Auto-suggest handle from business name
            const suggested = profile.businessName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
            if (suggested) { setHandle(suggested); triggerHandleCheck(suggested); }
            go(3);
        } catch (err) {
            setError(err.message || 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    // ── Step 3: services ──────────────────────────────────────────────────────
    const addService = (svc) => setServices((prev) => [...prev, svc]);
    const editService = (i, svc) => setServices((prev) => prev.map((s, idx) => idx === i ? svc : s));

    const submitServices = async () => {
        if (services.length === 0) { setError('Add at least one service.'); return; }
        setSaving(true);
        try {
            for (const svc of services) {
                await request('/provider/services', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: svc.name,
                        duration_minutes: parseInt(svc.duration),
                        price: parseFloat(svc.price) * 100,
                        category: category === 'Other' ? customCat.trim() : category,
                    }),
                }).catch(() => {}); // best-effort
            }
            go(4);
        } catch (err) {
            setError(err.message || 'Failed to save services.');
        } finally {
            setSaving(false);
        }
    };

    // ── Step 4: availability ──────────────────────────────────────────────────
    const toggleDay = (i) => setAvail((prev) => prev.map((d, idx) => idx === i ? { ...d, enabled: !d.enabled } : d));
    const setTime = (i, field, val) => setAvail((prev) => prev.map((d, idx) => idx === i ? { ...d, [field]: val } : d));

    const submitAvailability = async () => {
        setSaving(true);
        try {
            const hours = avail.map((d, i) => ({
                dayIndex: i,
                startTime: d.from,
                endTime: d.to,
                isAvailable: d.enabled,
            }));
            const bookingWindowDays = windowIdx === 4 ? parseInt(customDays) || 30 : WINDOW_VALUES[windowIdx];
            await request('/provider/weekly-hours', {
                method: 'POST',
                body: JSON.stringify({ hours, bufferMinutes: BUFFER_VALUES[bufferIdx], bookingWindowDays }),
            });
            go(4);
        } catch (err) {
            setError(err.message || 'Failed to save availability.');
        } finally {
            setSaving(false);
        }
    };

    // ── Step 5: handle ────────────────────────────────────────────────────────
    const triggerHandleCheck = useCallback((val) => {
        clearTimeout(handleCheckTimer.current);
        if (!val) { setHandleStatus(null); return; }
        if (!/^[a-z0-9-]+$/.test(val)) { setHandleStatus('invalid'); return; }
        setHandleStatus('checking');
        handleCheckTimer.current = setTimeout(async () => {
            try {
                const data = await request(`/provider/check-handle?handle=${encodeURIComponent(val)}`);
                setHandleStatus(data.available ? 'available' : 'taken');
            } catch {
                setHandleStatus(null);
            }
        }, 500);
    }, []);

    const onHandleChange = (val) => {
        const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setHandle(clean);
        triggerHandleCheck(clean);
    };

    const connectStripe = async () => {
        setStripeLoading(true);
        try {
            const userId = session?.user?.id;
            const email = session?.user?.email;
            const { accountId } = await request('/provider/connected-account', {
                method: 'POST',
                body: JSON.stringify({ userId, email, businessName: profile.businessName }),
            });
            const { url } = await request('/provider/onboarding-link', {
                method: 'POST',
                body: JSON.stringify({
                    accountId,
                    refreshUrl: `${window.location.origin}/provider/onboarding`,
                    returnUrl: `${window.location.origin}/provider/onboarding?stripe=done`,
                }),
            });
            window.location.href = url;
        } catch (err) {
            setError(err.message || 'Failed to start Stripe setup.');
            setStripeLoading(false);
        }
    };

    // Check if returning from Stripe
    const stripeParam = new URLSearchParams(window.location.search).get('stripe');
    if (stripeParam === 'done' && !stripeConnected) {
        setStripeConnected(true);
        setStep(5);
    }

    const launchPage = async () => {
        if (handleStatus !== 'available') return;
        setLaunching(true);
        try {
            await request('/provider/me', {
                method: 'PATCH',
                body: JSON.stringify({ handle }),
            });
            await updateProfile({ isProfileComplete: true });
            navigate('/provider', { replace: true });
        } catch (err) {
            setError(err.message || 'Failed to launch page.');
        } finally {
            setLaunching(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (step === 0) return <WelcomeStep onNext={() => go(1)} />;
    if (step === 1) return <CategoryStep category={category} customCat={customCat} onCategory={setCategory} onCustom={setCustomCat} onNext={submitCategory} onBack={() => navigate(-1)} error={error} />;
    if (step === 2) return <ProfileStep profile={profile} onChange={changeProfile} onNext={submitProfile} onBack={() => go(1)} saving={saving} error={error} />;
    return <HandleStep handle={handle} onHandle={onHandleChange} handleStatus={handleStatus} stripeConnected={stripeConnected} onStripe={connectStripe} stripeLoading={stripeLoading} onLaunch={launchPage} launching={launching} onBack={() => go(2)} error={error} />;
}
