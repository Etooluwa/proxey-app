/**
 * ClientBookingDetail — /app/bookings/:id
 * Client's view of a booking: session info, payment, intake responses,
 * provider notes/recommendations, session photos, and cancel/reschedule actions.
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { request } from '../data/apiClient';
import { useSession } from '../auth/authContext';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Strip timezone suffix so the stored local time is never shifted
function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(iso.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

function fmtDate(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
}

function fmtPrice(cents) {
    if (!cents && cents !== 0) return null;
    return `$${Math.round(cents / 100)}`;
}

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Reason Modal ─────────────────────────────────────────────────────────────

const ReasonModal = ({ title, placeholder, onConfirm, onCancel, loading }) => {
    const [reason, setReason] = useState('');
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onCancel}
        >
            <div
                className="w-full max-w-lg rounded-t-[24px] px-5 pt-6 pb-8"
                style={{ background: '#FBF7F2', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[18px] font-semibold text-ink tracking-[-0.02em] m-0 mb-4">{title}</p>
                <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={placeholder}
                    rows={3}
                    className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none mb-5"
                    style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                    >
                        Go back
                    </button>
                    <button
                        onClick={() => onConfirm(reason)}
                        disabled={loading}
                        className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: '#3D231E', border: 'none', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Please wait…' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Reschedule Modal ─────────────────────────────────────────────────────────

const RescheduleModal = ({ onConfirm, onCancel, loading }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const canSubmit = date && time;
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={onCancel}
        >
            <div
                className="w-full max-w-lg rounded-t-[24px] px-5 pt-6 pb-8"
                style={{ background: '#FBF7F2', paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }}
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[18px] font-semibold text-ink tracking-[-0.02em] m-0 mb-4">Reschedule Booking</p>
                <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1.5">New Date</p>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-[14px] text-ink focus:outline-none"
                            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1.5">New Time</p>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full text-[14px] text-ink focus:outline-none"
                            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rescheduling (optional)…"
                    rows={2}
                    className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none mb-5"
                    style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                    >
                        Go back
                    </button>
                    <button
                        onClick={() => onConfirm({ new_date: date, new_time: time, reason })}
                        disabled={!canSubmit || loading}
                        className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: '#3D231E', border: 'none', opacity: (!canSubmit || loading) ? 0.5 : 1 }}
                    >
                        {loading ? 'Please wait…' : 'Confirm Reschedule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Retry Payment Sheet ──────────────────────────────────────────────────────

const R = {
    ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F',
    accent: '#C25E4A', line: 'rgba(140,106,100,0.18)',
    abg: '#F2EBE5', base: '#FBF7F2',
    danger: '#B04040',
};
const F = "'Sora',system-ui,sans-serif";

const elementStyle = {
    style: {
        base: { fontSize: '15px', color: R.ink, fontFamily: F, '::placeholder': { color: R.faded } },
        invalid: { color: R.danger },
    },
};

const BRAND_LABELS = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' };
function CardBrand({ brand }) {
    const label = BRAND_LABELS[brand?.toLowerCase()] || (brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : '••');
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: R.abg, borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600, color: R.muted, letterSpacing: '0.03em', border: `1px solid ${R.line}`, flexShrink: 0 }}>
            {label}
        </span>
    );
}

function RetryInnerForm({ bookingId, savedCards, onSuccess, onClose }) {
    const stripe = useStripe();
    const elements = useElements();
    const [selectedId, setSelectedId] = useState(savedCards[0]?.id || null);
    const [showNew, setShowNew] = useState(savedCards.length === 0);
    const [processing, setProcessing] = useState(false);
    const [err, setErr] = useState(null);

    const handleRetry = async () => {
        if (processing) return;
        setProcessing(true);
        setErr(null);
        try {
            const body = {};
            if (!showNew && selectedId) body.payment_method_id = selectedId;

            const data = await request(`/bookings/${bookingId}/retry-payment`, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            if (data.ok) { onSuccess(); return; }

            if (data.requires_action && data.client_secret) {
                let result;
                if (showNew) {
                    result = await stripe.confirmCardPayment(data.client_secret, {
                        payment_method: { card: elements.getElement(CardNumberElement) },
                    });
                } else {
                    result = await stripe.confirmCardPayment(data.client_secret, {
                        payment_method: selectedId,
                    });
                }
                if (result.error) { setErr(result.error.message); return; }
                await request(`/bookings/${bookingId}/retry-payment`, {
                    method: 'POST',
                    body: JSON.stringify({ payment_intent_id: result.paymentIntent.id }),
                });
                onSuccess();
            }
        } catch (e) {
            setErr(e.message || 'Payment failed. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div style={{ fontFamily: F }}>
            {savedCards.length > 0 && !showNew && (
                <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: R.muted, margin: '0 0 10px' }}>Saved cards</p>
                    {savedCards.map(card => (
                        <button key={card.id} type="button" onClick={() => setSelectedId(card.id)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, marginBottom: 8, border: `1.5px solid ${selectedId === card.id ? R.accent : R.line}`, background: selectedId === card.id ? '#FFF5EE' : R.abg, cursor: 'pointer', textAlign: 'left' }}>
                            <span style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${selectedId === card.id ? R.accent : R.faded}`, background: selectedId === card.id ? R.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {selectedId === card.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                            </span>
                            <CardBrand brand={card.brand} />
                            <span style={{ fontSize: 14, color: R.ink, flex: 1 }}>•••• {card.last4}</span>
                            <span style={{ fontSize: 12, color: R.faded }}>{card.expMonth}/{String(card.expYear).slice(-2)}</span>
                            {card.isDefault && (
                                <span style={{ fontSize: 10, fontWeight: 600, color: '#5A8A5E', background: '#EBF2EC', padding: '2px 7px', borderRadius: 9999, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Default</span>
                            )}
                        </button>
                    ))}
                    <button type="button" onClick={() => { setShowNew(true); setSelectedId(null); }}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px dashed ${R.line}`, background: 'transparent', fontFamily: F, fontSize: 13, color: R.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" stroke={R.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                        Use a different card
                    </button>
                </div>
            )}

            {showNew && (
                <div style={{ marginBottom: 16 }}>
                    {savedCards.length > 0 && (
                        <button type="button" onClick={() => { setShowNew(false); setSelectedId(savedCards[0].id); }}
                            style={{ fontSize: 13, color: R.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 12, fontFamily: F }}>
                            ← Use a saved card
                        </button>
                    )}
                    <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: R.muted, margin: '0 0 6px' }}>Card number</p>
                    <div style={{ padding: '13px 16px', borderRadius: 12, border: `1px solid ${R.line}`, background: R.abg, marginBottom: 12 }}>
                        <CardNumberElement options={elementStyle} />
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: `1px solid ${R.line}`, background: R.abg }}>
                            <CardExpiryElement options={elementStyle} />
                        </div>
                        <div style={{ flex: 1, padding: '13px 16px', borderRadius: 12, border: `1px solid ${R.line}`, background: R.abg }}>
                            <CardCvcElement options={elementStyle} />
                        </div>
                    </div>
                </div>
            )}

            {err && <p style={{ fontSize: 13, color: R.danger, margin: '0 0 12px' }}>{err}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 12, border: `1px solid rgba(140,106,100,0.35)`, background: 'transparent', fontFamily: F, fontSize: 14, fontWeight: 600, color: R.ink, cursor: 'pointer' }}>
                    Cancel
                </button>
                <button onClick={handleRetry} disabled={processing}
                    style={{ flex: 2, padding: '14px', borderRadius: 12, border: 'none', background: R.ink, fontFamily: F, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', opacity: processing ? 0.7 : 1 }}>
                    {processing ? 'Processing…' : 'Pay now'}
                </button>
            </div>
        </div>
    );
}

function RetryPaymentSheet({ bookingId, onSuccess, onClose }) {
    const [savedCards, setSavedCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        request('/payments/methods')
            .then(d => setSavedCards(d?.paymentMethods || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
            <div className="w-full max-w-lg rounded-t-[24px] px-5 pt-6" style={{ background: R.base, paddingBottom: 'calc(32px + env(safe-area-inset-bottom))' }} onClick={e => e.stopPropagation()}>
                <p className="text-[18px] font-semibold text-ink tracking-[-0.02em] m-0 mb-1" style={{ fontFamily: F }}>Retry payment</p>
                <p style={{ fontSize: 13, color: R.muted, margin: '0 0 16px', fontFamily: F }}>Use your saved card or enter a new one.</p>
                {loading ? (
                    <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `2px solid ${R.accent}`, borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                    </div>
                ) : (
                    <Elements stripe={stripePromise}>
                        <RetryInnerForm bookingId={bookingId} savedCards={savedCards} onSuccess={onSuccess} onClose={onClose} />
                    </Elements>
                )}
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ClientBookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { session } = useSession();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showRetrySheet, setShowRetrySheet] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/bookings/${id}`);
            setBooking(data.booking || null);
        } catch (err) {
            console.error('[ClientBookingDetail] load error:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleCancel = async (reason) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await request(`/bookings/${id}/cancel`, {
                method: 'PATCH',
                body: JSON.stringify({ reason }),
            });
            setShowCancelModal(false);
            load();
        } catch (err) {
            setActionError(err.message || 'Could not cancel. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReschedule = async ({ new_date, new_time, reason }) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await request(`/bookings/${id}/reschedule`, {
                method: 'PATCH',
                body: JSON.stringify({ new_date, new_time, reason }),
            });
            setShowRescheduleModal(false);
            load();
        } catch (err) {
            setActionError(err.message || 'Could not reschedule. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base">
                <div className="flex items-center px-5 pt-10 pb-2">
                    <BackBtn onClick={() => navigate(-1)} />
                </div>
                <div className="px-5 flex flex-col gap-5 pt-4">
                    <div className="flex items-center gap-4">
                        <Shimmer className="w-14 h-14 rounded-full" />
                        <div className="flex-1">
                            <Shimmer className="h-5 w-40 mb-2" />
                            <Shimmer className="h-3.5 w-28" />
                        </div>
                    </div>
                    <Shimmer className="h-4 w-56 mt-2" />
                    <Shimmer className="h-20 w-full mt-2" />
                </div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="flex flex-col min-h-screen bg-base items-center justify-center">
                <p className="text-[15px] text-muted">Booking not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-3 text-[13px] font-semibold focus:outline-none"
                    style={{ color: '#C25E4A', background: 'none', border: 'none' }}
                >
                    Go back
                </button>
            </div>
        );
    }

    const price = fmtPrice(booking.price);
    const duration = fmtDuration(booking.duration || booking.duration_minutes);
    const dateLabel = fmtDate(booking.scheduled_at);
    const timeLabel = fmtTime(booking.scheduled_at);

    const statusColors = {
        completed: { bg: '#EBF2EC', text: '#5A8A5E' },
        confirmed: { bg: '#FDDCC6', text: '#C25E4A' },
        pending: { bg: '#FDDCC6', text: '#C25E4A' },
        cancelled: { bg: '#FDEDEA', text: '#B04040' },
    };
    const sc = statusColors[booking.status?.toLowerCase()] || { bg: '#F2EBE5', text: '#8C6A64' };

    const statusLower = (booking.status || '').toLowerCase();
    const canModify = statusLower === 'pending' || statusLower === 'confirmed';
    const paymentFailed = booking.payment_status === 'payment_failed';

    const handleRetrySuccess = () => {
        setShowRetrySheet(false);
        load();
    };

    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {showCancelModal && (
                <ReasonModal
                    title="Cancel Booking"
                    placeholder="Reason for cancelling (optional)…"
                    onConfirm={handleCancel}
                    onCancel={() => { setShowCancelModal(false); setActionError(null); }}
                    loading={actionLoading}
                />
            )}
            {showRescheduleModal && (
                <RescheduleModal
                    onConfirm={handleReschedule}
                    onCancel={() => { setShowRescheduleModal(false); setActionError(null); }}
                    loading={actionLoading}
                />
            )}

            {showRetrySheet && (
                <RetryPaymentSheet
                    bookingId={id}
                    onSuccess={handleRetrySuccess}
                    onClose={() => setShowRetrySheet(false)}
                />
            )}

            {/* Back nav */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate(-1)} />
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24">

                {/* Provider info */}
                <div className="flex items-center gap-4 mb-4 pt-2">
                    <Avatar initials={getInitials(booking.provider_name)} src={booking.provider_avatar || ''} size={56} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] font-semibold text-ink tracking-[-0.02em] m-0 mb-0.5 truncate">
                            {booking.provider_name || 'Provider'}
                        </p>
                        <p className="text-[13px] text-muted m-0">{booking.service_name || 'Session'}</p>
                    </div>
                </div>

                {/* Status pill */}
                <div className="mb-5">
                    <span
                        className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                        style={{ background: sc.bg, color: sc.text }}
                    >
                        {booking.status || 'Pending'}
                    </span>
                </div>

                {/* Payment failed banner */}
                {paymentFailed && (
                    <div className="mb-5 rounded-[14px] p-4" style={{ background: '#FDEDEA', border: '1px solid rgba(176,64,64,0.25)' }}>
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#F8D7D2' }}>
                                <svg width="16" height="16" fill="none" stroke="#B04040" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M12 8v5M12 16.5h.01" strokeLinecap="round" />
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-semibold m-0 mb-1" style={{ color: '#8F2E2E' }}>Payment unsuccessful</p>
                                <p className="text-[13px] leading-relaxed m-0 mb-3" style={{ color: '#B04040' }}>
                                    Your payment couldn't be processed. Please retry with the same card or use a different one.
                                </p>
                                <button
                                    onClick={() => setShowRetrySheet(true)}
                                    className="text-[13px] font-semibold px-4 py-2 rounded-[10px] focus:outline-none"
                                    style={{ background: '#B04040', color: '#fff', border: 'none', cursor: 'pointer' }}
                                >
                                    Retry payment
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cancel / Reschedule actions */}
                {canModify && (
                    <div className="flex gap-3 mb-5">
                        <button
                            onClick={() => { setActionError(null); setShowRescheduleModal(true); }}
                            className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                            style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                        >
                            Reschedule
                        </button>
                        <button
                            onClick={() => { setActionError(null); setShowCancelModal(true); }}
                            className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold focus:outline-none active:opacity-70"
                            style={{ border: '1px solid rgba(176,64,64,0.35)', background: 'transparent', color: '#B04040' }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
                {actionError && (
                    <p className="text-[13px] mb-4 m-0" style={{ color: '#B04040' }}>{actionError}</p>
                )}

                <Divider />

                {/* Session info */}
                <div className="py-5">
                    <Lbl className="block mb-3">Session Info</Lbl>
                    <p className="text-[20px] font-semibold text-ink tracking-[-0.02em] m-0 mb-1">
                        {dateLabel}{timeLabel ? ` at ${timeLabel}` : ''}
                    </p>
                    <p className="text-[14px] text-muted m-0">
                        {[duration, price].filter(Boolean).join(' · ')}
                    </p>
                    {booking.service_description && (
                        <p className="text-[13px] text-muted leading-relaxed m-0 mt-2">{booking.service_description}</p>
                    )}
                </div>

                {/* Client intake & notes */}
                {(booking.client_message || (booking.intake_responses?.length > 0)) && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">Your Booking Details</Lbl>

                            {booking.client_message && (
                                <div className="px-4 py-3 rounded-[12px] mb-4" style={{ background: '#FFF5E6' }}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Your note</p>
                                    <p className="text-[14px] text-ink m-0 leading-relaxed">{booking.client_message}</p>
                                </div>
                            )}

                            {booking.intake_responses?.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {booking.intake_responses.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">{item.question}</p>
                                            <p className="text-[14px] text-ink m-0 leading-relaxed">{item.answer || '—'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Provider session notes & recommendations */}
                {(booking.session_notes || booking.session_recommendation) && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">From Your Provider</Lbl>

                            {booking.session_notes && (
                                <div className="mb-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Session Notes</p>
                                    <p className="text-[14px] text-ink leading-relaxed m-0">{booking.session_notes}</p>
                                </div>
                            )}

                            {booking.session_recommendation && (
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Recommendations</p>
                                    <p className="text-[14px] text-ink leading-relaxed m-0">{booking.session_recommendation}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Session photos */}
                {booking.session_photos?.length > 0 && (
                    <>
                        <Divider />
                        <div className="py-5">
                            <Lbl className="block mb-3">Session Photos</Lbl>
                            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                {booking.session_photos.map((p) => (
                                    <div key={p.id} className="rounded-[10px] overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                        <img
                                            src={p.photo_url}
                                            alt={p.caption || 'Session photo'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ClientBookingDetail;
