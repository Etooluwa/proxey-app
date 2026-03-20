/**
 * ProviderClientTimeline — v6 Warm Editorial
 * Route: /provider/client/:clientId
 *
 * API: GET /api/provider/clients/:clientId
 *   → { client: { name, avatar }, stats: { visits, ltv, first_visit }, bookings }
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useMessages } from '../../contexts/MessageContext';
import { request } from '../../data/apiClient';
import BackBtn from '../../components/ui/BackBtn';
import HeroCard from '../../components/ui/HeroCard';
import HeroPill from '../../components/ui/HeroPill';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtShortDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDateShort(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
    return m ? `${h}h ${m}m` : `${h}h`;
}

// ─── Timeline item type ───────────────────────────────────────────────────────
// confirmed/pending → accent dot
// completed         → success dot
// first (oldest)    → gold milestone dot

function dotColor(booking, isMilestone) {
    if (isMilestone) return '#D4A853';
    if (booking.status === 'completed') return '#5A8A5E';
    if (booking.status === 'cancelled') return '#B0948F';
    return '#C25E4A'; // pending / confirmed / upcoming
}

const MILESTONE_INTERVALS = [5, 10, 25, 50]; // every N completed sessions gets a milestone

function buildTimeline(bookings) {
    // bookings are newest-first from API; we keep that order
    const nonCancelled = bookings.filter((b) => b.status !== 'cancelled');
    const completedCount = nonCancelled.filter((b) => b.status === 'completed').length;

    return bookings.map((b, idx) => {
        const isOldest = idx === bookings.length - 1;
        // Milestones: check if this booking is the Nth completed (count from oldest)
        const fromOldest = bookings.length - 1 - idx;
        const completedUpToHere = bookings
            .slice(idx) // older bookings (inclusive)
            .filter((x) => x.status === 'completed').length;
        const isMilestone = isOldest || MILESTONE_INTERVALS.includes(completedUpToHere);
        return { booking: b, isMilestone, isOldest };
    });
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Timeline entry ───────────────────────────────────────────────────────────

const TimelineEntry = ({ entry, isLast }) => {
    const { booking: b, isMilestone } = entry;
    const isUpcoming = b.status === 'pending' || b.status === 'confirmed';
    const dot = dotColor(b, isMilestone);
    const price = fmtPrice(b.price);
    const duration = fmtDuration(b.duration);
    const dateLabel = fmtDate(b.scheduled_at);
    const timeLabel = fmtTime(b.scheduled_at);

    return (
        <div>
            <div className="flex gap-3.5 py-5">
                {/* Spine */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 12 }}>
                    <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
                        style={{ background: dot }}
                    />
                    {!isLast && (
                        <div
                            className="flex-1 mt-1"
                            style={{ width: 1.5, background: 'rgba(140,106,100,0.2)' }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1 gap-2">
                        <p className="text-[15px] text-ink m-0 leading-snug flex-1">
                            {isMilestone && !isUpcoming
                                ? `${b.status === 'completed' ? '🏅 ' : ''}${b.service_name || 'Session'}`
                                : (b.service_name || 'Session')}
                        </p>
                        {price && (
                            <span className="text-[15px] text-ink flex-shrink-0">{price}</span>
                        )}
                    </div>

                    <Lbl className="block mb-1">
                        {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
                        {duration ? ` · ${duration}` : ''}
                    </Lbl>

                    {b.notes && (
                        <p className="text-[13px] text-muted leading-relaxed italic m-0 mt-1.5">
                            {b.notes}
                        </p>
                    )}

                    {/* Pills */}
                    <div className="flex gap-2 flex-wrap mt-2">
                        {isUpcoming && (
                            <span
                                className="inline-flex px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                                style={{ background: '#FDDCC6', color: '#C25E4A' }}
                            >
                                Confirmed
                            </span>
                        )}
                        {isMilestone && (
                            <span
                                className="inline-flex px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                                style={{ background: '#FFF5E6', color: '#92400E' }}
                            >
                                Milestone
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!isLast && <Divider />}
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderClientTimeline = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { session } = useSession();
    const { getOrCreateConversation, setCurrentConversation, loadMessages } = useMessages();

    const [client, setClient] = useState(null);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!clientId) return;
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await request(`/provider/clients/${clientId}`);
                if (!cancelled) {
                    setClient(data.client);
                    setStats(data.stats);
                    setBookings(data.bookings || []);
                }
            } catch (err) {
                console.error('[ProviderClientTimeline] load error:', err);
                if (!cancelled) setError('Could not load client data.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [clientId]);

    const handleMessage = async () => {
        try {
            const conv = await getOrCreateConversation(clientId, 'client');
            setCurrentConversation(conv.id);
            loadMessages(conv.id);
            navigate(`/provider/messages/${conv.id}`);
        } catch (err) {
            console.error('[message] error:', err);
        }
    };

    const handleBookForClient = () => {
        navigate('/app/booking-flow', { state: { clientId, providerMode: true } });
    };

    const initials = getInitials(client?.name);
    const clientSince = fmtShortDate(stats?.first_visit);
    const lastVisit = bookings.find((b) => b.status === 'completed')?.scheduled_at;
    const timeline = buildTimeline(bookings);

    return (
        <div className="flex flex-col min-h-screen bg-base">
            {/* ── Back nav ── */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/clients')} />
            </div>

            {/* ── Hero card ── */}
            <div className="px-5 mb-6">
                <HeroCard>
                    {clientSince && (
                        <HeroPill className="mb-4">Client since {clientSince}</HeroPill>
                    )}

                    <div className="flex items-center gap-4">
                        {/* Frosted client avatar */}
                        {loading ? (
                            <Shimmer className="w-14 h-14 rounded-full" />
                        ) : (
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-semibold text-ink flex-shrink-0"
                                style={{
                                    background: 'rgba(255,255,255,0.5)',
                                    border: '2px solid rgba(255,255,255,0.7)',
                                }}
                            >
                                {initials}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            {loading ? (
                                <>
                                    <Shimmer className="h-6 w-40 mb-2" />
                                    <Shimmer className="h-3.5 w-28" />
                                </>
                            ) : (
                                <>
                                    <h1 className="text-[24px] font-semibold text-ink tracking-[-0.02em] leading-tight m-0 mb-1">
                                        {client?.name || 'Client'}
                                    </h1>
                                    <p className="text-[14px] text-muted m-0">
                                        {stats?.visits ?? 0} session{(stats?.visits ?? 0) !== 1 ? 's' : ''}
                                        {lastVisit ? ` · Last: ${fmtDateShort(lastVisit)}` : ''}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </HeroCard>
            </div>

            {/* ── CTA buttons ── */}
            <div className="px-5 flex gap-3 mb-7">
                <button
                    onClick={handleMessage}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-80 transition-opacity"
                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                >
                    Message
                </button>
                <button
                    onClick={handleBookForClient}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none active:opacity-80 transition-opacity"
                    style={{ background: '#3D231E', border: 'none' }}
                >
                    Book for Client
                </button>
            </div>

            {/* ── Session history ── */}
            <div className="px-5 flex-1 flex flex-col">
                {error && (
                    <p className="text-[14px] text-muted text-center py-8">{error}</p>
                )}

                {!error && (
                    <>
                        <Lbl className="block mb-3">Session History</Lbl>
                        <Divider />

                        {/* Loading skeleton */}
                        {loading && (
                            <div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3.5 py-5">
                                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 12 }}>
                                            <div className="w-2.5 h-2.5 rounded-full bg-line/60 animate-pulse mt-1" />
                                            {i < 3 && <div className="flex-1 w-px bg-line/60 mt-1" />}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <Shimmer className="h-4 w-40 mb-2" />
                                            <Shimmer className="h-3 w-24" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && bookings.length === 0 && (
                            <div className="py-10 flex flex-col items-center">
                                <p className="text-[15px] text-muted text-center">No sessions yet.</p>
                                <p className="text-[13px] text-faded text-center mt-1">
                                    Book a session to start building this client's history.
                                </p>
                            </div>
                        )}

                        {/* Timeline entries */}
                        {!loading && timeline.length > 0 && (
                            <div>
                                {timeline.map((entry, i) => (
                                    <TimelineEntry
                                        key={entry.booking.id}
                                        entry={entry}
                                        isLast={i === timeline.length - 1}
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

export default ProviderClientTimeline;
