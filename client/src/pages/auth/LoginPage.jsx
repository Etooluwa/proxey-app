/**
 * LoginPage — v6 Warm Editorial
 * Route: /auth/login
 *
 * Three modes:
 *   "login"  — email field + Send Login Link + social buttons
 *   "signup" — role toggle + name/email/phone + Create Account
 *   "magic"  — "Check your email." confirmation screen
 *
 * Auth: Supabase magic link (signInWithOtp) for login/signup
 *       Google OAuth via loginWithGoogle from authContext
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { supabase } from '../../utils/supabase';

// ─── Topographic SVG texture ──────────────────────────────────────────────────

const TOPO_SVG = `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M50 150 Q 150 50 250 150 T 450 150' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M0 300 Q 100 200 200 300 T 400 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M100 50 Q 200 -50 300 50 T 500 50' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M200 350 Q 250 250 350 300' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`;

// ─── Shared input ─────────────────────────────────────────────────────────────

const Field = ({ label, value, onChange, type = 'text', placeholder }) => (
    <div className="mb-5">
        <span
            className="block mb-2 text-[11px] font-medium uppercase tracking-[0.05em]"
            style={{ color: '#8C6A64' }}
        >
            {label}
        </span>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'name'}
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

// ─── Magic link sent screen ───────────────────────────────────────────────────

const MagicSentScreen = ({ onBack }) => (
    <div
        className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center"
        style={{ minHeight: '100dvh', background: '#FBF7F2' }}
    >
        {/* Open envelope icon */}
        <div
            className="flex items-center justify-center mb-6 rounded-[20px]"
            style={{ width: 72, height: 72, background: '#FDDCC6' }}
        >
            <svg width="32" height="32" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>

        <h1
            className="text-[26px] font-semibold tracking-[-0.03em] text-ink mb-2"
            style={{ lineHeight: 1.1 }}
        >
            Check your email.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed mb-8 max-w-[300px]">
            We sent a login link to your email address. Tap the link to sign in — no password needed.
        </p>

        <button
            onClick={onBack}
            className="text-[14px] font-medium focus:outline-none"
            style={{ color: '#C25E4A', background: 'none', border: 'none' }}
        >
            Back to login
        </button>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const LoginPage = () => {
    const navigate = useNavigate();
    const { loginWithGoogle, setLocalRole } = useSession();

    const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'magic'
    const [role, setRole] = useState('client');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // ── Send magic link ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setError(null);
        if (!email.trim()) {
            setError('Please enter your email address.');
            return;
        }
        if (mode === 'signup' && !name.trim()) {
            setError('Please enter your full name.');
            return;
        }

        setSubmitting(true);
        try {
            if (supabase) {
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: email.trim(),
                    options: {
                        shouldCreateUser: mode === 'signup',
                        data: mode === 'signup' ? {
                            role,
                            full_name: name.trim(),
                            phone: phone.trim() || null,
                        } : undefined,
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (otpError) throw otpError;
                // Store role locally so callback knows which onboarding to send to
                if (mode === 'signup') {
                    window.localStorage.setItem('proxey.pendingRole', role);
                    window.localStorage.setItem('proxey.pendingName', name.trim());
                }
            }
            setMode('magic');
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Google OAuth ─────────────────────────────────────────────────────────
    const handleGoogle = async () => {
        setError(null);
        try {
            await loginWithGoogle(mode === 'signup' ? role : 'client');
            // OAuth redirect — page will leave
        } catch (err) {
            setError(err.message || 'Google sign-in failed.');
        }
    };

    // ── Magic sent screen ────────────────────────────────────────────────────
    if (mode === 'magic') {
        return <MagicSentScreen onBack={() => setMode('login')} />;
    }

    const isLogin = mode === 'login';

    return (
        <div
            className="flex flex-col"
            style={{ minHeight: '100dvh', background: '#FBF7F2' }}
        >
            {/* ── Top section with topo texture ── */}
            <div className="relative px-6 pt-16 pb-10 overflow-hidden">
                {/* Texture overlay */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: TOPO_SVG,
                        backgroundSize: 'cover',
                        opacity: 0.06,
                    }}
                />
                <div className="relative z-10">
                    {/* Wordmark */}
                    <span
                        className="block font-semibold mb-7 tracking-[-0.02em]"
                        style={{ fontSize: 15, color: '#C25E4A' }}
                    >
                        kliques
                    </span>
                    <h1
                        className="text-[32px] font-semibold tracking-[-0.03em] text-ink mb-2"
                        style={{ lineHeight: 1.1 }}
                    >
                        {isLogin ? 'Welcome back.' : 'Create your\naccount.'}
                    </h1>
                    <p className="text-[15px] text-muted leading-relaxed m-0">
                        {isLogin
                            ? 'Sign in to continue where you left off.'
                            : 'Join Kliques and start building lasting relationships.'}
                    </p>
                </div>
            </div>

            {/* ── Form section ── */}
            <div className="flex-1 flex flex-col px-6 pb-8">

                {/* Role toggle — signup only */}
                {!isLogin && (
                    <div className="mb-6">
                        <span
                            className="block mb-2.5 text-[11px] font-medium uppercase tracking-[0.05em]"
                            style={{ color: '#8C6A64' }}
                        >
                            I am a
                        </span>
                        <div className="flex gap-2">
                            {[
                                { id: 'client', label: 'Client' },
                                { id: 'provider', label: 'Service Provider' },
                            ].map((r) => {
                                const active = role === r.id;
                                return (
                                    <button
                                        key={r.id}
                                        onClick={() => setRole(r.id)}
                                        className="flex-1 py-3.5 rounded-[12px] text-[13px] font-medium focus:outline-none"
                                        style={{
                                            border: active ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                            background: active ? '#FDDCC6' : 'transparent',
                                            color: active ? '#C25E4A' : '#3D231E',
                                            letterSpacing: '0.02em',
                                        }}
                                    >
                                        {r.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Name — signup only */}
                {!isLogin && (
                    <Field
                        label="Full Name"
                        value={name}
                        onChange={setName}
                        placeholder="Your name"
                    />
                )}

                {/* Email */}
                <Field
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    placeholder="you@email.com"
                />

                {/* Phone — signup only */}
                {!isLogin && (
                    <Field
                        label="Phone Number"
                        value={phone}
                        onChange={setPhone}
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                    />
                )}

                {/* Hint */}
                <p
                    className="text-[12px] -mt-2 mb-6"
                    style={{ color: '#B0948F' }}
                >
                    {isLogin
                        ? "We'll send you a magic link — no password needed."
                        : "We'll email you a link to verify your account."}
                </p>

                {/* Error */}
                {error && (
                    <div
                        className="px-4 py-3 rounded-[10px] text-[13px] mb-4"
                        style={{ background: '#FDEDEA', color: '#B04040' }}
                    >
                        {error}
                    </div>
                )}

                {/* Primary CTA */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2 mb-4"
                    style={{
                        background: '#3D231E',
                        border: 'none',
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {submitting && (
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
                    {submitting
                        ? 'Sending…'
                        : isLogin ? 'Send Login Link' : 'Create Account'}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px" style={{ background: 'rgba(140,106,100,0.2)' }} />
                    <span
                        className="text-[11px] font-medium uppercase tracking-[0.05em]"
                        style={{ color: '#8C6A64' }}
                    >
                        Or continue with
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(140,106,100,0.2)' }} />
                </div>

                {/* Social buttons */}
                <div className="flex gap-2 mb-8">
                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[13px] font-medium text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>

                    {/* Apple */}
                    <button
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[12px] text-[13px] font-medium text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#3D231E">
                            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                        Apple
                    </button>
                </div>

                {/* Toggle login / signup */}
                <div className="mt-auto pt-2 text-center">
                    <button
                        onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); }}
                        className="text-[14px] focus:outline-none"
                        style={{ background: 'none', border: 'none', color: '#8C6A64' }}
                    >
                        {isLogin ? (
                            <>Don't have an account?{' '}
                                <span style={{ color: '#C25E4A', fontWeight: 500 }}>Sign up</span>
                            </>
                        ) : (
                            <>Already have an account?{' '}
                                <span style={{ color: '#C25E4A', fontWeight: 500 }}>Log in</span>
                            </>
                        )}
                    </button>
                </div>

            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default LoginPage;
