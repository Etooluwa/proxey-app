/**
 * ClientOnboarding — v6 Warm Editorial
 * Route: /onboarding
 *
 * 3 steps:
 *   0 — Welcome (hero card + 3 preview rows + "Let's Go")
 *   1 — About You (name, email, phone, city autocomplete)
 *   2 — All Set (check icon + "Go to My Kliques")
 *
 * API: PUT /api/client/profile → { name, email, phone, city, is_profile_complete }
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { useCitySearch } from '../hooks/useCitySearch';
import BackBtn from '../components/ui/BackBtn';
import Divider from '../components/ui/Divider';
import PhoneInput from '../components/ui/PhoneInput';

// ─── Topographic SVG (same as LoginPage) ─────────────────────────────────────

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Shared field ─────────────────────────────────────────────────────────────

const Field = ({ label, value, onChange, type = 'text', placeholder, autoComplete }) => (
    <div className="mb-5">
        <span className="block mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
            {label}
        </span>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={autoComplete || 'off'}
            className="w-full px-4 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none"
            style={{
                background: '#F2EBE5',
                border: '1px solid rgba(140,106,100,0.2)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
            }}
        />
    </div>
);

// ─── Step 0: Welcome ──────────────────────────────────────────────────────────

const PREVIEW_ROWS = [
    {
        icon: (
            <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'Takes under 30 seconds',
        desc: 'Just your name, email, and phone number',
    },
    {
        icon: (
            <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'Connect with providers',
        desc: 'Book sessions, track your history, message directly',
    },
    {
        icon: (
            <svg width="16" height="16" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        title: 'No password needed',
        desc: "We'll send you a magic link to sign in",
    },
];

const WelcomeStep = ({ onNext }) => (
    <div className="flex flex-col" style={{ minHeight: '100dvh', background: '#FBF7F2' }}>
        {/* Hero card with topo texture */}
        <div className="m-4">
            <div
                className="relative overflow-hidden flex flex-col justify-end p-7"
                style={{
                    background: '#FDDCC6',
                    borderRadius: 28,
                    minHeight: 300,
                }}
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: TOPO_SVG, backgroundSize: 'cover', opacity: 0.12 }}
                />
                <div className="relative z-10">
                    <span
                        className="block font-semibold mb-4 tracking-[-0.01em]"
                        style={{ fontSize: 13, color: '#C25E4A' }}
                    >
                        Kliques
                    </span>
                    <h1
                        className="font-semibold text-ink tracking-[-0.03em] mb-2"
                        style={{ fontSize: 32, lineHeight: 1.15, margin: '0 0 10px' }}
                    >
                        Welcome to<br />your journey.
                    </h1>
                    <p className="text-[15px] text-muted leading-relaxed m-0">
                        We just need a few details to get you started.
                    </p>
                </div>
            </div>
        </div>

        {/* Preview rows */}
        <div className="flex-1 flex flex-col px-6 pt-2 pb-8">
            {PREVIEW_ROWS.map((row, i) => (
                <div key={row.title}>
                    <div className="flex gap-3.5 py-4 items-start">
                        <div
                            className="flex items-center justify-center rounded-[10px] flex-shrink-0"
                            style={{ width: 36, height: 36, background: '#FDDCC6' }}
                        >
                            {row.icon}
                        </div>
                        <div>
                            <p className="text-[15px] font-medium text-ink m-0 mb-0.5">{row.title}</p>
                            <p className="text-[13px] text-muted m-0">{row.desc}</p>
                        </div>
                    </div>
                    {i < PREVIEW_ROWS.length - 1 && <Divider />}
                </div>
            ))}

            <div className="mt-auto pt-5">
                <button
                    onClick={onNext}
                    className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none"
                    style={{ background: '#3D231E', border: 'none' }}
                >
                    Let's Go
                </button>
            </div>
        </div>
    </div>
);

// ─── Step 1: About You ────────────────────────────────────────────────────────

