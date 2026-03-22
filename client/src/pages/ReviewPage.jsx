/**
 * ReviewPage — v6 Warm Editorial
 *
 * Route: /app/review
 * Route state: { bookingId, providerId, providerName, serviceTotal (cents) }
 *
 * Submits:
 *   POST /api/reviews  — rating + comment
 *   POST /api/tips     — tip charge via saved payment method (if tip > 0)
 */
import React, { useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import BackBtn from '../components/ui/BackBtn';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', success: '#5A8A5E', successBg: '#EBF2EC', dangerBg: '#FDEDEA' };
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const fmtCents = (cents) => `$${(cents / 100).toFixed(0)}`;

const TIP_PRESETS = ['15', '20', '25'];

// ─── Star rating ──────────────────────────────────────────────────────────────

const StarRow = ({ rating, hover, onRate, onHover, onLeave }) => (
    <div className="flex justify-center gap-2 mb-7">
        {[1, 2, 3, 4, 5].map((star) => {
            const filled = (hover || rating) >= star;
            return (
                <button
                    key={star}
                    onClick={() => onRate(star)}
                    onMouseEnter={() => onHover(star)}
                    onMouseLeave={onLeave}
                    className="p-1 focus:outline-none"
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                >
                    <svg
                        width="38"
                        height="38"
                        viewBox="0 0 24 24"
                        fill={filled ? '#C25E4A' : 'none'}
                        stroke={filled ? '#C25E4A' : 'rgba(140,106,100,0.3)'}
                        strokeWidth="1.5"
                    >
                        <path
                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            );
        })}
    </div>
);

// ─── Tip preset button ────────────────────────────────────────────────────────

const TipBtn = ({ pct, dollarsLabel, selected, onClick }) => (
    <button
        onClick={onClick}
        className="flex-1 py-3.5 rounded-[12px] text-center transition-colors focus:outline-none"
        style={{
            border: selected ? `2px solid #C25E4A` : '1px solid rgba(140,106,100,0.2)',
            background: selected ? '#FDDCC6' : 'transparent',
        }}
    >
        <p
            className="text-[16px] font-semibold m-0 mb-0.5"
            style={{ color: selected ? '#C25E4A' : '#3D231E' }}
        >
            {pct}%
        </p>
        <p className="text-[12px] m-0" style={{ color: '#8C6A64' }}>
            {dollarsLabel}
        </p>
    </button>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const ReviewPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { session } = useSession();

    const {
        bookingId,
        providerId,
        providerName = 'Your Provider',
        serviceTotal = 0, // cents — used to compute tip presets
        paymentMethodId,
        customerId,
    } = location.state || {};

    // ── Rating
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    // ── Written review
    const [reviewText, setReviewText] = useState('');

    // ── Tip
    const [tipType, setTipType] = useState(null); // "15" | "20" | "25" | "custom" | null
    const [customTip, setCustomTip] = useState('');

    // ── Submission
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Computed tip value in whole dollars (for display) and cents (for API)
    const tipDollars =
        tipType === 'custom'
            ? parseFloat(customTip) || 0
            : tipType
            ? Math.round((serviceTotal / 100) * parseInt(tipType, 10))
            : 0;
    const tipCents = tipDollars * 100;

    const initials = getInitials(providerName);
    const canSubmit = rating > 0 && !submitting;
    const { isDesktop } = useOutletContext() || {};

    const handleToggleTip = (type) => setTipType((prev) => (prev === type ? null : type));

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSubmitting(true);
        setError(null);

        try {
            // 1. Submit review
            const reviewRes = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    bookingId,
                    providerId,
                    userId: session.user?.id,
                    rating,
                    comment: reviewText.trim(),
                }),
            });

            if (!reviewRes.ok) {
                const { error: msg } = await reviewRes.json().catch(() => ({}));
                // 409 = already reviewed — treat as success, proceed to tip
                if (reviewRes.status !== 409) throw new Error(msg || 'Failed to submit review');
            }

            // 2. Charge tip (only if tip > 0 and we have payment details)
            if (tipCents > 0 && paymentMethodId && customerId) {
                const tipRes = await fetch('/api/tips', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        bookingId,
                        providerId,
                        amountCents: tipCents,
                        paymentMethodId,
                        customerId,
                    }),
                });

                if (!tipRes.ok) {
                    const { error: msg } = await tipRes.json().catch(() => ({}));
                    throw new Error(msg || 'Tip payment failed');
                }
            }

            // Done — go back to the relationship page or home
            navigate(
                providerId ? `/app/relationship/${providerId}` : '/app',
                { replace: true }
            );
        } catch (err) {
            console.error('[ReviewPage] submit error:', err);
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () =>
        navigate(providerId ? `/app/relationship/${providerId}` : '/app', { replace: true });

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 500, margin: '0 auto' }}>
                    {/* Back / title / skip */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            Back
                        </button>
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rate Your Session</span>
                        <button onClick={handleSkip} style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Skip</button>
                    </div>

                    {/* Provider avatar + heading */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 600, color: T.ink, fontFamily: F, marginBottom: 12 }}>{initials}</div>
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 4px', textAlign: 'center' }}>How was your session with</p>
                        <p style={{ fontFamily: F, fontSize: 22, fontWeight: 600, color: T.ink, letterSpacing: '-0.02em', margin: 0, textAlign: 'center' }}>{providerName}?</p>
                    </div>

                    {/* Stars */}
                    <StarRow rating={rating} hover={hover} onRate={setRating} onHover={setHover} onLeave={() => setHover(0)} />

                    {/* Post-rating content */}
                    {rating > 0 && (
                        <>
                            <div style={{ marginBottom: 24 }}>
                                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Tell us more (optional)</span>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    placeholder="What made this session great? Or what could be improved?"
                                    rows={3}
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 13, color: T.ink, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ height: 1, background: T.line, marginBottom: 20 }} />

                            {/* Tip section */}
                            <div style={{ marginBottom: 24 }}>
                                <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Add a Tip</span>
                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '0 0 14px' }}>100% of your tip goes directly to {providerName.split(' ')[0]}.</p>

                                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                                    {TIP_PRESETS.map((pct) => {
                                        const dollars = serviceTotal ? Math.round((serviceTotal / 100) * parseInt(pct, 10)) : null;
                                        const sel = tipType === pct;
                                        return (
                                            <button key={pct} onClick={() => handleToggleTip(pct)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: sel ? `2px solid ${T.accent}` : `1px solid ${T.line}`, background: sel ? T.hero : 'transparent', cursor: 'pointer', textAlign: 'center' }}>
                                                <p style={{ fontFamily: F, fontSize: 16, fontWeight: 600, color: sel ? T.accent : T.ink, margin: '0 0 2px' }}>{pct}%</p>
                                                <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: 0 }}>{dollars != null ? `$${dollars}` : '—'}</p>
                                            </button>
                                        );
                                    })}
                                    <button onClick={() => handleToggleTip('custom')} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, border: tipType === 'custom' ? `2px solid ${T.accent}` : `1px solid ${T.line}`, background: tipType === 'custom' ? T.hero : 'transparent', cursor: 'pointer' }}>
                                        <p style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: tipType === 'custom' ? T.accent : T.ink, margin: 0, textAlign: 'center' }}>Custom</p>
                                    </button>
                                </div>

                                {tipType === 'custom' && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontFamily: F, fontSize: 16, color: T.muted }}>$</span>
                                        <input type="number" min="1" value={customTip} onChange={(e) => setCustomTip(e.target.value)} placeholder="0" style={{ width: 96, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 16, color: T.ink, outline: 'none' }} />
                                    </div>
                                )}

                                {tipDollars > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#FFF5E6', marginBottom: 4 }}>
                                        <span style={{ fontFamily: F, fontSize: 14, color: '#92400E' }}>Tip amount</span>
                                        <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: '#92400E' }}>${tipDollars}</span>
                                    </div>
                                )}

                                <button onClick={() => setTipType(null)} style={{ width: '100%', padding: '10px', textAlign: 'center', fontFamily: F, fontSize: 13, color: T.faded, background: 'none', border: 'none', cursor: 'pointer' }}>No tip this time</button>
                            </div>
                        </>
                    )}

                    {error && <p style={{ fontFamily: F, fontSize: 13, color: '#B04040', textAlign: 'center', marginBottom: 12 }}>{error}</p>}

                    <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: '100%', padding: '14px', borderRadius: 9999, background: canSubmit ? T.ink : T.faded, border: 'none', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#fff', cursor: canSubmit ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {submitting ? <><span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent' }} />Submitting…</> : tipDollars > 0 ? `Submit Review & Pay $${tipDollars} Tip` : 'Submit Review'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-base">
            {/* ── Header row: back / title / skip */}
            <div className="flex items-center justify-between px-5 pt-8 pb-4">
                <BackBtn onClick={() => navigate(-1)} />
                <Lbl color="text-ink" className="text-[13px] font-medium normal-case tracking-normal">
                    Rate Your Session
                </Lbl>
                <button
                    onClick={handleSkip}
                    className="text-[13px] font-semibold text-accent focus:outline-none"
                >
                    Skip
                </button>
            </div>

            {/* ── Body */}
            <div className="px-5 flex-1 flex flex-col">
                {/* Provider avatar + heading */}
                <div className="flex flex-col items-center mb-7">
                    <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-semibold text-ink mb-3"
                        style={{ background: '#FDDCC6' }}
                    >
                        {initials}
                    </div>
                    <p className="text-[16px] text-muted m-0 text-center">How was your session with</p>
                    <p className="text-[22px] font-semibold text-ink tracking-[-0.02em] m-0 text-center">
                        {providerName}?
                    </p>
                </div>

                {/* Stars */}
                <StarRow
                    rating={rating}
                    hover={hover}
                    onRate={setRating}
                    onHover={setHover}
                    onLeave={() => setHover(0)}
                />

                {/* Shown after rating */}
                {rating > 0 && (
                    <>
                        {/* Written review */}
                        <Lbl className="block mb-2">Tell us more (optional)</Lbl>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="What made this session great? Or what could be improved?"
                            rows={3}
                            className="w-full px-4 py-3.5 rounded-[12px] text-[13px] text-ink resize-y focus:outline-none mb-7"
                            style={{
                                border: '1px solid rgba(140,106,100,0.2)',
                                background: '#F2EBE5',
                                fontFamily: 'inherit',
                            }}
                        />

                        <Divider />

                        {/* Tip section */}
                        <div className="py-5">
                            <Lbl className="block mb-1">Add a Tip</Lbl>
                            <p className="text-[13px] text-muted leading-relaxed mt-0.5 mb-4">
                                100% of your tip goes directly to {providerName.split(' ')[0]}.
                            </p>

                            {/* Preset buttons */}
                            <div className="flex gap-2 mb-3">
                                {TIP_PRESETS.map((pct) => {
                                    const dollars = serviceTotal
                                        ? Math.round((serviceTotal / 100) * parseInt(pct, 10))
                                        : null;
                                    return (
                                        <TipBtn
                                            key={pct}
                                            pct={pct}
                                            dollarsLabel={dollars != null ? `$${dollars}` : '—'}
                                            selected={tipType === pct}
                                            onClick={() => handleToggleTip(pct)}
                                        />
                                    );
                                })}

                                {/* Custom */}
                                <button
                                    onClick={() => handleToggleTip('custom')}
                                    className="flex-1 py-3.5 rounded-[12px] text-center transition-colors focus:outline-none"
                                    style={{
                                        border: tipType === 'custom' ? '2px solid #C25E4A' : '1px solid rgba(140,106,100,0.2)',
                                        background: tipType === 'custom' ? '#FDDCC6' : 'transparent',
                                    }}
                                >
                                    <p
                                        className="text-[14px] font-semibold m-0"
                                        style={{ color: tipType === 'custom' ? '#C25E4A' : '#3D231E' }}
                                    >
                                        Custom
                                    </p>
                                </button>
                            </div>

                            {/* Custom input */}
                            {tipType === 'custom' && (
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-[16px] text-muted">$</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={customTip}
                                        onChange={(e) => setCustomTip(e.target.value)}
                                        placeholder="0"
                                        className="w-24 px-4 py-3 rounded-[12px] text-[16px] text-ink focus:outline-none"
                                        style={{
                                            border: '1px solid rgba(140,106,100,0.2)',
                                            background: '#F2EBE5',
                                            fontFamily: 'inherit',
                                        }}
                                    />
                                </div>
                            )}

                            {/* Tip summary callout */}
                            {tipDollars > 0 && (
                                <div className="flex justify-between px-4 py-3 rounded-[10px] mb-1" style={{ background: '#FFF5E6' }}>
                                    <span className="text-[14px]" style={{ color: '#92400E' }}>Tip amount</span>
                                    <span className="text-[14px] font-semibold" style={{ color: '#92400E' }}>
                                        ${tipDollars}
                                    </span>
                                </div>
                            )}

                            {/* No tip link */}
                            <button
                                onClick={() => setTipType(null)}
                                className="w-full py-3 text-center text-[13px] text-faded focus:outline-none"
                            >
                                No tip this time
                            </button>
                        </div>
                    </>
                )}

                {/* Error */}
                {error && (
                    <p className="text-[13px] text-center mb-3" style={{ color: '#B04040' }}>
                        {error}
                    </p>
                )}

                {/* Submit */}
                <div className="mt-auto pb-8">
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="w-full py-4 rounded-pill text-white text-[14px] font-semibold transition-opacity focus:outline-none"
                        style={{
                            background: canSubmit ? '#3D231E' : '#B0948F',
                            cursor: canSubmit ? 'pointer' : 'default',
                        }}
                    >
                        {submitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Submitting…
                            </span>
                        ) : tipDollars > 0 ? (
                            `Submit Review & Pay $${tipDollars} Tip`
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ReviewPage;
