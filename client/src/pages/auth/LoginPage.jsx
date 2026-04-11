/**
 * LoginPage — v6 Warm Editorial Auth Flow
 * Route: /login  (also /auth/login)
 *
 * Screens (managed by `screen` state):
 *   role           — choose client or provider
 *   client_login   — email + password, magic link, Google
 *   provider_login — same for providers
 *   client_signup  — name + email + password, Google
 *   provider_signup — name + email + phone + password, Google
 *   magic_link     — email entry for passwordless
 *   magic_sent     — confirmation after OTP sent
 *
 * Desktop: split layout — form (left, flex:1) + image panel (right, 50%)
 * Mobile: form only, full width
 */
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { supabase } from '../../utils/supabase';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import klogo from '../../klogo.png';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A',
    hero: '#FDDCC6', abg: '#F2EBE5', line: 'rgba(140,106,100,0.18)',
    base: '#FBF7F2', card: '#FFFFFF', danger: '#B04040', callout: '#FFF5E6',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Right-panel images & captions ─────────────────────────────────────────────
const IMG = {
    role: 'https://i.imgur.com/k577At5.jpg',
    client: 'https://i.imgur.com/mib845n.jpg',
    provider: 'https://i.imgur.com/rYkxkQ0.jpg',
    magic: 'https://i.imgur.com/d63jcdj.jpg',
    signup_client: 'https://i.imgur.com/5AzkZIw.jpg',
    signup_provider: 'https://i.imgur.com/AbS7lOm.jpg',
};
const TX = {
    role: 'Build relationships, not just bookings.',
    client: 'Book your favourite providers in seconds.',
    provider: 'Manage clients, bookings, and payments — all in one place.',
    magic: 'A secure link is on its way to your inbox.',
};

function imgKey(screen) {
    if (screen === 'client_signup') return 'signup_client';
    if (screen === 'provider_signup') return 'signup_provider';
    if (screen === 'client_login') return 'client';
    if (screen === 'provider_login') return 'provider';
    if (screen === 'magic_link' || screen === 'magic_sent') return 'magic';
    return 'role';
}

