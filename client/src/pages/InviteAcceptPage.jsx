/**
 * InviteAcceptPage — /join/:code
 *
 * Scenarios:
 *   A — Logged in: skip landing, connect immediately, show connecting → connected
 *   B — No account: landing (Sign Up CTA) → signup screen → connecting → connected
 *   C — Has account, not logged in: landing (Sign In CTA) → login screen → connecting → connected
 *
 * Edge cases: invalid code, expired, own invite, provider role user, already connected
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { supabase } from '../utils/supabase';
import { request } from '../data/apiClient';
import klogo from '../klogo.png';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    base: '#FBF7F2', ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    accent: '#C25E4A', hero: '#FDDCC6', abg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)', card: '#FFFFFF',
    success: '#5A8A5E', successBg: '#EBF2EC',
    danger: '#B04040', dangerBg: '#FDEDEA',
    callout: '#FFF5E6',
};
const F = "'Sora',system-ui,sans-serif";
const APP_ORIGIN = process.env.REACT_APP_APP_URL || window.location.origin;

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

const fmtCategory = (cat) => cat ? cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// ─── Shared primitives ─────────────────────────────────────────────────────────
const Lbl = ({ children }) => (
    <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>
        {children}
    </span>
);

const BtnPrimary = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: 16, borderRadius: 12, border: 'none',
        background: disabled ? T.faded : T.ink, color: '#fff',
        fontFamily: F, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer', transition: 'opacity .15s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    }}>
        {children}
    </button>
);

const BtnOutlined = ({ onClick, children }) => (
    <button onClick={onClick} style={{
        width: '100%', padding: 14, borderRadius: 12,
        border: `1px solid ${T.line}`, background: 'transparent',
        fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', transition: 'background .15s',
    }}>
        {children}
    </button>
);

const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
    color: T.ink, outline: 'none', background: T.abg, boxSizing: 'border-box',
};

const shellStyle = {
    minHeight: '100dvh',
    background: T.base,
    fontFamily: F,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
};

const wrapStyle = {
    width: '100%',
    maxWidth: 480,
};

function TopNav({ onBack }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', paddingBottom: 24 }}>
            {onBack && (
                <div style={{ position: 'absolute', left: 0 }}>
                    <BackBtn onClick={onBack} />
                </div>
            )}
            <img src={klogo} alt="kliques" style={{ height: 62, width: 'auto', display: 'block' }} />
        </div>
    );
}

function ProviderMiniCard({ provider }) {
    const displayName = provider?.business_name || provider?.name || 'Your Provider';
    const subtitle = [fmtCategory(provider?.category), provider?.city].filter(Boolean).join(' · ');
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', background: T.hero, borderRadius: 14, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 500, color: T.muted, flexShrink: 0, border: '2px solid rgba(255,255,255,0.65)', overflow: 'hidden' }}>
                {(provider?.photo || provider?.avatar)
                    ? <img src={provider.photo || provider.avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials(displayName)}
            </div>
            <div>
                <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: T.ink }}>Joining {displayName}'s klique</p>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>{subtitle || 'Provider invite'}</p>
            </div>
        </div>
    );
}

const Divider = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: T.line }} />
        <span style={{ fontFamily: F, fontSize: 11, color: T.faded, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
        <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
);

const BackBtn = ({ onClick }) => (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
        <svg width="22" height="22" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    </button>
);

const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

// Password field with show/hide
function PwField({ value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="current-password"
                style={{ ...inputStyle, paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShow(s => !s)} style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex',
            }}>
                {show ? (
                    <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
                    </svg>
                ) : (
                    <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                )}
            </button>
        </div>
    );
}

// Provider avatar
function ProviderAvatar({ provider, size = 72 }) {
    const displayName = provider?.business_name || provider?.name || '';
    if (provider?.photo || provider?.avatar) {
        return (
            <img
                src={provider.photo || provider.avatar}
                alt={displayName}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)' }}
            />
        );
    }
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)', border: '3px solid rgba(255,255,255,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: F, fontSize: size * 0.3, fontWeight: 500, color: T.muted,
        }}>
            {initials(displayName)}
        </div>
    );
}

// ─── SCREEN: Loading ────────────────────────────────────────────────────────────
function ScreenLoading() {
    return (
        <div style={{ minHeight: '100dvh', background: T.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${T.hero}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                <span style={{ fontSize: 14, color: T.muted }}>Loading…</span>
            </div>
        </div>
    );
}

// ─── SCREEN: Error ──────────────────────────────────────────────────────────────
function ScreenError({ reason, providerName }) {
    const navigate = useNavigate();
    const msgs = {
        not_found:        'This invite link is invalid.',
        expired:          `This invite link has expired. Ask ${providerName || 'your provider'} to send you a new one.`,
        provider_not_found: 'This provider is no longer on Kliques.',
        own_invite:       "You can't join your own klique.",
        wrong_role:       'Invite links are for clients. Sign in as a client to connect.',
    };
    const msg = msgs[reason] || 'This invite link is invalid or has expired.';
    return (
        <div style={{ minHeight: '100dvh', background: T.base, fontFamily: F, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="26" height="26" fill="none" stroke={T.accent} strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                </svg>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px', textAlign: 'center' }}>Link not valid</h2>
            <p style={{ fontSize: 14, color: T.muted, margin: '0 0 32px', textAlign: 'center', lineHeight: 1.6, maxWidth: 280 }}>{msg}</p>
            <button onClick={() => navigate('/')} style={{ padding: '14px 32px', borderRadius: 12, border: 'none', background: T.ink, color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                Go to Kliques
            </button>
        </div>
    );
}

// ─── SCREEN: Landing ────────────────────────────────────────────────────────────
function ScreenLanding({ provider, hasAccount, onPrimary, onSecondary }) {
    const displayName = provider?.business_name || provider?.name || 'Your Provider';
    const subtitle = [fmtCategory(provider?.category), provider?.city].filter(Boolean).join(' · ');

    const benefits = [
        {
            title: 'Book sessions directly',
            desc: `Skip the back-and-forth. Book with ${displayName} in a few taps.`,
            icon: <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>,
        },
        {
            title: 'Stay connected',
            desc: 'Get reminders, updates, and session notes in one place.',
            icon: <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>,
        },
        {
            title: 'Secure payments',
            desc: 'Pay safely through Stripe. No cash needed.',
            icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>,
        },
    ];

    return (
        <div style={shellStyle}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;1,500&display=swap');
                @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                .invite-fade { animation: fadeUp .5s ease both; }
            `}</style>
            <div style={wrapStyle} className="invite-fade">
                <TopNav />

                <div style={{ background: T.hero, borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden', marginBottom: 28 }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: TOPO_SVG, backgroundSize: 'cover', opacity: 0.1, pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <div style={{ marginBottom: 20, position: 'relative' }}>
                            <ProviderAvatar provider={provider} size={80} />
                            <div style={{ position: 'absolute', bottom: 2, right: 2, width: 22, height: 22, borderRadius: '50%', background: T.success, border: `3px solid ${T.hero}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.25, margin: '0 0 8px', color: T.ink }}>
                            {displayName} invited you<br />to join their klique.
                        </h1>
                        <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                            {displayName}{subtitle ? ` · ${subtitle}` : ''}
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    {benefits.map(b => (
                        <div key={b.title} style={{ display: 'flex', gap: 16, padding: '14px 0', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="16" height="16" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
                                    {b.icon}
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontFamily: F, fontSize: 14, fontWeight: 500, margin: '0 0 2px', color: T.ink }}>{b.title}</p>
                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.5 }}>{b.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <BtnPrimary onClick={onPrimary}>
                    {hasAccount ? 'Accept Invite & Sign In' : 'Accept Invite & Sign Up'}
                </BtnPrimary>
                <div style={{ height: 12 }} />
                <BtnOutlined onClick={onSecondary}>
                    {hasAccount ? "I don't have an account yet" : 'I already have an account'}
                </BtnOutlined>

                <div style={{ marginTop: 'auto', padding: '20px 0 24px', textAlign: 'center' }}>
                    <p style={{ fontFamily: F, fontSize: 11, color: T.faded, margin: 0 }}>
                        By continuing, you agree to Kliques' Terms & Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── SCREEN: Signup ─────────────────────────────────────────────────────────────
function ScreenSignup({ provider, onBack, onSuccess, onGoogleAuth, onSwitchToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const displayName = provider?.business_name || provider?.name || 'your provider';

    const handleSubmit = async () => {
        setError(null);
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (!isValidEmail(email.trim())) { setError('Please enter a valid email.'); return; }
        if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setSubmitting(true);
        try {
            const { error: err } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { role: 'client', full_name: name.trim() },
                    emailRedirectTo: `${APP_ORIGIN}/auth/callback?signup_role=client&signup_name=${encodeURIComponent(name.trim())}`,
                },
            });
            if (err) throw err;
            window.localStorage.setItem('proxey.pending_role', 'client');
            window.localStorage.setItem('proxey.pendingName', name.trim());
            onSuccess();
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={shellStyle}>
            <div style={wrapStyle}>
                <TopNav onBack={onBack} />
                <ProviderMiniCard provider={provider} />

                <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Create your account</h1>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 28px' }}>Sign up to connect with {displayName}</p>

                <div style={{ marginBottom: 16 }}>
                    <Lbl>Full Name</Lbl>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Lbl>Email</Lbl>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 6 }}>
                    <Lbl>Password</Lbl>
                    <PwField value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" />
                </div>
                <p style={{ fontFamily: F, fontSize: 11, color: T.faded, margin: '0 0 24px' }}>At least 8 characters</p>

                {error && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '0 0 12px' }}>{error}</p>}

                <BtnPrimary onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Spinner />}
                    {submitting ? 'Creating account…' : 'Create Account & Connect'}
                </BtnPrimary>
                <Divider />
                <BtnOutlined onClick={() => onGoogleAuth(name)}><GoogleIcon /> Sign up with Google</BtnOutlined>

                <div style={{ marginTop: 'auto', padding: '20px 0 24px', textAlign: 'center' }}>
                    <button onClick={onSwitchToLogin} style={{ fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Already have an account? <span style={{ color: T.accent, fontWeight: 500 }}>Sign in</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── SCREEN: Login ──────────────────────────────────────────────────────────────
function ScreenLogin({ provider, onBack, onSuccess, onGoogleAuth, onSwitchToSignup }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const displayName = provider?.business_name || provider?.name || 'your provider';

    const handleSubmit = async () => {
        setError(null);
        if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
        setSubmitting(true);
        try {
            const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (err) throw err;
            onSuccess();
        } catch (err) {
            setError(err.message || 'Sign in failed. Check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={shellStyle}>
            <div style={wrapStyle}>
                <TopNav onBack={onBack} />
                <ProviderMiniCard provider={provider} />

                <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Welcome back</h1>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 28px' }}>Sign in to connect with {displayName}</p>

                <div style={{ marginBottom: 16 }}>
                    <Lbl>Email</Lbl>
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                    <Lbl>Password</Lbl>
                    <PwField value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
                </div>

                {error && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '0 0 12px' }}>{error}</p>}

                <BtnPrimary onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Spinner />}
                    {submitting ? 'Signing in…' : 'Sign In & Connect'}
                </BtnPrimary>
                <Divider />
                <BtnOutlined onClick={onGoogleAuth}><GoogleIcon /> Continue with Google</BtnOutlined>

                <div style={{ marginTop: 'auto', padding: '20px 0 24px', textAlign: 'center' }}>
                    <button onClick={onSwitchToSignup} style={{ fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Don't have an account? <span style={{ color: T.accent, fontWeight: 500 }}>Sign up</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── SCREEN: Connecting (animated) ─────────────────────────────────────────────
function ScreenConnecting({ provider, clientName }) {
    const displayName = provider?.business_name || provider?.name || 'Provider';
    const providerInits = initials(displayName);
    const clientInits = initials(clientName || 'You');
    return (
        <div style={shellStyle}>
            <style>{`
                @keyframes pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}
                @keyframes draw{to{stroke-dashoffset:0}}
            `}</style>
            <div style={{ ...wrapStyle, textAlign: 'center' }}>
                <TopNav />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 36 }}>
                {/* Provider avatar */}
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: T.muted, border: `3px solid ${T.base}`, zIndex: 2, animation: 'pop .4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    {provider?.photo || provider?.avatar
                        ? <img src={provider.photo || provider.avatar} alt="" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover' }} />
                        : providerInits}
                    </div>
                {/* Animated line */}
                    <svg width="56" height="4" style={{ margin: '0 -8px', zIndex: 1 }}>
                        <line x1="0" y1="2" x2="56" y2="2" stroke={T.accent} strokeWidth="2.5" strokeDasharray="56" strokeDashoffset="56" strokeLinecap="round" style={{ animation: 'draw .6s ease .3s both' }} />
                    </svg>
                {/* Client avatar */}
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: T.muted, border: `3px solid ${T.base}`, zIndex: 2, animation: 'pop .4s cubic-bezier(0.34,1.56,0.64,1) .15s both' }}>
                        {clientInits}
                    </div>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px', color: T.ink }}>Connecting you with {displayName}...</h2>
                <p style={{ fontFamily: F, fontSize: 14, color: T.faded, margin: 0 }}>This will only take a moment</p>
            </div>
        </div>
    );
}

