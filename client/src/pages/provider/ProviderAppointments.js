/**
 * ProviderAppointments — v6 Warm Editorial
 * Route: /provider/appointments
 *
 * 3-tab bookings page:
 *   Pending  — cards with Accept / Decline flow
 *   Upcoming — confirmed sessions not yet passed
 *   Past     — completed / cancelled sessions
 */
import { useEffect, useState, useCallback } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { acceptProviderBooking, declineProviderBooking, fetchProviderBookings } from '../../data/provider';
import { supabase } from '../../utils/supabase';
import { getProviderBookingTab, splitProviderBookings } from '../../utils/providerBookings';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    hero: '#FDDCC6',
    avatarBg: '#F2EBE5',
    success: '#5A8A5E',
    successBg: '#EBF2EC',
    dangerBg: '#FDEDEA',
    base: '#FBF7F2',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDateTime(iso) {
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

function fmtPrice(val) {
    if (!val && val !== 0) return null;
    const dollars = val > 1000 ? val / 100 : val;
    return `$${Math.round(dollars)}`;
}

function fmtDuration(mins) {
    if (!mins) return null;
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
}

// ─── InboxZero empty state ──────────────────────────────────────────────────────

const InboxZero = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-14">
        <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5"
            style={{ background: '#F2EBE5' }}
        >
            <svg width="28" height="28" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <p className="text-[20px] font-semibold text-ink tracking-[-0.02em] m-0 mb-2 text-center">
            Inbox zero. Feels good.
        </p>
        <p className="text-[14px] text-muted text-center leading-relaxed max-w-[280px] m-0">
            When clients request a booking, you'll review and accept them here.
        </p>
    </div>
);

// ─── Pending booking card ───────────────────────────────────────────────────────