// ─── SVG icons ──────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const BoltIcon = () => (
    <svg width="15" height="15" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const EnvelopeIcon = () => (
    <svg width="36" height="36" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const ArrowIcon = () => (
    <svg width="20" height="20" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const BackArrow = () => (
    <svg width="22" height="22" fill="none" stroke={T.ink} strokeWidth="2" viewBox="0 0 24 24">
        <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// ─── Sub-components ─────────────────────────────────────────────────────────────

const Lbl = ({ children }) => (
    <span style={{ display: 'block', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>
        {children}
    </span>
);

const inputBase = {
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1px solid ${T.line}`, fontFamily: F, fontSize: 14,
    color: T.ink, outline: 'none', background: T.abg,
    boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s',
};

const Divider = ({ label = 'or' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: T.line }} />
        <span style={{ fontFamily: F, fontSize: 11, color: T.faded, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: T.line }} />
    </div>
);

const BtnPrimary = ({ onClick, disabled, children }) => (
    <button onClick={onClick} disabled={disabled} style={{
        width: '100%', padding: 16, borderRadius: 12, background: disabled ? T.muted : T.ink,
        color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 500,
        border: 'none', cursor: disabled ? 'default' : 'pointer', transition: 'opacity .15s',
    }}>
        {children}
    </button>
);

const BtnOutlined = ({ onClick, children, style = {} }) => (
    <button onClick={onClick} style={{
        width: '100%', padding: 14, borderRadius: 12,
        border: `1px solid ${T.line}`, background: 'transparent',
        fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: 'pointer', transition: 'background .15s', ...style,
    }}>
        {children}
    </button>
);

// ─── Password input with toggle ──────────────────────────────────────────────────
const EyeIcon = ({ off }) => off ? (
    <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>
    </svg>
) : (
    <svg width="18" height="18" fill="none" stroke={T.faded} strokeWidth="1.5" viewBox="0 0 24 24">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
);

function PwInput({ id, value, onChange, placeholder, hasError }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative' }}>
            <input
                id={id}
                type={show ? 'text' : 'password'}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoComplete="current-password"
                style={{
                    ...inputBase,
                    paddingRight: 44,
                    borderColor: hasError ? T.danger : undefined,
                    boxShadow: hasError ? `0 0 0 3px rgba(176,64,64,0.08)` : undefined,
                }}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', padding: 4, background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
            >
                <EyeIcon off={show} />
            </button>
        </div>
    );
}

// ─── Email validation ────────────────────────────────────────────────────────────
function isValidEmail(e) { return e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// ─── Option card (role screen) ───────────────────────────────────────────────────
function OptionCard({ icon, title, subtitle, onClick }) {
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 20px', borderRadius: 16,
                border: `1px solid ${hov ? 'rgba(251,146,60,0.5)' : '#E5E7EB'}`,
                background: '#fff', cursor: 'pointer', width: '100%', textAlign: 'left',
                marginBottom: 12, transition: 'all .2s', fontFamily: F,
                boxShadow: hov ? '0 4px 20px rgba(251,146,60,0.12)' : 'none',
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* hover tint overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(255,237,213,0.6), transparent)',
                opacity: hov ? 1 : 0, transition: 'opacity .2s', pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
                <div style={{
                    padding: 10, borderRadius: 12,
                    color: hov ? '#EA580C' : '#9CA3AF',
                    transition: 'color .2s', flexShrink: 0,
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', marginBottom: 4 }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>{subtitle}</div>
                </div>
            </div>
            <svg width="20" height="20" fill="none" stroke={hov ? '#F97316' : '#D1D5DB'} strokeWidth="2" viewBox="0 0 24 24" style={{ flexShrink: 0, position: 'relative', zIndex: 1, transition: 'stroke .2s' }}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

// ─── Screens ────────────────────────────────────────────────────────────────────

function RoleScreen({ onSelectClient, onSelectProvider, isDesktop, klogoSrc }) {
    return (
        <div>
            {/* Back button → landing page */}
            <div style={{ marginBottom: 28 }}>
                <a
                    href="https://mykliques.com"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontFamily: F, fontSize: 13, fontWeight: 500, color: T.muted,
                        textDecoration: 'none', transition: 'color .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = T.ink}
                    onMouseLeave={e => e.currentTarget.style.color = T.muted}
                >
                    <BackArrow />
                    Back
                </a>
            </div>
            <h1 style={{ fontFamily: F, fontSize: 30, fontWeight: 600, color: '#111827', letterSpacing: '-0.02em', margin: '0 0 8px' }}>Sign up or log in</h1>
            <p style={{ fontFamily: F, fontSize: 15, color: '#6B7280', margin: '0 0 32px' }}>Choose how you use Kliques</p>
            <OptionCard
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                title="Kliques for clients"
                subtitle="Book and manage your appointments"
                onClick={onSelectClient}
            />
            <OptionCard
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                title="Kliques for professionals"
                subtitle="Manage and grow your business"
                onClick={onSelectProvider}
            />
        </div>
    );
}

function LoginScreen({ role, onSignup, onMagicLink, onSuccess, onGoogleLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setError(null);
        if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
        setSubmitting(true);
        try {
            const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (err) throw err;
            onSuccess();
        } catch (err) {
            setError(err.message || 'Sign in failed. Please check your credentials.');
        } finally {
            setSubmitting(false);
        }
    };

    const label = role === 'client' ? 'client' : 'provider';
    return (
        <div>
            <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 4px' }}>Welcome back</h1>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 24px' }}>Sign in to your {label} account</p>

            <div style={{ marginBottom: 14 }}>
                <Lbl>Email</Lbl>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputBase} />
            </div>
            <div style={{ marginBottom: 6 }}>
                <Lbl>Password</Lbl>
                <PwInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button onClick={onMagicLink} style={{ fontFamily: F, fontSize: 12, color: T.accent, fontWeight: 500, padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Forgot password?
                </button>
            </div>

            {error && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '0 0 10px' }}>{error}</p>}

            <BtnPrimary onClick={handleSubmit} disabled={submitting}>{submitting ? 'Signing in…' : 'Sign In'}</BtnPrimary>
            <Divider />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <BtnOutlined onClick={onMagicLink}><BoltIcon /> Sign in without password</BtnOutlined>
                <BtnOutlined onClick={onGoogleLogin}><GoogleIcon /> Continue with Google</BtnOutlined>
            </div>
            <div style={{ paddingTop: 20, textAlign: 'center', borderTop: `1px solid ${T.line}`, marginTop: 20 }}>
                <button onClick={onSignup} style={{ fontFamily: F, fontSize: 14, color: T.muted, padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Don't have an account? <span style={{ color: T.accent, fontWeight: 600 }}>Sign up</span>
                </button>
            </div>
        </div>
    );
}

function SignupScreen({ role, onLogin, onGoogleSignup, onSuccess }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const isClient = role === 'client';

    const handleSubmit = async () => {
        setError(null);
        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (!email.trim()) { setError('Please enter your email.'); return; }
        if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setSubmitting(true);
        try {
            const { error: err } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: { role, full_name: name.trim(), phone: phone.trim() || null },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (err) throw err;
            window.localStorage.setItem('proxey.pending_role', role);
            window.localStorage.setItem('proxey.pendingName', name.trim());
            // Welcome email is sent in AuthCallback after email confirmation
            onSuccess(email.trim());
        } catch (err) {
            setError(err.message || 'Signup failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
                {isClient ? 'Create your account' : 'Start your business'}
            </h1>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 32px' }}>
                {isClient ? 'Join Kliques as a client' : 'Create your provider account'}
            </p>

            <div style={{ marginBottom: 20 }}>
                <Lbl>Full Name</Lbl>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputBase} />
            </div>
            <div style={{ marginBottom: 20 }}>
                <Lbl>Email</Lbl>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" autoComplete="email" style={inputBase} />
            </div>
            {!isClient && (
                <div style={{ marginBottom: 20 }}>
                    <Lbl>Phone Number</Lbl>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" autoComplete="tel" style={inputBase} />
                </div>
            )}
            <div style={{ marginBottom: 6 }}>
                <Lbl>Password</Lbl>
                <PwInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" />
            </div>
            <p style={{ fontFamily: F, fontSize: 11, color: T.faded, margin: '0 0 24px' }}>At least 8 characters</p>

            {error && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '0 0 12px' }}>{error}</p>}

            <BtnPrimary onClick={handleSubmit} disabled={submitting}>{submitting ? 'Creating account…' : 'Create Account'}</BtnPrimary>
            <Divider />
            <BtnOutlined onClick={() => onGoogleSignup(name)}><GoogleIcon /> Sign up with Google</BtnOutlined>
            <div style={{ paddingTop: 24, textAlign: 'center' }}>
                <button onClick={onLogin} style={{ fontFamily: F, fontSize: 14, color: T.muted, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Already have an account? <span style={{ color: T.accent, fontWeight: 500 }}>Sign in</span>
                </button>
            </div>
        </div>
    );
}

function MagicLinkScreen({ onSent }) {
    const [email, setEmail] = useState('');
    const [emailErr, setEmailErr] = useState(false);
    const [shake, setShake] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSend = async () => {
        if (!isValidEmail(email.trim())) {
            setEmailErr(true);
            setShake(true);
            setTimeout(() => setShake(false), 300);
            return;
        }
        setSubmitting(true);
        try {
            await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            onSent(email.trim());
        } catch (err) {
            // still show magic_sent even if rate-limited to avoid email enumeration
            onSent(email.trim());
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h1 style={{ fontFamily: F, fontSize: 28, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 6px' }}>Sign in without password</h1>
            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 32px', lineHeight: 1.6 }}>
                Enter your email and we'll send you a secure link. Click it and you're signed in — no password needed.
            </p>
            <Lbl>Email</Lbl>
            <input
                value={email}
                onChange={e => { setEmail(e.target.value); setEmailErr(false); }}
                placeholder="you@email.com"
                type="email"
                autoComplete="email"
                style={{
                    ...inputBase,
                    borderColor: emailErr ? T.danger : undefined,
                    boxShadow: emailErr ? `0 0 0 3px rgba(176,64,64,0.08)` : undefined,
                    animation: shake ? 'shake .3s ease' : 'none',
                }}
            />
            {emailErr && <p style={{ fontFamily: F, fontSize: 12, color: T.danger, margin: '6px 0 0' }}>Please enter a valid email address</p>}
            <div style={{ height: 24 }} />
            <BtnPrimary onClick={handleSend} disabled={submitting}>{submitting ? 'Sending…' : 'Send Magic Link'}</BtnPrimary>
            <div style={{ paddingTop: 20, textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: 0, lineHeight: 1.6 }}>
                    This also works if you forgot your password.<br />
                    You can set a new one from your profile after signing in.
                </p>
            </div>
        </div>
    );
}

function MagicSentScreen({ email, isSignup, onResend, onSignInWithPassword }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flex: 1, padding: '32px 0' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
                <EnvelopeIcon />
            </div>
            <h2 style={{ fontFamily: F, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
                {isSignup ? 'Almost there — check your email' : 'Check your email'}
            </h2>
            <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 6px', lineHeight: 1.6 }}>
                {isSignup ? 'We sent a confirmation link to' : 'We sent a magic link to'}
            </p>
            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, margin: '0 0 28px' }}>{email}</p>
            <div style={{ padding: '14px 24px', background: T.callout, borderRadius: 12, marginBottom: 12, maxWidth: 340 }}>
                <p style={{ fontFamily: F, fontSize: 13, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                    {isSignup
                        ? 'Click the link in the email to confirm your account and get started.'
                        : 'Click the link to sign in instantly. The link expires in 1 hour.'}
                </p>
            </div>
            {isSignup && (
                <p style={{ fontFamily: F, fontSize: 12, color: T.faded, margin: '0 0 28px', maxWidth: 300, lineHeight: 1.5 }}>
                    You'll also receive a welcome email from Kliques with everything you need to get started.
                </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                {!isSignup && (
                    <button onClick={onResend} style={{ fontFamily: F, fontSize: 13, color: T.ink, fontWeight: 500, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                        Resend magic link
                    </button>
                )}
                <button onClick={onSignInWithPassword} style={{ fontFamily: F, fontSize: 13, color: T.muted, padding: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                    Sign in with password instead
                </button>
            </div>
        </div>
    );
}

// ─── Preload all images on mount ─────────────────────────────────────────────────
const ALL_SRCS = Object.values(IMG);

// ─── Right image panel ───────────────────────────────────────────────────────────
function ImagePanel({ screen }) {
    const key = imgKey(screen);
    const src = IMG[key];
    const caption = TX[key];

    const [displayedSrc, setDisplayedSrc] = useState(src);
    const [displayedCaption, setDisplayedCaption] = useState(caption);
    const [opacity, setOpacity] = useState(1);
    const prevSrc = useRef(src);

    // Preload all images once
    useEffect(() => {
        ALL_SRCS.forEach(s => { const img = new Image(); img.src = s; });
    }, []);

    // Crossfade when screen changes
    useEffect(() => {
        if (src === prevSrc.current) return;
        prevSrc.current = src;
        setOpacity(0);
        const t = setTimeout(() => {
            setDisplayedSrc(src);
            setDisplayedCaption(caption);
            setOpacity(1);
        }, 500);
        return () => clearTimeout(t);
    }, [src, caption]);

    return (
        <div style={{ width: '55%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
            <img
                src={displayedSrc}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity, transition: 'opacity 0.7s ease' }}
            />
            {/* Top + bottom gradient */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.25) 100%)', pointerEvents: 'none' }} />
            {/* Caption */}
            <div style={{ position: 'absolute', top: 40, left: 44, right: 44, zIndex: 2 }}>
                <p style={{ fontFamily: F, color: '#fff', fontSize: 14, fontWeight: 500, letterSpacing: '0.01em', margin: 0, lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.3)', opacity, transition: 'opacity 0.7s ease' }}>
                    {displayedCaption}
                </p>
            </div>
        </div>
    );
}

// ─── Back button ─────────────────────────────────────────────────────────────────
function BackBtn({ onClick, isDesktop }) {
    return (
        <div style={{ padding: isDesktop ? '28px 56px 0' : '28px 28px 0' }}>
            <button
                onClick={onClick}
                style={{
                    padding: 8, borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = T.abg}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
                <BackArrow />
            </button>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
    const navigate = useNavigate();
    const { loginWithGoogle } = useSession();
    const isDesktop = useIsDesktop();

    const [screen, setScreen] = useState('role'); // role | client_login | provider_login | client_signup | provider_signup | magic_link | magic_sent
    const [flowRole, setFlowRole] = useState('client');
    const [sentEmail, setSentEmail] = useState('');
    const [isSignup, setIsSignup] = useState(false);

    const goBack = () => {
        if (screen === 'client_signup') setScreen('client_login');
        else if (screen === 'provider_signup') setScreen('provider_login');
        else if (screen === 'magic_sent') setScreen('magic_link');
        else if (screen === 'magic_link') setScreen(flowRole + '_login');
        else setScreen('role');
    };

    const handleAuthSuccess = () => {
        // AuthContext / onAuthStateChange will redirect; just push to default
        navigate('/');
    };

    const handleGoogle = async (pendingName = '') => {
        try { await loginWithGoogle(flowRole, pendingName); } catch (e) { /* handled by context */ }
    };

    const renderScreen = () => {
        switch (screen) {
            case 'role':
                return (
                    <RoleScreen
                        onSelectClient={() => { setFlowRole('client'); setScreen('client_login'); }}
                        onSelectProvider={() => { setFlowRole('provider'); setScreen('provider_login'); }}
                        isDesktop={isDesktop}
                        klogoSrc={klogo}
                    />
                );
            case 'client_login':
            case 'provider_login':
                return (
                    <LoginScreen
                        role={flowRole}
                        onSignup={() => setScreen(flowRole + '_signup')}
                        onMagicLink={() => setScreen('magic_link')}
                        onSuccess={handleAuthSuccess}
                        onGoogleLogin={handleGoogle}
                    />
                );
            case 'client_signup':
            case 'provider_signup':
                return (
                    <SignupScreen
                        role={flowRole}
                        onLogin={() => setScreen(flowRole + '_login')}
                        onGoogleSignup={handleGoogle}
                        onSuccess={(email) => { setSentEmail(email); setIsSignup(true); setScreen('magic_sent'); }}
                    />
                );
            case 'magic_link':
                return (
                    <MagicLinkScreen
                        onSent={(email) => { setSentEmail(email); setIsSignup(false); setScreen('magic_sent'); }}
                    />
                );
            case 'magic_sent':
                return (
                    <MagicSentScreen
                        email={sentEmail}
                        isSignup={isSignup}
                        onResend={() => setScreen('magic_link')}
                        onSignInWithPassword={() => setScreen(flowRole + '_login')}
                    />
                );
            default:
                return null;
        }
    };

    const showBack = screen !== 'role';
    const legalLinks = (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18, flexWrap: 'wrap', marginTop: 24 }}>
            <Link to="/terms" style={{ fontFamily: F, fontSize: 12, color: T.muted, textDecoration: 'none' }}>
                Terms of Service
            </Link>
            <Link to="/policy" style={{ fontFamily: F, fontSize: 12, color: T.muted, textDecoration: 'none' }}>
                Privacy Policy
            </Link>
        </div>
    );

    const formPanel = (
        <div style={{ flex: 1, background: isDesktop ? '#fff' : 'transparent', display: 'flex', flexDirection: 'column', minHeight: isDesktop ? '100%' : '100dvh' }}>
            {showBack && <BackBtn onClick={goBack} isDesktop={isDesktop} />}

            {/* Logo — only shown on magic link / sent screens, not login or signup */}
            {showBack && (screen === 'magic_link' || screen === 'magic_sent') && (
                <div style={{ padding: isDesktop ? '16px 56px 0' : '16px 28px 0' }}>
                    <img src={klogo} alt="Kliques" style={{ height: isDesktop ? 64 : 56, width: 'auto', objectFit: 'contain', display: 'block' }} />
                </div>
            )}

            {/* Content area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isDesktop ? '32px 56px 32px' : '24px 28px 32px', maxWidth: 520, margin: '0 auto', width: '100%' }}>
                {renderScreen()}
            </div>

            {/* Footer links */}
            <div style={{ padding: isDesktop ? '0 56px 28px' : '0 28px 28px' }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    {[
                        { label: 'English', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
                        { label: 'Help and support', icon: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg> },
                    ].map(({ label, icon }) => (
                        <a key={label} href="#" style={{ fontFamily: F, fontSize: 13, color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                            {icon}{label}
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );

    const globalStyles = `
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        * { box-sizing: border-box; }
        button:active { transform: scale(0.98); }
    `;

    if (isDesktop) {
        return (
            <div style={{
                minHeight: '100vh', fontFamily: F,
                background: 'linear-gradient(135deg, #FCD4C4 0%, #FDF1EB 50%, #FDFDFD 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 32, position: 'relative', overflow: 'hidden',
            }}>
                <style>{globalStyles}</style>
                {/* Soft glow blob */}
                <div style={{ position: 'absolute', bottom: '-20%', left: '5%', width: '60%', height: '60%', background: '#FDBD9E', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.35, pointerEvents: 'none' }} />
                <div style={{
                    width: '100%', maxWidth: 1100, height: 760, borderRadius: 32,
                    overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
                    display: 'flex', background: '#fff', position: 'relative', zIndex: 1,
                }}>
                    {/* Left form panel — 45% */}
                    <div style={{ width: '45%', display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto' }}>
                        {formPanel}
                    </div>
                    <ImagePanel screen={screen} />
                </div>
            </div>
        );
    }

    // Mobile — gradient background matching marketing site
    return (
        <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #FCD4C4 0%, #FDE8DC 30%, #FDF5F0 65%, #FDFDFD 100%)', fontFamily: F }}>
            <style>{globalStyles}</style>
            <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>{formPanel}</div>
                <div style={{ padding: '0 24px 28px' }}>{legalLinks}</div>
            </div>
        </div>
    );
}