// ─── SCREEN: Connected ──────────────────────────────────────────────────────────
function ScreenConnected({ provider, clientName }) {
    const navigate = useNavigate();
    const displayName = provider?.business_name || provider?.name || 'Your Provider';
    const providerInits = initials(displayName);
    const clientInits = initials(clientName || 'You');
    const subtitle = [fmtCategory(provider?.category), provider?.city].filter(Boolean).join(' · ');

    const items = [
        `Browse ${displayName}'s services and book a session`,
        `Message ${displayName} directly`,
        'See your relationship timeline grow',
    ];

    return (
        <div style={shellStyle}>
            <style>{`@keyframes pop{0%{transform:scale(0.8);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
            <div style={{ ...wrapStyle, textAlign: 'center' }}>
                <TopNav />

            {/* Two avatars + solid line */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: T.muted, border: `3px solid ${T.base}`, zIndex: 2, animation: 'pop .4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                    {provider?.photo || provider?.avatar
                        ? <img src={provider.photo || provider.avatar} alt="" style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover' }} />
                        : providerInits}
                    </div>
                    <div style={{ width: 56, height: 3, margin: '0 -8px', zIndex: 1, background: T.accent, borderRadius: 2 }} />
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 500, color: T.muted, border: `3px solid ${T.base}`, zIndex: 2, animation: 'pop .4s cubic-bezier(0.34,1.56,0.64,1) .1s both' }}>
                        {clientInits}
                    </div>
                </div>

            {/* Connected pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9999, background: T.successBg, marginBottom: 32 }}>
                <svg width="14" height="14" fill="none" stroke={T.success} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.success }}>Connected</span>
            </div>

                <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 8px', color: T.ink }}>You're in!</h1>
                <p style={{ fontSize: 15, color: T.muted, margin: '0 0 32px', lineHeight: 1.6, maxWidth: 340, marginInline: 'auto' }}>
                    You and {displayName} are now in each other's klique. Your relationship starts here.
                </p>

                <div style={{ width: '100%', textAlign: 'left', padding: 24, background: T.card, border: `1px solid ${T.line}`, borderRadius: 18, marginBottom: 24 }}>
                <Lbl>What you can do now</Lbl>
                <div style={{ marginTop: 4 }}>
                    {items.map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: T.abg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="15" height="15" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M7 17L17 7M17 7H7M17 7V17" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <span style={{ fontFamily: F, fontSize: 13, color: T.ink }}>{item}</span>
                        </div>
                    ))}
                </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BtnPrimary onClick={() => navigate('/app')}>Book a Session</BtnPrimary>
                    <BtnOutlined onClick={() => navigate('/app')}>Go to My Kliques</BtnOutlined>
                </div>
            </div>
        </div>
    );
}

// ─── SCREEN: Already Connected ──────────────────────────────────────────────────
function ScreenAlreadyConnected({ provider }) {
    const navigate = useNavigate();
    const displayName = provider?.business_name || provider?.name || 'Your Provider';

    return (
        <div style={shellStyle}>
            <div style={{ ...wrapStyle, textAlign: 'center' }}>
                <TopNav />
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <ProviderAvatar provider={provider} size={72} />
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 10px', color: T.ink }}>Already connected</h1>
                <p style={{ fontSize: 15, color: T.muted, margin: '0 0 32px', lineHeight: 1.6 }}>
                    You're already in {displayName}'s klique.
                </p>
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BtnPrimary onClick={() => navigate('/app')}>Book a Session</BtnPrimary>
                    <BtnOutlined onClick={() => navigate('/app')}>Go to My Kliques</BtnOutlined>
                </div>
            </div>
        </div>
    );
}

// ─── Spinner ────────────────────────────────────────────────────────────────────
function Spinner() {
    return (
        <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────────
export default function InviteAcceptPage() {
    const { code } = useParams();
    const [searchParams] = useSearchParams();
    const { session, loading: authLoading } = useSession();
    const { loginWithGoogle } = useSession();

    const [screen, setScreen] = useState('loading');
    const [provider, setProvider] = useState(null);
    const [errorReason, setErrorReason] = useState(null);

    // Determine if user has an account (we detect this based on scenario context)
    // We show "has account" landing for logged-out users after login screen visit
    const [landingMode, setLandingMode] = useState('signup'); // 'signup' | 'login'

    // ── On mount: validate invite + handle auth state ──────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (!code) { setErrorReason('not_found'); setScreen('error'); return; }
        loadInvite();
    }, [code, authLoading, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

    const loadInvite = async () => {
        try {
            const data = await request(`/provider/invites/join/${code}`);
            if (!data.valid) {
                setErrorReason(data.reason || 'not_found');
                setScreen('error');
                return;
            }
            setProvider(data.provider);

            if (searchParams.get('accepted') === 'true') {
                setScreen('connected');
                return;
            }

            if (session) {
                // Scenario A: logged in — connect immediately
                await doAccept();
            } else {
                setScreen('landing');
            }
        } catch {
            setErrorReason('not_found');
            setScreen('error');
        }
    };

    // ── Accept invite via new endpoint ─────────────────────────────────────────
    const doAccept = async () => {
        setScreen('connecting');
        try {
            const result = await request(`/invites/${code}/accept`, { method: 'POST' });
            if (result.already_connected) {
                if (result.provider) setProvider(result.provider);
                setScreen('already_connected');
                return;
            }
            if (result.error === 'own_invite') { setErrorReason('own_invite'); setScreen('error'); return; }
            if (result.error === 'wrong_role') { setErrorReason('wrong_role'); setScreen('error'); return; }
            if (result.provider) setProvider(result.provider);
            // Show connecting animation for 1.5s then connected
            setTimeout(() => setScreen('connected'), 1500);
        } catch {
            setTimeout(() => setScreen('connected'), 1500);
        }
    };

    // ── After auth (signup or login) succeeds, accept invite ──────────────────
    const handleAuthSuccess = async () => {
        await doAccept();
    };

    // ── Google OAuth ────────────────────────────────────────────────────────────
    const handleGoogle = async (pendingName = '') => {
        // Store the invite code so AuthCallback can redirect back
        sessionStorage.setItem('kliques.pending_invite_code', code);
        try {
            await loginWithGoogle('client', pendingName, true);
        } catch {
            // OAuth redirects, nothing to catch
        }
    };

    const clientName = session?.user?.user_metadata?.full_name || session?.user?.email || '';

    if (screen === 'loading') return <ScreenLoading />;

    if (screen === 'error') return <ScreenError reason={errorReason} providerName={provider?.business_name || provider?.name} />;

    if (screen === 'landing') {
        return (
            <ScreenLanding
                provider={provider}
                hasAccount={landingMode === 'login'}
                onPrimary={() => {
                    if (landingMode === 'login') setScreen('login');
                    else setScreen('signup');
                }}
                onSecondary={() => {
                    if (landingMode === 'login') { setLandingMode('signup'); setScreen('signup'); }
                    else { setLandingMode('login'); setScreen('login'); }
                }}
            />
        );
    }

    if (screen === 'signup') {
        return (
            <ScreenSignup
                provider={provider}
                onBack={() => setScreen('landing')}
                onSuccess={handleAuthSuccess}
                onGoogleAuth={handleGoogle}
                onSwitchToLogin={() => setScreen('login')}
            />
        );
    }

    if (screen === 'login') {
        return (
            <ScreenLogin
                provider={provider}
                onBack={() => setScreen('landing')}
                onSuccess={handleAuthSuccess}
                onGoogleAuth={handleGoogle}
                onSwitchToSignup={() => setScreen('signup')}
            />
        );
    }

    if (screen === 'connecting') return <ScreenConnecting provider={provider} clientName={clientName} />;
    if (screen === 'connected') return <ScreenConnected provider={provider} clientName={clientName} />;
    if (screen === 'already_connected') return <ScreenAlreadyConnected provider={provider} />;

    return null;
}
