/**
 * ProviderAppointments — v6 Warm Editorial
 * Route: /provider/appointments
 *
 * Pending bookings shown as cards with Accept / Decline flow.
 * Decline reveals a textarea for an optional reason before confirming.
 * Reviewed (handled) bookings shown below at 50% opacity.
 */
import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { fetchProviderJobs, updateProviderJobStatus } from '../../data/provider';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Empty state ──────────────────────────────────────────────────────────────

const InboxZero = () => (
    <div className="flex-1 flex flex-col items-center justify-center py-14">
        {/* Open envelope icon */}
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

// ─── Pending booking card ─────────────────────────────────────────────────────

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

// ─── Reviewed row ─────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderAppointments = () => {
    const { onMenu } = useOutletContext() || {};
    const { profile } = useSession();
    const { unreadCount } = useNotifications();

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null);
    const [declining, setDeclining] = useState(null);
    const [declineReason, setDeclineReason] = useState('');

    const initials = (profile?.name || '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || 'P';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchProviderJobs();
            setJobs(data || []);
        } catch (err) {
            console.error('[ProviderAppointments] load error:', err);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const pending = jobs.filter((j) => (j.status || '').toLowerCase() === 'pending');
    const reviewed = jobs.filter((j) => (j.status || '').toLowerCase() !== 'pending');

    const handleAccept = async (job) => {
        setActioning(job.id);
        try {
            await updateProviderJobStatus(job.id, 'confirmed');
            await load();
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
            await updateProviderJobStatus(job.id, 'declined', declineReason.trim() || undefined);
            setDeclining(null);
            setDeclineReason('');
            await load();
        } catch (err) {
            console.error('[decline]', err);
        } finally {
            setActioning(null);
        }
    };

    const subtitle = loading
        ? 'Loading…'
        : `${pending.length} pending · ${reviewed.length} reviewed`;

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                notifCount={unreadCount}
            />

            {/* ── Title ── */}
            <div className="px-5 pb-5">
                <Lbl className="block mb-1.5">{subtitle}</Lbl>
                <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                    Bookings
                </h1>
            </div>

            <div className="px-5 flex-1 flex flex-col">
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

                {/* Empty state */}
                {!loading && pending.length === 0 && reviewed.length === 0 && <InboxZero />}

                {/* Pending cards */}
                {!loading && pending.map((job) => (
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

                {/* All-caught-up inline message when pending=0 but reviewed exist */}
                {!loading && pending.length === 0 && reviewed.length > 0 && (
                    <div className="text-center py-10">
                        <p className="text-[18px] text-ink m-0 mb-1">All caught up.</p>
                        <p className="text-[14px] text-muted m-0">No pending requests right now.</p>
                    </div>
                )}

                {/* Reviewed section */}
                {!loading && reviewed.length > 0 && (
                    <>
                        <Lbl className="block mb-3 mt-2">Reviewed</Lbl>
                        <Divider />
                        {reviewed.map((job) => (
                            <ReviewedRow key={job.id} job={job} />
                        ))}
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default ProviderAppointments;
