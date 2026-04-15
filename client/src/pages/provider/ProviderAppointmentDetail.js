/**
 * ProviderAppointmentDetail — v6 Warm Editorial
 * Route: /provider/appointments/:id
 *
 * Two phases:
 *   1. Detail view — client info, session details, payment status, notes, CTA buttons
 *   2. Completion view — payout summary screen shown after Mark Complete
 *
 * API:
 *   GET  /api/provider/jobs/:id            → { job }
 *   POST /api/provider/jobs/:id/complete   → { job, payout }
 *   PATCH /api/provider/jobs/:id/notes     → { job }
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { request } from '../../data/apiClient';
import { useMessages } from '../../contexts/MessageContext';
import BackBtn from '../../components/ui/BackBtn';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(iso.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

function fmtDate(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

function fmtPrice(val) {
    if (!val && val !== 0) return null;
    return `$${Math.round(val / 100)}`;
}

function fmt$(n) {
    return `$${Number(n).toFixed(2)}`;
}

function ordinal(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return `${n}th`;
}

function normaliseBookingJob(booking) {
    return {
        ...booking,
        source: 'booking',
        visit_count: booking.visit_count || 0,
        client_since: booking.client_since || null,
        previous_notes: booking.previous_notes || null,
    };
}

function buildPayoutSummary(job, payoutPayload = null) {
    const paymentType = payoutPayload?.paymentType || job?.payment_type || 'full';
    const totalPrice = payoutPayload?.grossAmount ?? payoutPayload?.totalPrice ?? ((Number(job?.price) || 0) / 100);
    const depositCollected = payoutPayload?.depositCollected ?? ((Number(job?.deposit_paid_cents) || 0) / 100);
    const remainingCharged = payoutPayload?.remainingCharged ?? (
        paymentType === 'deposit'
            ? Math.max(totalPrice - depositCollected, 0)
            : paymentType === 'save_card'
                ? totalPrice
                : 0
    );
    const platformFee = payoutPayload?.platformFee ?? +(totalPrice * 0.1).toFixed(2);
    const providerPayout = payoutPayload?.netAmount ?? payoutPayload?.providerPayout ?? totalPrice;
    const paymentStatus = payoutPayload?.paymentStatus || job?.payment_status || (
        paymentType === 'deposit' && remainingCharged > 0 ? 'deposit_paid' : 'paid'
    );

    return {
        totalPrice,
        depositCollected,
        remainingCharged,
        platformFee,
        providerPayout,
        paymentType,
        paymentStatus,
    };
}

function paymentStatusMeta(status, paymentType = 'full') {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'paid') {
        return {
            status: normalized,
            label: paymentType === 'deposit' ? 'Balance charged - Paid' : 'Paid',
            bg: '#EBF2EC',
            color: '#5A8A5E',
            message: paymentType === 'deposit'
                ? 'The remaining balance was charged successfully.'
                : 'The client payment was charged successfully.',
        };
    }

    if (normalized === 'deposit_paid') {
        return {
            status: normalized,
            label: 'Deposit paid',
            bg: '#EBF2EC',
            color: '#5A8A5E',
            message: 'The client deposit was charged successfully. Remaining balance is still due at completion.',
        };
    }

    if (normalized === 'card_saved') {
        return {
            status: normalized,
            label: 'Card on file',
            bg: '#FFF5E6',
            color: '#92400E',
            message: 'The client card is saved and will be charged when you mark this booking complete.',
        };
    }

    if (normalized === 'payment_failed') {
        return {
            status: normalized,
            label: 'Payment failed',
            bg: '#FDEDEA',
            color: '#B04040',
            message: 'Charge failed, booking not completed. Ask the client to update their payment method, then try again.',
        };
    }

    return {
        status: normalized || 'unpaid',
        label: 'Not paid',
        bg: '#F2EBE5',
        color: '#8C6A64',
        message: 'Payment has not been collected yet.',
    };
}

function isChargeFailureMessage(message) {
    const normalized = String(message || '').toLowerCase();
    return normalized.includes('charge failed') || normalized.includes('payment failed');
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

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

// ─── Completion screen ────────────────────────────────────────────────────────

const CompletionScreen = ({ job, payout, onDashboard, onTimeline }) => {
    const providerInitials = getInitials(job?.provider_name || 'P');
    const clientInitials = getInitials(job?.client_name);
    const paymentMeta = paymentStatusMeta(payout?.paymentStatus || job?.payment_status, payout?.paymentType || job?.payment_type);

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <div className="flex-1 px-5 flex flex-col items-center justify-center py-10">

                {/* Two avatars connected by green line */}
                <div className="flex items-center gap-0 mb-8">
                    <Avatar initials={providerInitials} size={52} />
                    {/* Connecting line */}
                    <div className="flex items-center" style={{ width: 48 }}>
                        <div style={{ flex: 1, height: 2, background: '#5A8A5E' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5A8A5E', flexShrink: 0 }} />
                        <div style={{ flex: 1, height: 2, background: '#5A8A5E' }} />
                    </div>
                    <Avatar initials={clientInitials} size={52} />
                </div>

                <p className="text-[28px] font-semibold text-ink tracking-[-0.02em] m-0 mb-1 text-center">
                    Session complete.
                </p>
                <p className="text-[14px] text-muted m-0 mb-8 text-center">
                    {job?.service_name || 'Session'} with {job?.client_name || 'client'}
                </p>

                <div
                    className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em] mb-6"
                    style={{ background: paymentMeta.bg, color: paymentMeta.color }}
                >
                    {paymentMeta.label}
                </div>

                {/* Payout summary card */}
                {payout && (
                    <div
                        className="w-full rounded-[20px] p-5 mb-4"
                        style={{ background: '#FFFFFF', border: '1px solid rgba(140,106,100,0.15)' }}
                    >
                        <p className="text-[13px] font-semibold text-muted uppercase tracking-[0.05em] m-0 mb-4">
                            Payout Summary
                        </p>

                        <div className="flex flex-col gap-3">
                            {payout.paymentType === 'deposit' ? (
                                <>
                                    <div className="flex justify-between">
                                        <span className="text-[14px] text-muted">Deposit collected</span>
                                        <span className="text-[14px] text-ink font-semibold">
                                            {fmt$(payout.depositCollected)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[14px] text-muted">Remaining charged</span>
                                        <span className="text-[14px] text-ink font-semibold">
                                            {fmt$(payout.remainingCharged)}
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between">
                                    <span className="text-[14px] text-muted">Session total</span>
                                    <span className="text-[14px] text-ink font-semibold">
                                        {fmt$(payout.totalPrice)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between">
                                <span className="text-[14px] text-muted">Platform fee (10%)</span>
                                <span className="text-[14px] text-muted">− {fmt$(payout.platformFee)}</span>
                            </div>

                            <div
                                className="pt-3"
                                style={{ borderTop: '1px solid rgba(140,106,100,0.15)' }}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-[15px] font-semibold text-ink">Your payout</span>
                                    <span
                                        className="text-[22px] font-semibold tracking-[-0.02em]"
                                        style={{ color: '#C25E4A' }}
                                    >
                                        {fmt$(payout.providerPayout)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Green info bar */}
                <div
                    className="w-full flex items-start gap-3 px-4 py-3 rounded-[14px] mb-8"
                    style={{ background: paymentMeta.bg }}
                >
                    <svg width="16" height="16" fill="none" stroke={paymentMeta.color} strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[13px] m-0 leading-relaxed" style={{ color: paymentMeta.color }}>
                        {paymentMeta.message}{' '}
                        {paymentMeta.status !== 'payment_failed' && (
                            <>
                                Payout will arrive via Stripe within <strong>2-3 business days</strong>.
                            </>
                        )}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={onDashboard}
                        className="w-full py-4 rounded-[14px] text-[14px] font-semibold text-white focus:outline-none active:opacity-80"
                        style={{ background: '#3D231E', border: 'none' }}
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={onTimeline}
                        className="w-full py-4 rounded-[14px] text-[14px] font-semibold text-ink focus:outline-none active:opacity-70"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                    >
                        View Client Timeline
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderAppointmentDetail = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { isDesktop } = useOutletContext() || {};
    const { getOrCreateConversation, setCurrentConversation, loadMessages } = useMessages();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionNotes, setSessionNotes] = useState('');
    const [sessionRec, setSessionRec] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [completing, setCompleting] = useState(false);
    // Completion state
    const [completed, setCompleted] = useState(false);
    const [payoutData, setPayoutData] = useState(null);
    // Cancel / Reschedule state
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/bookings/${id}`);
            const j = data.booking ? normaliseBookingJob(data.booking) : null;
            setJob(j);
            setSessionNotes(j?.session_notes || '');
            setSessionRec(j?.session_recommendation || '');
            setPhotos(j?.session_photos || []);
            if (j?.status === 'completed') {
                setCompleted(true);
            }
        } catch (err) {
            console.error('[ProviderAppointmentDetail] load error:', err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const handleSaveNotes = async (notesVal, recVal) => {
        if (savingNotes) return;
        setSavingNotes(true);
        try {
            await request(`/bookings/${id}/notes`, {
                method: 'PATCH',
                body: JSON.stringify({
                    session_notes: notesVal ?? sessionNotes,
                    session_recommendation: recVal ?? sessionRec,
                }),
            });
        } catch (err) {
            console.error('[saveNotes]', err);
        } finally {
            setSavingNotes(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || uploadingPhoto) return;
        setUploadingPhoto(true);
        try {
            // Get signed upload URL from server
            const { uploadUrl, filePath } = await request(`/bookings/${id}/photos/upload-url`, {
                method: 'POST',
                body: JSON.stringify({ filename: file.name, contentType: file.type }),
            });
            // Upload to Supabase Storage
            await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
            // Get the public URL
            const { supabase: sb } = await import('../../utils/supabase');
            const { data: urlData } = sb.storage.from('kliques-media').getPublicUrl(filePath);
            const photoUrl = urlData?.publicUrl;
            if (!photoUrl) throw new Error('Could not get public URL');
            // Register photo with server
            const { photo } = await request(`/bookings/${id}/photos`, {
                method: 'POST',
                body: JSON.stringify({ photo_url: photoUrl }),
            });
            setPhotos((prev) => [...prev, photo]);
        } catch (err) {
            console.error('[photoUpload]', err);
        } finally {
            setUploadingPhoto(false);
            e.target.value = '';
        }
    };

    const handleDeletePhoto = async (photoId) => {
        try {
            await request(`/bookings/${id}/photos/${photoId}`, { method: 'DELETE' });
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } catch (err) {
            console.error('[deletePhoto]', err);
        }
    };

    const handleMessage = async () => {
        if (!job?.client_id) return;
        try {
            const conv = await getOrCreateConversation(job.client_id, 'client');
            setCurrentConversation(conv.id);
            loadMessages(conv.id);
            navigate(`/provider/messages/${conv.id}`);
        } catch (err) {
            console.error('[message]', err);
        }
    };

    const [completeError, setCompleteError] = useState(null);

    const handleMarkComplete = async () => {
        if (!job || completing) return;
        setCompleting(true);
        setCompleteError(null);
        try {
            const data = await request(`/bookings/${id}/complete`, {
                method: 'POST',
            });
            setPayoutData(buildPayoutSummary(job, data.payout ? {
                ...data.payout,
                paymentType: job.payment_type || 'full',
            } : null));
            setJob((prev) => ({
                ...prev,
                status: 'completed',
                payment_status: data.payout?.paymentStatus || 'paid',
                completed_at: new Date().toISOString(),
            }));
            setCompleted(true);
        } catch (err) {
            console.error('[markComplete]', err);
            try {
                const latest = await request(`/bookings/${id}`);
                const latestJob = latest.booking ? normaliseBookingJob(latest.booking) : null;
                if (latestJob?.status === 'completed') {
                    setJob(latestJob);
                    setSessionNotes(latestJob.session_notes || '');
                    setSessionRec(latestJob.session_recommendation || '');
                    setPhotos(latestJob.session_photos || []);
                    setPayoutData((prev) => prev || buildPayoutSummary(latestJob));
                    setCompleted(true);
                    return;
                }
            } catch (reloadErr) {
                console.error('[markComplete:reload]', reloadErr);
            }
            setCompleteError(err.message || 'Failed to complete. Please try again.');
        } finally {
            setCompleting(false);
        }
    };

    const [accepting, setAccepting] = useState(false);
    const [declining, setDeclining] = useState(false);
    const [confirmationMsg, setConfirmationMsg] = useState('');
    const [savingConfirmMsg, setSavingConfirmMsg] = useState(false);
    const [confirmMsgSaved, setConfirmMsgSaved] = useState(false);

    // Initialise confirmationMsg when job loads
    useEffect(() => {
        if (job?.confirmation_message != null) {
            setConfirmationMsg(job.confirmation_message);
        }
    }, [job?.confirmation_message]);

    const handleAccept = async () => {
        setAccepting(true);
        setActionError(null);
        try {
            const data = await request(`/bookings/${id}/accept`, {
                method: 'POST',
                body: JSON.stringify({ confirmationMessage: confirmationMsg.trim() || null }),
            });
            setJob((prev) => ({ ...prev, status: data.booking?.status || 'confirmed', confirmation_message: confirmationMsg.trim() || null }));
        } catch (err) {
            setActionError(err.message || 'Could not accept. Please try again.');
        } finally {
            setAccepting(false);
        }
    };

    const handleSaveConfirmationMsg = async () => {
        setSavingConfirmMsg(true);
        try {
            await request(`/bookings/${id}/confirmation-message`, {
                method: 'PATCH',
                body: JSON.stringify({ confirmationMessage: confirmationMsg }),
            });
            setConfirmMsgSaved(true);
            setTimeout(() => setConfirmMsgSaved(false), 2500);
        } catch (err) {
            console.error('[saveConfirmationMsg]', err);
        } finally {
            setSavingConfirmMsg(false);
        }
    };

    const handleDecline = async (reason) => {
        setActionLoading(true);
        setActionError(null);
        try {
            await request(`/bookings/${id}/decline`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            setShowCancelModal(false);
            load();
        } catch (err) {
            setActionError(err.message || 'Could not decline. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelBooking = async (reason) => {
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

    const handleRescheduleBooking = async ({ new_date, new_time, reason }) => {
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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base">
                <div className="flex items-center px-5 pt-10 pb-2">
                    <BackBtn onClick={() => navigate('/provider/appointments')} />
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
                    <Shimmer className="h-3.5 w-40" />
                    <Shimmer className="h-20 w-full mt-2" />
                </div>
            </div>
        );
    }

    // ── Not found ────────────────────────────────────────────────────────────
    if (!job) {
        return (
            <div className="flex flex-col min-h-screen bg-base items-center justify-center">
                <p className="text-[15px] text-muted">Appointment not found</p>
                <button
                    onClick={() => navigate('/provider/appointments')}
                    className="mt-3 text-[13px] font-semibold focus:outline-none"
                    style={{ color: '#C25E4A', background: 'none', border: 'none' }}
                >
                    Go back
                </button>
            </div>
        );
    }

    // ── Completion screen ────────────────────────────────────────────────────
    if (completed && payoutData) {
        return (
            <CompletionScreen
                job={job}
                payout={payoutData}
                onDashboard={() => navigate('/provider')}
                onTimeline={() => job.client_id
                    ? navigate(`/provider/client/${job.client_id}`)
                    : navigate('/provider/clients')
                }
            />
        );
    }

    // ── Derived values ───────────────────────────────────────────────────────
    const statusLower = (job.status || '').toLowerCase();
    const isPending = statusLower === 'pending';
    const isConfirmed = statusLower === 'confirmed' || statusLower === 'accepted';
    const isAlreadyCompleted = statusLower === 'completed';
    const isCancelled = statusLower === 'cancelled' || statusLower === 'declined';
    const price = fmtPrice(job.price);
    const duration = fmtDuration(job.duration);
    const dateLabel = fmtDate(job.scheduled_at);
    const timeLabel = fmtTime(job.scheduled_at);

    const visitLabel = job.visit_count > 0 ? `${ordinal(job.visit_count)} visit` : null;
    const sinceLabel = job.client_since ? `Client since ${job.client_since}` : null;
    const clientSubtitle = [visitLabel, sinceLabel].filter(Boolean).join(' · ');

    // Payment breakdown
    const totalDollars = job.price ? job.price / 100 : null;
    const paymentType = job.payment_type || 'full';
    const paymentMeta = paymentStatusMeta(job.payment_status, paymentType);
    const showChargeFailureBanner = paymentMeta.status === 'payment_failed' || isChargeFailureMessage(completeError);
    const depositValue = job.deposit_value;
    const depositType = job.deposit_type; // 'percent' | 'fixed'
    let depositPaid = null;
    let remaining = null;
    if (totalDollars && paymentType === 'deposit' && depositValue) {
        depositPaid = depositType === 'percent'
            ? (totalDollars * depositValue) / 100
            : Math.min(depositValue, totalDollars);
        remaining = Math.max(totalDollars - depositPaid, 0);
    }

    // ─── Render detail view ───────────────────────────────────────────────────
    return (
        <div className="flex flex-col bg-base" style={{ minHeight: '100dvh' }}>

            {showCancelModal && (
                <ReasonModal
                    title={isPending ? 'Decline Booking' : 'Cancel Booking'}
                    placeholder={isPending ? 'Reason for declining (optional)…' : 'Reason for cancelling (optional)…'}
                    onConfirm={isPending ? handleDecline : handleCancelBooking}
                    onCancel={() => { setShowCancelModal(false); setActionError(null); }}
                    loading={actionLoading}
                />
            )}
            {showRescheduleModal && (
                <RescheduleModal
                    onConfirm={handleRescheduleBooking}
                    onCancel={() => { setShowRescheduleModal(false); setActionError(null); }}
                    loading={actionLoading}
                />
            )}

            {/* ── Back nav ── */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/appointments')} />
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-32">

                {/* ─ Client info ─ */}
                <div className="flex items-center gap-4 mb-4 pt-2">
                    <Avatar initials={getInitials(job.client_name)} size={56} />
                    <div className="flex-1 min-w-0">
                        <p className="text-[22px] font-semibold text-ink tracking-[-0.02em] m-0 mb-0.5 truncate">
                            {job.client_name || 'Client'}
                        </p>
                        {clientSubtitle ? (
                            <p className="text-[13px] text-muted m-0">{clientSubtitle}</p>
                        ) : null}
                    </div>
                </div>

                {/* Status pill */}
                <div className="mb-5 flex flex-wrap gap-2">
                    {isPending && (
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#FFF5E6', color: '#92400E' }}
                        >
                            Awaiting your response
                        </span>
                    )}
                    {isConfirmed && (
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#FDDCC6', color: '#C25E4A' }}
                        >
                            Confirmed
                        </span>
                    )}
                    {isAlreadyCompleted && (
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#EBF2EC', color: '#5A8A5E' }}
                        >
                            Completed
                        </span>
                    )}
                    {isCancelled && (
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#FDEDEA', color: '#C25E4A' }}
                        >
                            Cancelled
                        </span>
                    )}
                    <span
                        className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                        style={{ background: paymentMeta.bg, color: paymentMeta.color }}
                    >
                        {paymentMeta.label}
                    </span>
                </div>

                <Divider />

                {/* ─ Session info ─ */}
                <div className="py-5">
                    <Lbl className="block mb-3">Session Info</Lbl>
                    <p className="text-[20px] font-semibold text-ink tracking-[-0.02em] m-0 mb-1">
                        {dateLabel}
                        {timeLabel ? ` at ${timeLabel}` : ''}
                    </p>
                    <p className="text-[14px] text-muted m-0">
                        {[duration, job.service_name, price].filter(Boolean).join(' · ')}
                    </p>
                </div>

                <Divider />

                {/* ─ Payment status ─ */}
                {totalDollars && (
                    <div className="py-5">
                        <Lbl className="block mb-3">Payment</Lbl>
                        {paymentType === 'save_card' ? (
                            <>
                                <div className="flex justify-between mb-3">
                                    <span className="text-[14px] text-muted">Total</span>
                                    <span className="text-[14px] font-semibold text-ink">{price}</span>
                                </div>
                                {job.payment_status === 'paid' ? (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-[12px]" style={{ background: '#EBF2EC' }}>
                                        <svg width="14" height="14" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        <p className="text-[13px] m-0" style={{ color: '#5A8A5E' }}>Card charged successfully.</p>
                                    </div>
                                ) : !isCancelled ? (
                                    <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                                        <p className="text-[13px] m-0" style={{ color: '#92400E' }}>
                                            The full amount will be charged automatically when you mark this booking complete.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        ) : paymentType === 'deposit' && depositPaid !== null ? (
                            <>
                                <div className="flex justify-between mb-2">
                                    <span className="text-[14px] text-muted">Deposit paid</span>
                                    <span className="text-[14px] font-semibold text-ink">${depositPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between mb-3">
                                    <span className="text-[14px] text-muted">Remaining balance</span>
                                    <span className="text-[14px] font-semibold text-ink">${remaining.toFixed(2)}</span>
                                </div>
                                {job.payment_status === 'paid' ? (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-[12px]" style={{ background: '#EBF2EC' }}>
                                        <svg width="14" height="14" fill="none" stroke="#5A8A5E" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        <p className="text-[13px] m-0" style={{ color: '#5A8A5E' }}>Remaining balance charged.</p>
                                    </div>
                                ) : !isCancelled ? (
                                    <div className="px-4 py-3 rounded-[12px]" style={{ background: '#FFF5E6' }}>
                                        <p className="text-[13px] m-0" style={{ color: '#92400E' }}>
                                            Remaining ${remaining.toFixed(2)} will be charged automatically on completion.
                                        </p>
                                    </div>
                                ) : null}
                            </>
                        ) : (
                            <div className="flex justify-between">
                                <span className="text-[14px] text-muted">Full payment</span>
                                <span className="text-[14px] font-semibold text-ink">{price}</span>
                            </div>
                        )}
                    </div>
                )}

                <Divider />

                {/* ─ Client intake & notes ─ */}
                {(job.client_message || (job.intake_responses && job.intake_responses.length > 0)) && (
                    <>
                        <div className="py-5">
                            <Lbl className="block mb-3">From the Client</Lbl>

                            {job.client_message && (
                                <div
                                    className="px-4 py-3 rounded-[12px] mb-4"
                                    style={{ background: '#FFF5E6', border: '1px solid rgba(194,94,74,0.12)' }}
                                >
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">
                                        Client Note
                                    </p>
                                    <p className="text-[14px] text-ink m-0 leading-relaxed">
                                        {job.client_message}
                                    </p>
                                </div>
                            )}

                            {job.intake_responses && job.intake_responses.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    {job.intake_responses.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">
                                                {item.question}
                                            </p>
                                            <p className="text-[14px] text-ink m-0 leading-relaxed">
                                                {item.answer || <span className="text-muted italic">No answer</span>}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Divider />
                    </>
                )}

                {/* ─ Message to client ─ */}
                {(isConfirmed || isAlreadyCompleted) && (
                    <>
                        <div className="py-5">
                            <div className="flex items-center justify-between mb-3">
                                <Lbl>Message to Client</Lbl>
                                {confirmMsgSaved && (
                                    <span className="text-[11px]" style={{ color: '#5A8A5E' }}>Saved</span>
                                )}
                            </div>
                            <textarea
                                value={confirmationMsg}
                                onChange={(e) => setConfirmationMsg(e.target.value)}
                                onBlur={handleSaveConfirmationMsg}
                                disabled={savingConfirmMsg}
                                placeholder="e.g. Here's your Zoom link: zoom.us/j/... · Please arrive 5 min early"
                                rows={3}
                                className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none"
                                style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                            />
                            <p className="text-[11px] text-faded m-0 mt-1.5">Shown on the client's booking page. Update anytime.</p>
                        </div>
                        <Divider />
                    </>
                )}

                {/* ─ Session Notes & Recommendations ─ */}
                {(isConfirmed || isAlreadyCompleted) && <div className="py-5">
                    <div className="flex items-center justify-between mb-3">
                        <Lbl>Session Notes</Lbl>
                        {savingNotes && (
                            <span className="text-[11px] text-muted">Saving…</span>
                        )}
                    </div>

                    {/* Previous session notes (from last booking) */}
                    {job.previous_notes && (
                        <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#F2EBE5' }}>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1">Last session</p>
                            <p className="text-[13px] text-muted m-0 italic leading-relaxed">{job.previous_notes}</p>
                        </div>
                    )}

                    {/* Notes textarea — always editable when confirmed or completed */}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1.5">Notes</p>
                    <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        onBlur={() => handleSaveNotes(sessionNotes, sessionRec)}
                        disabled={savingNotes}
                        placeholder="Notes from this session"
                        rows={3}
                        className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none mb-4"
                        style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                    />

                    {/* Recommendation textarea — always editable when confirmed or completed */}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1.5">Recommendations for client</p>
                    <textarea
                        value={sessionRec}
                        onChange={(e) => setSessionRec(e.target.value)}
                        onBlur={() => handleSaveNotes(sessionNotes, sessionRec)}
                        disabled={savingNotes}
                        placeholder="What should the client do before the next session?…"
                        rows={2}
                        className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none"
                        style={{ padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(140,106,100,0.2)', background: '#F2EBE5', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                    />
                </div>}

                {(isConfirmed || isAlreadyCompleted) && <Divider />}

                {/* ─ Session Photos ─ */}
                {(isConfirmed || isAlreadyCompleted) && <div className="py-5">
                    <div className="flex items-center justify-between mb-3">
                        <Lbl>Session Photos</Lbl>
                        <label
                            className="text-[12px] font-semibold cursor-pointer focus:outline-none"
                            style={{ color: '#C25E4A' }}
                        >
                            {uploadingPhoto ? 'Uploading…' : '+ Add photo'}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoUpload}
                                disabled={uploadingPhoto}
                            />
                        </label>
                    </div>

                    {photos.length === 0 ? (
                        <p className="text-[13px] text-muted italic m-0">No photos yet.</p>
                    ) : (
                        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                            {photos.map((p) => (
                                <div key={p.id} className="relative rounded-[10px] overflow-hidden" style={{ aspectRatio: '1/1' }}>
                                    <img
                                        src={p.photo_url}
                                        alt={p.caption || 'Session photo'}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => handleDeletePhoto(p.id)}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center focus:outline-none"
                                        style={{ background: 'rgba(0,0,0,0.5)' }}
                                    >
                                        <svg width="10" height="10" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                                            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>}

                <Footer />
            </div>

            {/* ── Sticky bottom bar ── */}
            {!isAlreadyCompleted && (
                <div
                    className="fixed bottom-0 left-0 right-0 flex flex-col px-5 py-3"
                    style={{
                        left: isDesktop ? 260 : 0,
                        background: '#FBF7F2',
                        borderTop: '1px solid rgba(140,106,100,0.15)',
                        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                    }}
                >
                    <div className="w-full mx-auto" style={{ maxWidth: isDesktop ? 760 : 'none' }}>
                    {showChargeFailureBanner && (
                        <div
                            className="w-full mb-3 rounded-[16px] px-4 py-3"
                            style={{
                                background: '#FDEDEA',
                                border: '1px solid rgba(176,64,64,0.28)',
                                boxShadow: '0 10px 24px rgba(176,64,64,0.14)',
                            }}
                        >
                            <div className="flex gap-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: '#F8D7D2' }}
                                >
                                    <svg width="16" height="16" fill="none" stroke="#B04040" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M12 8v5" strokeLinecap="round" />
                                        <path d="M12 16.5h.01" strokeLinecap="round" />
                                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-semibold m-0 mb-1" style={{ color: '#8F2E2E' }}>
                                        Charge failed, booking not completed
                                    </p>
                                    <p className="text-[12px] leading-relaxed m-0" style={{ color: '#B04040' }}>
                                        {completeError || paymentMeta.message}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {((completeError && !showChargeFailureBanner) || actionError) && (
                        <p className="w-full text-center text-[12px] mb-2 m-0" style={{ color: '#C25E4A' }}>
                            {(completeError && !showChargeFailureBanner ? completeError : null) || actionError}
                        </p>
                    )}

                    {/* Pending: optional message before accepting */}
                    {isPending && (
                        <div className="w-full mb-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-muted m-0 mb-1.5">
                                Message to client (optional)
                            </p>
                            <textarea
                                value={confirmationMsg}
                                onChange={(e) => setConfirmationMsg(e.target.value)}
                                placeholder="e.g. Here's your Zoom link: zoom.us/j/... · Please arrive 5 min early"
                                rows={3}
                                className="w-full rounded-[12px] px-4 py-3 text-[14px] text-ink resize-none focus:outline-none"
                                style={{
                                    background: '#F2EBE5',
                                    border: '1px solid rgba(140,106,100,0.2)',
                                    fontFamily: "'Sora',system-ui,sans-serif",
                                    boxSizing: 'border-box',
                                }}
                            />
                            <p className="text-[11px] text-faded m-0 mt-1">Sent to the client in their confirmation email and shown on their booking page.</p>
                        </div>
                    )}

                    {/* Pending: Accept / Decline only */}
                    {isPending && (
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => { setActionError(null); setShowCancelModal(true); }}
                                className="py-3.5 rounded-[12px] text-[13px] font-semibold focus:outline-none active:opacity-70"
                                style={{
                                    width: isDesktop ? 180 : '40%',
                                    minWidth: 120,
                                    border: '1px solid rgba(176,64,64,0.35)',
                                    background: 'transparent',
                                    color: '#B04040',
                                }}
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={accepting}
                                className="py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
                                style={{
                                    flex: 1,
                                    maxWidth: isDesktop ? 320 : 'none',
                                    background: '#3D231E',
                                    border: 'none',
                                    opacity: accepting ? 0.7 : 1,
                                }}
                            >
                                {accepting && (
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                )}
                                {accepting ? 'Accepting…' : 'Accept Booking'}
                            </button>
                        </div>
                    )}

                    {/* Confirmed: Mark Complete (primary) + Message, then Reschedule + Cancel */}
                    {isConfirmed && (
                        <>
                            <button
                                onClick={handleMarkComplete}
                                disabled={completing}
                                className="w-full py-3.5 rounded-[12px] text-[14px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2 mb-2"
                                style={{
                                    maxWidth: isDesktop ? 360 : 'none',
                                    background: '#3D231E',
                                    border: 'none',
                                    opacity: completing ? 0.7 : 1,
                                }}
                            >
                                {completing && (
                                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                                )}
                                {completing ? 'Completing…' : 'Mark Complete'}
                            </button>
                            <div className="flex gap-2 w-full" style={{ maxWidth: isDesktop ? 520 : 'none' }}>
                                <button
                                    onClick={handleMessage}
                                    className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                                >
                                    Message
                                </button>
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
                        </>
                    )}
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ProviderAppointmentDetail;