const PendingCard = ({ job, declining, declineReason, onDeclineStart, onDeclineCancel, onDeclineReasonChange, onConfirmDecline, onAccept, actioning }) => {
    const isActioning = actioning === job.id;
    const isDeclining = declining === job.id;
    const price = fmtPrice(job.price);
    const duration = fmtDuration(job.duration);
    const note = job.notes || job.client_notes || '';
    const isTimeRequest = job.type === 'time_request' || job.booking_type === 'time_request';

    return (
        <div
            className="mb-5 rounded-[20px] p-6"
            style={{ background: '#FFFFFF', border: '1px solid rgba(140,106,100,0.2)' }}
        >
            {/* Client row */}
            <div className="flex items-center gap-3 mb-3">
                <Avatar initials={getInitials(job.client_name)} size={44} />
                <div className="flex-1 min-w-0">
                    <p className="text-[16px] text-ink m-0 mb-0.5 truncate">
                        {job.client_name || 'Client'}
                    </p>
                    <Lbl>{fmtDateTime(job.scheduled_at)}</Lbl>
                </div>
                {price && (
                    <span className="text-[18px] text-accent tracking-[-0.03em] flex-shrink-0">
                        {price}
                    </span>
                )}
            </div>

            {/* Time Request pill */}
            {isTimeRequest && (
                <div className="inline-flex mb-3">
                    <span
                        className="px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                        style={{ background: '#FFF5E6', color: '#92400E' }}
                    >
                        Time Request
                    </span>
                </div>
            )}

            {/* Service info block */}
            <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#F2EBE5' }}>
                <p className="text-[14px] font-semibold text-ink m-0 mb-0.5">
                    {job.service_name || 'Session'}
                </p>
                {duration && (
                    <p className="text-[13px] text-muted m-0">{duration}</p>
                )}
            </div>

            {/* Client note callout */}
            {note && (
                <div className="px-4 py-3 rounded-[12px] mb-3" style={{ background: '#FFF5E6' }}>
                    <Lbl className="block mb-1" style={{ color: '#92400E', fontSize: '10px' }}>
                        Client Note
                    </Lbl>
                    <p className="text-[14px] text-ink m-0 leading-relaxed italic">
                        "{note}"
                    </p>
                </div>
            )}

            {/* Decline flow */}
            {isDeclining ? (
                <div>
                    <Lbl className="block mb-2">Reason for declining (optional)</Lbl>
                    <textarea
                        value={declineReason}
                        onChange={(e) => onDeclineReasonChange(e.target.value)}
                        placeholder="Let the client know why, or suggest an alternative time..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-[10px] text-[13px] text-ink resize-y focus:outline-none mb-3"
                        style={{
                            border: '1px solid rgba(140,106,100,0.2)',
                            background: '#F2EBE5',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                        }}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={onDeclineCancel}
                            className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none"
                            style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => onConfirmDecline(job)}
                            disabled={isActioning}
                            className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                            style={{ background: '#B04040', opacity: isActioning ? 0.6 : 1 }}
                        >
                            {isActioning ? 'Declining…' : 'Confirm Decline'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-2">
                    <button
                        onClick={() => onDeclineStart(job.id)}
                        disabled={isActioning}
                        className="flex-1 py-3 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none"
                        style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent', opacity: isActioning ? 0.5 : 1 }}
                    >
                        Decline
                    </button>
                    <button
                        onClick={() => onAccept(job)}
                        disabled={isActioning}
                        className="flex-[2] py-3 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none"
                        style={{ background: '#3D231E', opacity: isActioning ? 0.5 : 1 }}
                    >
                        {isActioning ? 'Accepting…' : 'Accept'}
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── Reviewed row (legacy — kept for compatibility) ────────────────────────────

const ReviewedRow = ({ job }) => {
    const isAccepted = ['confirmed', 'accepted', 'completed'].includes(job.status);
    return (
        <>
            <div className="flex items-center gap-3 py-4" style={{ opacity: 0.5 }}>
                <Avatar initials={getInitials(job.client_name)} size={40} />
                <p className="flex-1 text-[15px] text-ink m-0 truncate">
                    {job.client_name || 'Client'}
                </p>
                <Lbl
                    color={isAccepted ? 'text-success' : undefined}
                    style={!isAccepted ? { color: '#B04040' } : {}}
                >
                    {isAccepted ? 'Accepted' : 'Declined'}
                </Lbl>
            </div>
            <Divider />
        </>
    );
};

// ─── Tab bar ───────────────────────────────────────────────────────────────────

const TabBar = ({ activeTab, setActiveTab, pendingCount, upcomingCount, pastCount }) => {
    const tabs = [
        { key: 'pending', label: 'Pending', count: pendingCount },
        { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
        { key: 'past', label: 'Past', count: pastCount },
    ];

    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {tabs.map(({ key, label, count }) => {
                const isActive = activeTab === key;
                return (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        style={{
                            flex: 1,
                            padding: '14px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            borderRadius: 14,
                            background: isActive ? T.hero : T.card,
                            border: isActive ? `2px solid ${T.accent}` : `1px solid ${T.line}`,
                            cursor: 'pointer',
                            outline: 'none',
                            fontFamily: F,
                            gap: 2,
                        }}
                    >
                        <span style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: isActive ? T.accent : T.ink,
                            lineHeight: 1.1,
                        }}>
                            {count}
                        </span>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: T.muted,
                        }}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

// ─── Booking list row (Upcoming + Past tabs) ───────────────────────────────────

const BookingRow = ({ job, onClick, isLast }) => {
    const price = fmtPrice(job.price);
    const duration = fmtDuration(job.duration);
    const isCompleted = job.status === 'completed';
    const isCancelled = job.status === 'cancelled';
    const isAwaitingCompletion =
        (job.status || '').toLowerCase() === 'confirmed' &&
        getProviderBookingTab(job) === 'past';

    return (
        <div
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: isLast ? 'none' : `1px solid ${T.line}`,
                cursor: 'pointer',
            }}
        >
            {/* Avatar */}
            <Avatar initials={getInitials(job.client_name)} size={40} />

            {/* Middle info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {job.client_name || 'Client'}
                </p>
                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[job.service_name, duration].filter(Boolean).join(' · ') || 'Session'}
                </p>
            </div>

            {/* Right: price + date + status pill */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {price && (
                    <span style={{ fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink }}>
                        {price}
                    </span>
                )}
                <span style={{ fontFamily: F, fontSize: 12, color: T.muted }}>
                    {fmtDateTime(job.scheduled_at)}
                </span>
                {isCompleted && (
                    <span style={{
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.success,
                        background: T.successBg,
                        padding: '3px 10px',
                        borderRadius: 999,
                    }}>
                        Completed
                    </span>
                )}
                {isCancelled && (
                    <span style={{
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#B04040',
                        background: T.dangerBg,
                        padding: '3px 10px',
                        borderRadius: 999,
                    }}>
                        Cancelled
                    </span>
                )}
                {isAwaitingCompletion && (
                    <>
                        <span style={{
                            fontFamily: F,
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#92400E',
                            background: '#FFF5E6',
                            padding: '3px 10px',
                            borderRadius: 999,
                        }}>
                            Awaiting Completion
                        </span>
                        <span style={{ fontFamily: F, fontSize: 11, color: '#92400E' }}>
                            Open to mark complete
                        </span>
                    </>
                )}
                {!isCompleted && !isCancelled && !isAwaitingCompletion && job.status === 'confirmed' && (
                    <span style={{
                        fontFamily: F,
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.success,
                        background: T.successBg,
                        padding: '3px 10px',
                        borderRadius: 999,
                    }}>
                        Confirmed
                    </span>
                )}
            </div>
        </div>
    );
};

// ─── Page ──────────────────────────────────────────────────────────────────────

const ProviderAppointments = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const { session, profile } = useSession();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null);
    const [declining, setDeclining] = useState(null);
    const [declineReason, setDeclineReason] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const providerId = session?.user?.id;

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    const load = useCallback(async () => {
        if (!providerId) {
            setJobs([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const data = await fetchProviderBookings(providerId);
            setJobs(data || []);
        } catch (err) {
            console.error('[ProviderAppointments] load error:', err);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, [providerId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!supabase || !providerId) return undefined;

        const channel = supabase
            .channel(`provider-bookings:${providerId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `provider_id=eq.${providerId}`,
            }, () => {
                load();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [load, providerId]);

    // ── Derive tab lists ──────────────────────────────────────────────────────
    const { pending, upcoming, past } = splitProviderBookings(jobs);

    const pendingCount = pending.length;
    const upcomingCount = upcoming.length;
    const pastCount = past.length;

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleAccept = async (job) => {
        setActioning(job.id);
        try {
            const updatedBooking = await acceptProviderBooking(job.id);
            if (updatedBooking) {
                setJobs((prev) => prev.map((item) => (item.id === job.id ? updatedBooking : item)));
            } else {
                await load();
            }
        } catch (err) {
            console.error('[accept]', err);
        } finally {
            setActioning(null);
        }
    };

    const handleDeclineStart = (jobId) => {
        setDeclining(jobId);
        setDeclineReason('');
    };

    const handleDeclineCancel = () => {
        setDeclining(null);
        setDeclineReason('');
    };

    const handleConfirmDecline = async (job) => {
        setActioning(job.id);
        try {
            const updatedBooking = await declineProviderBooking(job.id, declineReason.trim() || undefined);
            setDeclining(null);
            setDeclineReason('');
            if (updatedBooking) {
                setJobs((prev) => prev.map((item) => (item.id === job.id ? updatedBooking : item)));
            } else {
                await load();
            }
        } catch (err) {
            console.error('[decline]', err);
        } finally {
            setActioning(null);
        }
    };

    const handleRowClick = (jobId) => navigate(`/provider/appointments/${jobId}`);

    // ── Desktop layout ────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>

                    {/* Page title */}
                    <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 600, color: T.ink, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
                        Bookings
                    </h1>

                    {/* Tab bar */}
                    <TabBar
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        pendingCount={pendingCount}
                        upcomingCount={upcomingCount}
                        pastCount={pastCount}
                    />

                    {/* Loading skeleton */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {[1, 2].map((i) => (
                                <div key={i} style={{ width: '100%', height: 120, borderRadius: 20, background: 'rgba(140,106,100,0.08)', animation: 'pulse 1.5s infinite' }} />
                            ))}
                        </div>
                    )}

                    {/* ── Pending tab ── */}
                    {!loading && activeTab === 'pending' && (
                        <>
                            {pending.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: 16, background: T.avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                        <svg width="24" height="24" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24">
                                            <path d="M3 19V9a2 2 0 011.106-1.789L12 3l7.894 4.211A2 2 0 0121 9v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M3 9l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <p style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.ink, margin: '0 0 8px' }}>All caught up.</p>
                                    <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No pending requests right now.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                                    {pending.map((job) => (
                                        <PendingCard
                                            key={job.id}
                                            job={job}
                                            declining={declining}
                                            declineReason={declineReason}
                                            onDeclineStart={handleDeclineStart}
                                            onDeclineCancel={handleDeclineCancel}
                                            onDeclineReasonChange={setDeclineReason}
                                            onConfirmDecline={handleConfirmDecline}
                                            onAccept={handleAccept}
                                            actioning={actioning}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Upcoming tab ── */}
                    {!loading && activeTab === 'upcoming' && (
                        <>
                            {upcoming.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <p style={{ fontFamily: F, fontSize: 16, color: T.muted, margin: 0 }}>No upcoming sessions. Confirmed bookings will appear here.</p>
                                </div>
                            ) : (
                                <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: '0 20px', overflow: 'hidden' }}>
                                    {upcoming.map((job, i) => (
                                        <BookingRow
                                            key={job.id}
                                            job={job}
                                            onClick={() => handleRowClick(job.id)}
                                            isLast={i === upcoming.length - 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Past tab ── */}
                    {!loading && activeTab === 'past' && (
                        <>
                            {past.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                                    <p style={{ fontFamily: F, fontSize: 16, color: T.muted, margin: 0 }}>No past sessions yet.</p>
                                </div>
                            ) : (
                                <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, padding: '0 20px', overflow: 'hidden' }}>
                                    {past.map((job, i) => (
                                        <BookingRow
                                            key={job.id}
                                            job={job}
                                            onClick={() => handleRowClick(job.id)}
                                            isLast={i === past.length - 1}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── Mobile layout ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
            />

            {/* Title section */}
            <div className="px-5 pb-5">
                <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                    Bookings
                </h1>
            </div>

            <div className="px-5 flex-1 flex flex-col">

                {/* Tab bar */}
                <TabBar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    pendingCount={pendingCount}
                    upcomingCount={upcomingCount}
                    pastCount={pastCount}
                />

                {/* Loading skeleton */}
                {loading && (
                    <div className="flex flex-col gap-3">
                        {[1, 2].map((i) => (
                            <div
                                key={i}
                                className="w-full h-44 rounded-[20px] animate-pulse"
                                style={{ background: 'rgba(140,106,100,0.08)' }}
                            />
                        ))}
                    </div>
                )}

                {/* ── Pending tab ── */}
                {!loading && activeTab === 'pending' && (
                    <>
                        {pending.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <p style={{ fontFamily: F, fontSize: 16, fontWeight: 500, color: T.ink, margin: '0 0 6px' }}>All caught up.</p>
                                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No pending requests right now.</p>
                            </div>
                        ) : (
                            pending.map((job) => (
                                <PendingCard
                                    key={job.id}
                                    job={job}
                                    declining={declining}
                                    declineReason={declineReason}
                                    onDeclineStart={handleDeclineStart}
                                    onDeclineCancel={handleDeclineCancel}
                                    onDeclineReasonChange={setDeclineReason}
                                    onConfirmDecline={handleConfirmDecline}
                                    onAccept={handleAccept}
                                    actioning={actioning}
                                />
                            ))
                        )}
                    </>
                )}

                {/* ── Upcoming tab ── */}
                {!loading && activeTab === 'upcoming' && (
                    <>
                        {upcoming.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No upcoming sessions. Confirmed bookings will appear here.</p>
                            </div>
                        ) : (
                            <div>
                                {upcoming.map((job, i) => (
                                    <BookingRow
                                        key={job.id}
                                        job={job}
                                        onClick={() => handleRowClick(job.id)}
                                        isLast={i === upcoming.length - 1}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* ── Past tab ── */}
                {!loading && activeTab === 'past' && (
                    <>
                        {past.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0 }}>No past sessions yet.</p>
                            </div>
                        ) : (
                            <div>
                                {past.map((job, i) => (
                                    <BookingRow
                                        key={job.id}
                                        job={job}
                                        onClick={() => handleRowClick(job.id)}
                                        isLast={i === past.length - 1}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ProviderAppointments;
