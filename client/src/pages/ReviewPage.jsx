/**
 * ReviewPage — Full 4-step review + tip flow
 *
 * Route: /app/review/:bookingId
 * Steps: rate → tip → thank-you (done)
 *
 * Navigation back: notifications page  (from notification tap)
 *                  bookings page        (from "Leave a review →" link)
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { formatMoney } from '../utils/formatMoney';
import BackBtn from '../components/ui/BackBtn';
import Divider from '../components/ui/Divider';
import Lbl from '../components/ui/Lbl';
import Footer from '../components/ui/Footer';

// ─── Design tokens ──────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    accent: '#C25E4A', line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5',
    success: '#5A8A5E', successBg: '#EBF2EC',
    callout: '#FFF5E6', calloutText: '#92400E',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ────────────────────────────────────────────────────────────────
const getInitials = (name) =>
    (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const fmtCents = (cents, currency = 'cad') => (cents == null ? '—' : formatMoney(cents, currency));

function fmtDateTime(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const STAR_LABELS = ['', 'Not great', 'Could be better', 'Good session', 'Great session', 'Amazing!'];

// ─── Sub-components ──────────────────────────────────────────────────────────

const StarRow = ({ rating, onRate }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => {
            const filled = rating >= star;
            return (
                <button
                    key={star}
                    onClick={() => onRate(star)}
                    style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform .15s' }}
                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill={filled ? T.accent : 'none'} stroke={filled ? T.accent : T.faded} strokeWidth="1.5">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            );
        })}
    </div>
);

const StarDisplay = ({ rating, size = 20 }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= rating ? T.accent : 'none'} stroke={s <= rating ? T.accent : T.faded} strokeWidth="1.5">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ))}
    </div>
);

const ProviderInfo = ({ name, serviceName, date, price, currency, avatarSize = 56 }) => {
    const initials = getInitials(name);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <div style={{ width: avatarSize, height: avatarSize, borderRadius: '50%', background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: avatarSize * 0.32, fontWeight: 500, color: T.muted, flexShrink: 0, fontFamily: F }}>
                {initials}
            </div>
            <div>
                <p style={{ fontFamily: F, fontSize: 18, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 3px', color: T.ink }}>{name}</p>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>
                    {serviceName}{date ? ` · ${date}` : ''}{price ? ` · ${fmtCents(price, currency)}` : ''}
                </p>
            </div>
        </div>
    );
};

const SubmitBtn = ({ onClick, disabled, loading, label }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: disabled ? T.faded : T.ink,
            color: '#fff', fontFamily: F, fontSize: 14, fontWeight: 500,
            border: 'none', cursor: disabled ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, transition: 'opacity .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
    >
        {loading && (
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        )}
        {label}
    </button>
);

// ─── Step 1: Leave a Review ──────────────────────────────────────────────────
const ReviewStep = ({ booking, rating, onRate, reviewText, onTextChange, onContinue, onBack, existingReview }) => {
    const serviceName = booking?.service_name || 'your service';
    const providerName = booking?.provider_name || 'Provider';
    const price = booking?.price;
    const duration = booking?.duration_minutes;
    const date = booking?.scheduled_at;
    const charCount = reviewText?.length || 0;
    if (existingReview) {
        return (
            <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <ProviderInfo name={providerName} serviceName={serviceName} date={fmtDateTime(date)} currency={booking?.currency} />
                <Divider />
                <div style={{ padding: '28px 0', textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                        <svg width="20" height="20" fill="none" stroke={T.success} strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T.ink, margin: '0 0 8px' }}>You've already reviewed this session</p>
                    <StarDisplay rating={existingReview.rating} />
                    {existingReview.comment && (
                        <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '16px 0 0', lineHeight: 1.6, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
                            "{existingReview.comment}"
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <ProviderInfo name={providerName} serviceName={serviceName} date={fmtDateTime(date)} currency={booking?.currency} />

            {/* Session summary card */}
            <div style={{ padding: 16, background: T.avatarBg, borderRadius: 14, marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.ink }}>{serviceName}</span>
                    {price && <span style={{ fontFamily: F, fontSize: 14, fontWeight: 500, color: T.accent }}>{fmtCents(price, booking?.currency)}</span>}
                </div>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>
                    {duration ? `${duration} min` : ''}{duration && date ? ' · ' : ''}{date ? `${fmtDateTime(date)} · ${fmtTime(date)}` : ''}
                </p>
            </div>

            <Divider />

            {/* Star rating */}
            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: 16, fontWeight: 400, margin: '0 0 16px', color: T.ink }}>How was your session?</p>
                <StarRow rating={rating} onRate={onRate} />
                <p style={{ fontFamily: F, fontSize: 13, color: T.faded, margin: '12px 0 0', minHeight: 18 }}>
                    {rating > 0 ? STAR_LABELS[rating] : 'Tap a star to rate'}
                </p>
            </div>

            <Divider />

            {/* Written review */}
            <div style={{ padding: '24px 0' }}>
                <Lbl style={{ display: 'block', marginBottom: 8 }}>Write a review (optional)</Lbl>
                <div style={{ position: 'relative' }}>
                    <textarea
                        value={reviewText}
                        onChange={(e) => onTextChange(e.target.value.slice(0, 500))}
                        placeholder={`What stood out? How did ${providerName} help you?`}
                        rows={4}
                        style={{
                            width: '100%', padding: '14px 16px', borderRadius: 12, boxSizing: 'border-box',
                            border: `1px solid ${T.line}`, background: T.avatarBg,
                            fontFamily: F, fontSize: 13, color: T.ink, resize: 'vertical', outline: 'none',
                        }}
                    />
                </div>
                <p style={{ fontFamily: F, fontSize: 11, color: T.faded, margin: '6px 0 0', textAlign: 'right' }}>
                    {charCount}/500
                </p>
            </div>

            <div style={{ marginTop: 'auto', paddingBottom: 28 }}>
                <SubmitBtn
                    onClick={onContinue}
                    disabled={rating === 0}
                    label="Continue"
                />
            </div>
        </div>
    );
};