const AboutYouStep = ({ form, onChange, onNext, onBack, saving, error }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { suggestions, loading: cityLoading } = useCitySearch(form.city);
    const cityBorderActive = showSuggestions && (suggestions.length > 0 || cityLoading);

    return (
        <div className="flex flex-col" style={{ minHeight: '100dvh', background: '#FBF7F2' }}>
            <div className="px-5 pt-12 pb-2">
                <BackBtn onClick={onBack} />
            </div>

            <div className="flex-1 flex flex-col px-6 pb-8">
                <h1
                    className="font-semibold text-ink tracking-[-0.03em] mb-2"
                    style={{ fontSize: 28, lineHeight: 1.15, margin: '0 0 8px' }}
                >
                    About you.
                </h1>
                <p className="text-[15px] text-muted leading-relaxed mb-8">
                    This is how providers will know you.
                </p>

                <Field
                    label="Full Name"
                    value={form.name}
                    onChange={(v) => onChange('name', v)}
                    placeholder="Your name"
                    autoComplete="name"
                />
                <Field
                    label="Email"
                    value={form.email}
                    onChange={(v) => onChange('email', v)}
                    type="email"
                    placeholder="you@email.com"
                    autoComplete="email"
                />
                <div className="mb-5">
                    <span className="block mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                        Phone Number
                    </span>
                    <PhoneInput
                        value={form.phone}
                        onChange={(v) => onChange('phone', v)}
                    />
                </div>

                {/* City with autocomplete dropdown */}
                <div className="mb-5 relative">
                    <span className="block mb-2 text-[11px] font-medium uppercase tracking-[0.05em] text-muted">
                        City
                    </span>
                    <div className="relative">
                        <input
                            type="text"
                            value={form.city}
                            onChange={(e) => { onChange('city', e.target.value); setShowSuggestions(true); }}
                            onFocus={() => form.city.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                            placeholder="Start typing your city…"
                            autoComplete="off"
                            className="w-full px-4 py-3.5 rounded-[12px] text-[14px] text-ink focus:outline-none pr-10"
                            style={{
                                background: '#F2EBE5',
                                border: `1px solid ${cityBorderActive ? '#C25E4A' : 'rgba(140,106,100,0.2)'}`,
                                fontFamily: 'inherit',
                                boxSizing: 'border-box',
                            }}
                        />
                        {form.city.length > 0 && (
                            <button
                                type="button"
                                onClick={() => { onChange('city', ''); setShowSuggestions(false); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex focus:outline-none"
                                style={{ background: 'none', border: 'none', padding: 4 }}
                            >
                                <svg width="16" height="16" fill="none" stroke="#B0948F" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Suggestions dropdown */}
                    {showSuggestions && form.city.trim().length >= 2 && (cityLoading || suggestions.length > 0) && (
                        <div
                            className="absolute left-0 right-0 mt-1 overflow-hidden z-10"
                            style={{
                                background: '#FFFFFF',
                                borderRadius: 12,
                                border: '1px solid rgba(140,106,100,0.2)',
                                boxShadow: '0 8px 24px rgba(61,35,30,0.08)',
                                maxHeight: 220,
                                overflowY: 'auto',
                            }}
                        >
                            {cityLoading ? (
                                <div className="flex items-center gap-2 px-4 py-3.5 text-[13px]" style={{ color: '#8C6A64' }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid rgba(140,106,100,0.2)', borderTop: '2px solid #C25E4A', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                    Searching…
                                </div>
                            ) : suggestions.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onMouseDown={() => { onChange('city', c); setShowSuggestions(false); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left focus:outline-none"
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: '1px solid rgba(140,106,100,0.1)',
                                        fontFamily: 'inherit',
                                    }}
                                >
                                    <svg width="14" height="14" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-[14px] text-ink">{c}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div
                        className="px-4 py-3 rounded-[10px] text-[13px] mb-4"
                        style={{ background: '#FDEDEA', color: '#B04040' }}
                    >
                        {error}
                    </div>
                )}

                <div className="mt-auto pt-4">
                    <button
                        onClick={onNext}
                        disabled={saving}
                        className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
                        style={{ background: '#3D231E', border: 'none', opacity: saving ? 0.7 : 1 }}
                    >
                        {saving && (
                            <div style={{
                                width: 14, height: 14, borderRadius: '50%',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid #fff',
                                animation: 'spin 0.8s linear infinite',
                                flexShrink: 0,
                            }} />
                        )}
                        {saving ? 'Saving…' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Step 2: All Set ──────────────────────────────────────────────────────────

const AllSetStep = ({ onFinish }) => (
    <div
        className="flex flex-col items-center justify-center px-6 text-center"
        style={{ minHeight: '100dvh', background: '#FBF7F2' }}
    >
        {/* Icon with topo texture */}
        <div
            className="relative flex items-center justify-center mb-6"
            style={{ width: 80, height: 80, borderRadius: 24, background: '#FDDCC6' }}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none"
                style={{
                    borderRadius: 24,
                    backgroundImage: TOPO_SVG,
                    backgroundSize: 'cover',
                    opacity: 0.10,
                }}
            />
            <svg
                width="36" height="36" fill="none"
                stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24"
                className="relative z-10"
            >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>

        <h1
            className="font-semibold text-ink tracking-[-0.03em] mb-2"
            style={{ fontSize: 28, lineHeight: 1.15 }}
        >
            You're all set.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed mb-8 max-w-[300px]">
            Your account is ready. Start exploring providers or accept an invite to build your first connection.
        </p>

        <button
            onClick={onFinish}
            className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none"
            style={{ background: '#3D231E', border: 'none', maxWidth: 360 }}
        >
            Go to My Kliques
        </button>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ClientOnboarding = () => {
    const navigate = useNavigate();
    const { session, updateProfile } = useSession();

    const [step, setStep] = useState(0);
    const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!session?.user) return;
        const pendingName = localStorage.getItem('proxey.pendingName');
        setForm(prev => ({
            ...prev,
            name: prev.name || pendingName || session.user.metadata?.full_name || '',
            email: prev.email || session.user.email || '',
        }));
    }, [session]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (error) setError(null);
    };

    // ── Save profile ─────────────────────────────────────────────────────────
    const handleSave = async () => {
        setError(null);

        if (!form.name.trim()) { setError('Please enter your full name.'); return; }
        if (!form.email.trim()) { setError('Please enter your email.'); return; }
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
        if (!emailOk) { setError('Please enter a valid email address.'); return; }
        if (!form.phone.trim()) { setError('Please enter your phone number.'); return; }
        if (!form.city.trim()) { setError('Please select your city.'); return; }

        setSaving(true);
        try {
            // Save to client_profiles via server
            await request('/client/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    city: form.city.trim(),
                    is_profile_complete: true,
                }),
            });

            // Also update local authContext profile so ProtectedRoute is satisfied.
            // This should not block the onboarding flow if Supabase metadata sync is slow.
            updateProfile({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                defaultLocation: form.city.trim(),
                isProfileComplete: true,
            }).catch((profileErr) => {
                console.warn('[ClientOnboarding] local profile sync error:', profileErr);
            });

            localStorage.removeItem('proxey.pendingName');
            setStep(2);
        } catch (err) {
            console.error('[ClientOnboarding] save error:', err);
            setError(err.message || 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleFinish = () => navigate('/app', { replace: true });

    if (step === 0) return <WelcomeStep onNext={() => setStep(1)} />;
    if (step === 1) return (
        <AboutYouStep
            form={form}
            onChange={handleChange}
            onNext={handleSave}
            onBack={() => setStep(0)}
            saving={saving}
            error={error}
        />
    );
    return <AllSetStep onFinish={handleFinish} />;
};

export default ClientOnboarding;
