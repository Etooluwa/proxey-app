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
import { useNavigate, useParams } from 'react-router-dom';
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

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
    const dollars = val > 1000 ? val / 100 : val;
    return `$${Math.round(dollars)}`;
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

// ─── Shimmer ──────────────────────────────────────────────────────────────────

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Completion screen ────────────────────────────────────────────────────────

const CompletionScreen = ({ job, payout, onDashboard, onTimeline }) => {
    const providerInitials = getInitials(job?.provider_name || 'P');
    const clientInitials = getInitials(job?.client_name);

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
                    style={{ background: '#EBF2EC' }}
                >
                    <svg width="16" height="16" fill="none" stroke="#5A8A5E" strokeWidth="1.5" viewBox="0 0 24 24" className="flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4m0 4h.01" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-[13px] m-0 leading-relaxed" style={{ color: '#5A8A5E' }}>
                        Payout will arrive via Stripe within <strong>2–3 business days</strong>.
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
    const { getOrCreateConversation, setCurrentConversation, loadMessages } = useMessages();

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);
    const [completing, setCompleting] = useState(false);
    // Completion state
    const [completed, setCompleted] = useState(false);
    const [payoutData, setPayoutData] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await request(`/bookings/${id}`);
            const j = data.booking ? normaliseBookingJob(data.booking) : null;
            setJob(j);
            setNotes('');
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

    const handleSaveNotes = async () => {
        if (job?.source === 'booking') return;
        if (!notes.trim() || savingNotes) return;
        setSavingNotes(true);
        try {
            await request(`/provider/jobs/${id}/notes`, {
                method: 'PATCH',
                body: JSON.stringify({ notes }),
            });
        } catch (err) {
            console.error('[saveNotes]', err);
        } finally {
            setSavingNotes(false);
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
            const payout = data.payout
                ? {
                    totalPrice: data.payout.grossAmount,
                    depositCollected: data.payout.depositCollected,
                    remainingCharged: data.payout.remainingCharged,
                    platformFee: data.payout.platformFee,
                    providerPayout: data.payout.netAmount,
                    paymentType: job.payment_type || 'full',
                }
                : {
                    totalPrice: job.price ? job.price / 100 : 0,
                    depositCollected: 0,
                    remainingCharged: 0,
                    platformFee: 0,
                    providerPayout: job.price ? job.price / 100 : 0,
                    paymentType: job.payment_type || 'full',
                };
            setPayoutData(payout);
            setJob((prev) => ({ ...prev, status: 'completed', completed_at: new Date().toISOString() }));
            setCompleted(true);
        } catch (err) {
            console.error('[markComplete]', err);
            setCompleteError(err.message || 'Failed to complete. Please try again.');
        } finally {
            setCompleting(false);
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
    const isConfirmed = ['confirmed', 'accepted', 'pending'].includes((job.status || '').toLowerCase());
    const isAlreadyCompleted = job.status?.toLowerCase() === 'completed';
    const price = fmtPrice(job.price);
    const duration = fmtDuration(job.duration);
    const dateLabel = fmtDate(job.scheduled_at);
    const timeLabel = fmtTime(job.scheduled_at);

    const visitLabel = job.visit_count > 0 ? `${ordinal(job.visit_count)} visit` : null;
    const sinceLabel = job.client_since ? `Client since ${job.client_since}` : null;
    const clientSubtitle = [visitLabel, sinceLabel].filter(Boolean).join(' · ');

    // Payment breakdown
    const totalDollars = job.price ? (job.price > 1000 ? job.price / 100 : job.price) : null;
    const paymentType = job.payment_type || 'full';
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
                {isConfirmed && (
                    <div className="mb-5">
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#FDDCC6', color: '#C25E4A' }}
                        >
                            Confirmed
                        </span>
                    </div>
                )}
                {isAlreadyCompleted && (
                    <div className="mb-5">
                        <span
                            className="inline-flex px-3 py-1.5 rounded-pill text-[11px] font-semibold uppercase tracking-[0.05em]"
                            style={{ background: '#EBF2EC', color: '#5A8A5E' }}
                        >
                            Completed
                        </span>
                    </div>
                )}

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
                                ) : (
                                    <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                                        <p className="text-[13px] m-0" style={{ color: '#92400E' }}>
                                            The full amount will be charged automatically when you mark this booking complete.
                                        </p>
                                    </div>
                                )}
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
                                ) : (
                                    <div className="px-4 py-3 rounded-[12px]" style={{ background: '#FFF5E6' }}>
                                        <p className="text-[13px] m-0" style={{ color: '#92400E' }}>
                                            Remaining ${remaining.toFixed(2)} will be charged automatically on completion.
                                        </p>
                                    </div>
                                )}
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

                {/* ─ Session notes ─ */}
                <div className="py-5">
                    <Lbl className="block mb-3">Session Notes</Lbl>

                    {/* Previous notes */}
                    <div
                        className="px-4 py-3 rounded-[12px] mb-3"
                        style={{ background: '#F2EBE5' }}
                    >
                        <p className="text-[13px] text-muted m-0 italic leading-relaxed">
                            {job.previous_notes
                                ? `Last: ${job.previous_notes}`
                                : 'No previous session notes.'}
                        </p>
                    </div>

                    {/* Current notes textarea */}
                    {!isAlreadyCompleted && job.source !== 'booking' && (
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            onBlur={handleSaveNotes}
                            disabled={savingNotes}
                            placeholder="Add notes for this session…"
                            rows={3}
                            className="w-full text-[14px] text-ink placeholder:text-muted focus:outline-none resize-none"
                            style={{
                                padding: '13px 16px',
                                borderRadius: 12,
                                border: '1px solid rgba(140,106,100,0.2)',
                                background: '#F2EBE5',
                                fontFamily: 'inherit',
                                lineHeight: 1.6,
                                boxSizing: 'border-box',
                            }}
                        />
                    )}
                    {!isAlreadyCompleted && job.source === 'booking' && (
                        <p className="text-[14px] text-muted m-0 leading-relaxed">
                            This booking will move to Completed after you tap Mark Complete.
                        </p>
                    )}
                    {isAlreadyCompleted && notes && (
                        <p className="text-[14px] text-ink m-0 leading-relaxed">{notes}</p>
                    )}
                </div>

                <Footer />
            </div>

            {/* ── Sticky bottom bar ── */}
            {!isAlreadyCompleted && (
                <div
                    className="fixed bottom-0 left-0 right-0 flex flex-col px-5 py-3"
                    style={{
                        background: '#FBF7F2',
                        borderTop: '1px solid rgba(140,106,100,0.15)',
                        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
                    }}
                >
                    {completeError && (
                        <p className="w-full text-center text-[12px] mb-2 m-0" style={{ color: '#C25E4A' }}>
                            {completeError}
                        </p>
                    )}
                    <div className="flex gap-3 w-full">
                    <button
                        onClick={handleMessage}
                        className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-70"
                        style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                    >
                        Message
                    </button>
                    <button
                        onClick={handleMarkComplete}
                        disabled={completing}
                        className="flex-[2] py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none flex items-center justify-center gap-2"
                        style={{ background: '#3D231E', border: 'none', opacity: completing ? 0.7 : 1 }}
                    >
                        {completing && (
                            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                        )}
                        {completing ? 'Completing…' : 'Mark Complete'}
                    </button>
                    </div>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default ProviderAppointmentDetail;