// ─── Step 2: Add a Tip ───────────────────────────────────────────────────────
const TipStep = ({ booking, tipType, onSelectTip, customTip, onCustomTip, onBack, onSubmit, submitting, submitError }) => {
    const providerName = booking?.provider_name || 'Provider';
    const serviceName = booking?.service_name || 'session';
    const priceInCents = booking?.price || 0;
    const baseDollars = priceInCents / 100;
    const presets = [
        { pct: 15, amt: Math.round(baseDollars * 0.15) },
        { pct: 20, amt: Math.round(baseDollars * 0.20) },
        { pct: 25, amt: Math.round(baseDollars * 0.25) },
    ];

    const tipDollars = tipType === 'custom'
        ? (parseFloat(customTip) || 0)
        : tipType
        ? (presets.find((p) => p.pct === tipType)?.amt || 0)
        : 0;

    const totalDollars = baseDollars + tipDollars;

    return (
        <div style={{ padding: '0 24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Provider mini info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: T.hero, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500, color: T.muted, flexShrink: 0, fontFamily: F }}>
                    {getInitials(providerName)}
                </div>
                <div>
                    <p style={{ fontFamily: F, fontSize: 16, fontWeight: 400, margin: '0 0 2px', color: T.ink }}>{providerName}</p>
                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>
                        {serviceName}{priceInCents ? ` · ${fmtCents(priceInCents, booking?.currency)}` : ''}
                    </p>
                </div>
            </div>

            <Divider />

            <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: 16, fontWeight: 400, margin: '0 0 6px', color: T.ink }}>Would you like to leave a tip?</p>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '0 0 24px' }}>
                    Tips go directly to {providerName} — Kliques takes nothing.
                </p>

                {/* Preset tip buttons */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {presets.map((p) => {
                        const sel = tipType === p.pct;
                        return (
                            <button
                                key={p.pct}
                                onClick={() => onSelectTip(sel ? null : p.pct)}
                                style={{
                                    flex: 1, padding: '16px 8px', borderRadius: 14, textAlign: 'center',
                                    border: sel ? `2px solid ${T.accent}` : `1px solid ${T.line}`,
                                    background: sel ? T.hero : 'transparent',
                                    cursor: 'pointer',
                                }}
                            >
                                <span style={{ fontFamily: F, fontSize: 20, fontWeight: 400, letterSpacing: '-0.03em', color: sel ? T.accent : T.ink, display: 'block', marginBottom: 2 }}>
                                    ${p.amt}
                                </span>
                                <span style={{ fontFamily: F, fontSize: 11, color: sel ? T.accent : T.faded }}>{p.pct}%</span>
                            </button>
                        );
                    })}
                </div>

                {/* Custom tip */}
                <div style={{ marginBottom: 16 }}>
                    <button
                        onClick={() => onSelectTip(tipType === 'custom' ? null : 'custom')}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 14,
                            border: tipType === 'custom' ? `2px solid ${T.accent}` : `1px solid ${T.line}`,
                            background: tipType === 'custom' ? T.hero : 'transparent',
                            fontFamily: F, fontSize: 13, fontWeight: 500,
                            color: tipType === 'custom' ? T.accent : T.ink,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            cursor: 'pointer',
                        }}
                    >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                        </svg>
                        Custom amount
                    </button>
                </div>

                {tipType === 'custom' && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: F, fontSize: 16, color: T.muted }}>$</span>
                            <input
                                id="customTipInput"
                                type="number"
                                min="1"
                                value={customTip}
                                onChange={(e) => onCustomTip(e.target.value)}
                                placeholder="0"
                                style={{
                                    width: '100%', padding: '14px 16px 14px 32px', boxSizing: 'border-box',
                                    borderRadius: 12, border: `1px solid ${T.line}`,
                                    fontFamily: F, fontSize: 16, color: T.ink, outline: 'none',
                                    background: T.avatarBg,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* No tip link */}
                <button
                    onClick={() => { onSelectTip(null); onCustomTip(''); }}
                    style={{ fontFamily: F, fontSize: 13, color: T.faded, background: 'none', border: 'none', cursor: 'pointer', padding: '8px', marginBottom: 8 }}
                >
                    No tip this time
                </button>
            </div>

            <Divider />

            {/* Total row */}
            <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: F, fontSize: 14, color: T.muted }}>Session total + tip</span>
                <span style={{ fontFamily: F, fontSize: 22, fontWeight: 400, letterSpacing: '-0.03em', color: T.accent }}>
                    ${totalDollars.toFixed(0)}
                </span>
            </div>

            {submitError && (
                <p style={{ fontFamily: F, fontSize: 13, color: '#B04040', textAlign: 'center', marginBottom: 12 }}>
                    {submitError}
                </p>
            )}

            <div style={{ marginTop: 'auto', paddingBottom: 28 }}>
                <SubmitBtn
                    onClick={onSubmit}
                    loading={submitting}
                    label={tipDollars > 0 ? 'Submit Review & Tip' : 'Submit Review'}
                />
            </div>
        </div>
    );
};

// ─── Step 3: Thank You ───────────────────────────────────────────────────────
const DoneStep = ({ rating, tipDollars, providerName, providerHandle, onBookAgain }) => {
    const navigate = useNavigate();
    const hasTip = tipDollars > 0;
    const displayName = providerName || 'Provider';

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            flex: 1, padding: 24, textAlign: 'center', position: 'relative', overflow: 'hidden',
        }}>
            {/* Confetti */}
            <style>{`
                @keyframes conf1{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(-60px,-120px) rotate(200deg);opacity:0}}
                @keyframes conf2{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(40px,-100px) rotate(-150deg);opacity:0}}
                @keyframes conf3{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(70px,-80px) rotate(180deg);opacity:0}}
                @keyframes conf4{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(-30px,-140px) rotate(-200deg);opacity:0}}
                @keyframes popIn{0%{transform:scale(0)}100%{transform:scale(1)}}
                @keyframes spin{to{transform:rotate(360deg)}}
            `}</style>
            <div style={{ position: 'absolute', top: '40%', left: '50%', pointerEvents: 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.accent, position: 'absolute', animation: 'conf1 .8s ease .2s both' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.hero, position: 'absolute', animation: 'conf2 .8s ease .3s both' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.success, position: 'absolute', animation: 'conf3 .8s ease .25s both' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.callout, position: 'absolute', animation: 'conf4 .8s ease .35s both' }} />
                <div style={{ width: 8, height: 8, borderRadius: 2, background: T.accent, position: 'absolute', left: -20, animation: 'conf3 .8s ease .15s both' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, position: 'absolute', left: 30, animation: 'conf1 .8s ease .4s both' }} />
            </div>

            {/* Success icon */}
            <div style={{ width: 80, height: 80, borderRadius: 24, background: T.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, animation: 'popIn .3s cubic-bezier(.34,1.56,.64,1) both' }}>
                <svg width="36" height="36" fill="none" stroke={T.success} strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h1 style={{ fontFamily: F, fontSize: 24, fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 10px', color: T.ink }}>Thank you!</h1>
            <p style={{ fontFamily: F, fontSize: 15, color: T.muted, margin: '0 0 8px', lineHeight: 1.6, maxWidth: 300 }}>
                Your review has been submitted{hasTip ? ` and your tip has been sent to ${displayName}.` : ` for ${providerName}.`}
            </p>

            {/* Stars display */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, margin: '20px 0' }}>
                <StarDisplay rating={rating} />
            </div>

            {/* Tip callout */}
            {hasTip && (
                <div style={{ padding: '12px 20px', background: T.callout, borderRadius: 12, marginBottom: 28 }}>
                    <p style={{ fontFamily: F, fontSize: 14, color: T.calloutText, margin: 0, fontWeight: 500 }}>
                        Tip: ${tipDollars}
                    </p>
                </div>
            )}

            <div style={{ width: '100%', maxWidth: 300 }}>
                <button
                    onClick={() => navigate('/app')}
                    style={{ width: '100%', padding: '14px', borderRadius: 12, background: T.ink, border: 'none', fontFamily: F, fontSize: 14, fontWeight: 500, color: '#fff', cursor: 'pointer', marginBottom: 10 }}
                >
                    Back to My Kliques
                </button>
                {providerHandle && (
                    <button
                        onClick={onBookAgain}
                        style={{ width: '100%', padding: '13px', borderRadius: 12, background: 'transparent', border: `1px solid ${T.line}`, fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, cursor: 'pointer' }}
                    >
                        Book Again with {displayName}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Page header ─────────────────────────────────────────────────────────────
const PageHeader = ({ title, onBack, showBack = true }) => (
    <header style={{ padding: '32px 24px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
        {showBack ? (
            <BackBtn onClick={onBack} />
        ) : (
            <div style={{ width: 38 }} />
        )}
        <span style={{ fontFamily: F, fontSize: 13, fontWeight: 500, color: T.ink, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            {title}
        </span>
    </header>
);

// ─── Page ────────────────────────────────────────────────────────────────────
const ReviewPage = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { session } = useSession();
    const { isDesktop } = useOutletContext() || {};

    // Fetch booking info
    const [booking, setBooking] = useState(null);
    const [bookingLoading, setBookingLoading] = useState(true);
    const [bookingError, setBookingError] = useState(null);
    const [existingReview, setExistingReview] = useState(null);

    // Step: 'review' | 'tip' | 'done'
    const [step, setStep] = useState('review');

    // Review state
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');

    // Tip state
    const [tipType, setTipType] = useState(null); // null | 15 | 20 | 25 | 'custom'
    const [customTip, setCustomTip] = useState('');

    // Submission
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    // Computed tip
    const priceInCents = booking?.price || 0;
    const baseDollars = priceInCents / 100;

    const tipDollars = tipType === 'custom'
        ? (parseFloat(customTip) || 0)
        : tipType
        ? Math.round(baseDollars * (parseInt(tipType, 10) / 100))
        : 0;
    const tipCents = Math.round(tipDollars * 100);

    useEffect(() => {
        if (!bookingId || !session?.accessToken) {
            setBookingLoading(false);
            return;
        }
        const load = async () => {
            setBookingLoading(true);
            try {
                const data = await request(`/bookings/${bookingId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });
                setBooking(data.booking || data);

                // Check for existing review
                if (data.booking?.reviewed_at || data.reviewed_at) {
                    // Try to fetch existing review
                    try {
                        const rev = await request(`/reviews/booking/${bookingId}`, {
                            headers: { Authorization: `Bearer ${session.accessToken}` },
                        });
                        if (rev?.review) setExistingReview(rev.review);
                    } catch (_) {
                        // If endpoint doesn't exist yet, we just won't show the existing review content
                        setExistingReview({ rating: 5, comment: null });
                    }
                }
            } catch (err) {
                if (err.status === 404) {
                    setBookingError('Booking not found.');
                } else if (err.status === 403) {
                    setBookingError('You don\'t have access to this booking.');
                } else {
                    setBookingError('Could not load booking details.');
                }
            } finally {
                setBookingLoading(false);
            }
        };
        load();
    }, [bookingId, session]);

    const handleContinueToTip = () => setStep('tip');

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        setSubmitError(null);

        try {
            const userId = session?.user?.id;
            const providerId = booking?.provider_id;

            const res = await fetch(`${process.env.REACT_APP_API_BASE || '/api'}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId,
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify({
                    bookingId,
                    providerId,
                    userId,
                    rating,
                    comment: reviewText.trim(),
                    tip_amount: tipCents > 0 ? tipCents : null,
                }),
            });

            const payload = await res.json().catch(() => ({}));

            if (!res.ok && res.status !== 409) {
                throw new Error(payload?.error || 'Failed to submit review');
            }

            // If tip error was returned separately (review succeeded but tip failed)
            if (payload.tip_error) {
                setSubmitError(payload.tip_error);
            }

            setStep('done');
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBack = () => {
        if (step === 'tip') {
            setStep('review');
        } else {
            navigate(-1);
        }
    };

    // ── Loading ──
    if (bookingLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FBF7F2', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${T.accent}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
        );
    }

    // ── Booking error ──
    if (bookingError) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FBF7F2', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
                <p style={{ fontFamily: F, fontSize: 16, color: T.ink, marginBottom: 8 }}>{bookingError}</p>
                <button onClick={() => navigate(-1)} style={{ fontFamily: F, fontSize: 14, color: T.accent, background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button>
            </div>
        );
    }

    const headerTitle = step === 'review' ? 'Leave a Review' : step === 'tip' ? 'Add a Tip' : '';
    const showHeader = step !== 'done';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FBF7F2', fontFamily: F }}>
            <style>{`
                @keyframes popIn{0%{transform:scale(0)}100%{transform:scale(1)}}
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes conf1{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(-60px,-120px) rotate(200deg);opacity:0}}
                @keyframes conf2{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(40px,-100px) rotate(-150deg);opacity:0}}
                @keyframes conf3{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(70px,-80px) rotate(180deg);opacity:0}}
                @keyframes conf4{0%{transform:translate(0,0) rotate(0);opacity:1}100%{transform:translate(-30px,-140px) rotate(-200deg);opacity:0}}
            `}</style>

            {showHeader && <PageHeader title={headerTitle} onBack={handleBack} />}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {step === 'review' && (
                    <ReviewStep
                        booking={booking}
                        rating={rating}
                        onRate={setRating}
                        reviewText={reviewText}
                        onTextChange={setReviewText}
                        onContinue={handleContinueToTip}
                        onBack={handleBack}
                        existingReview={existingReview}
                    />
                )}
                {step === 'tip' && (
                    <TipStep
                        booking={booking}
                        tipType={tipType}
                        onSelectTip={setTipType}
                        customTip={customTip}
                        onCustomTip={setCustomTip}
                        onBack={() => setStep('review')}
                        onSubmit={handleSubmit}
                        submitting={submitting}
                        submitError={submitError}
                    />
                )}
                {step === 'done' && (
                    <DoneStep
                        rating={rating}
                        tipDollars={tipDollars}
                        providerName={booking?.provider_name || 'Provider'}
                        providerHandle={booking?.provider_handle}
                        onBookAgain={() => navigate(`/book/${booking?.provider_handle || booking?.provider_id}`)}
                    />
                )}
            </div>

            {step !== 'done' && <Footer />}
        </div>
    );
};

export default ReviewPage;
