/**
 * ProviderClientTimeline — v6 Warm Editorial
 * Route: /provider/client/:clientId
 *
 * API: GET /api/provider/clients/:clientId
 *   → { client, connection, stats, timeline, bookings }
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useMessages } from '../../contexts/MessageContext';
import { request } from '../../data/apiClient';
import { supabase } from '../../utils/supabase';
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

function timelineDotColor(entry) {
    if (entry.type === 'connected') return '#C25E4A';
    if (entry.status === 'completed') return '#5A8A5E';
    if (entry.status === 'cancelled') return '#B04040';
    return '#C25E4A';
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Timeline entry ───────────────────────────────────────────────────────────

const TimelineEntry = ({ entry, isLast, clientName }) => {
    const isConnected = entry.type === 'connected';
    const isUpcoming = entry.status === 'pending' || entry.status === 'confirmed';
    const isCompleted = entry.status === 'completed';
    const isCancelled = entry.status === 'cancelled';
    const dot = timelineDotColor(entry);
    const price = fmtPrice(entry.price);
    const duration = fmtDuration(entry.duration);
    const dateLabel = fmtDate(entry.scheduled_at);
    const timeLabel = fmtTime(entry.scheduled_at);
    const serviceLabel = isConnected
        ? `${clientName || 'Client'} joined your klique`
        : (entry.service_name || 'Session');
    const metaLabel = isConnected
        ? `Connected ${entry.source === 'invite' ? 'via invite' : 'via booking'}`
        : isCompleted
            ? 'Session complete'
            : isCancelled
                ? 'Cancelled'
                : 'Upcoming';

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
                            {serviceLabel}
                        </p>
                        {!isConnected && price && (
                            <span className="text-[15px] text-ink flex-shrink-0">{price}</span>
                        )}
                    </div>

                    <Lbl className="block mb-1">
                        {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
                        {!isConnected && duration ? ` · ${duration}` : ''}
                    </Lbl>

                    <p className="text-[13px] text-muted m-0 mt-1">{metaLabel}</p>

                    {!isConnected && entry.notes && (
                        <p className="text-[13px] text-muted leading-relaxed italic m-0 mt-1.5">
                            {entry.notes}
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
                        {isCompleted && (
                            <span
                                className="inline-flex px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                                style={{ background: '#EBF2EC', color: '#5A8A5E' }}
                            >
                                Session complete
                            </span>
                        )}
                        {isCancelled && (
                            <span
                                className="inline-flex px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                                style={{ background: '#FDEDEA', color: '#B04040' }}
                            >
                                Cancelled
                            </span>
                        )}
                        {isConnected && (
                            <span
                                className="inline-flex px-2.5 py-1 rounded-pill text-[10px] font-semibold uppercase tracking-[0.05em]"
                                style={{ background: '#FDDCC6', color: '#C25E4A' }}
                            >
                                Connected
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
    const [connection, setConnection] = useState(null);
    const [stats, setStats] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const providerId = session?.user?.id;

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
                    setConnection(data.connection || null);
                    setStats(data.stats);
                    setTimeline(data.timeline || []);
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

    useEffect(() => {
        if (!supabase || !providerId || !clientId) return undefined;

        const refreshTimeline = async () => {
            try {
                const data = await request(`/provider/clients/${clientId}`);
                setClient(data.client);
                setConnection(data.connection || null);
                setStats(data.stats);
                setTimeline(data.timeline || []);
            } catch (err) {
                console.error('[ProviderClientTimeline] realtime refresh error:', err);
            }
        };

        const channel = supabase
            .channel(`provider-client:${providerId}:${clientId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'provider_clients',
                filter: `provider_id=eq.${providerId}`,
            }, refreshTimeline)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `provider_id=eq.${providerId}`,
            }, refreshTimeline)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [providerId, clientId]);

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
    const connectedSince = fmtShortDate(connection?.connected_at || stats?.connected_at);
    const lastVisit = stats?.last_visit;
    const hasBookingEvents = timeline.some((entry) => entry.type === 'booking');

    return (
        <div className="flex flex-col min-h-screen bg-base">
            {/* ── Back nav ── */}
            <div className="flex items-center px-5 pt-10 pb-2">
                <BackBtn onClick={() => navigate('/provider/clients')} />
            </div>

            {/* ── Hero card ── */}
            <div className="px-5 mb-6">
                <HeroCard>
                    {connectedSince && (
                        <HeroPill className="mb-4">Connected · {connectedSince}</HeroPill>
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
                                        {stats?.session_count ?? stats?.visits ?? 0} session{((stats?.session_count ?? stats?.visits ?? 0) !== 1) ? 's' : ''}
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
                        {/* Timeline entries */}
                        {!loading && timeline.length > 0 && (
                            <div>
                                {timeline.map((entry, i) => (
                                    <TimelineEntry
                                        key={entry.id}
                                        entry={entry}
                                        clientName={client?.name}
                                        isLast={i === timeline.length - 1}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && !hasBookingEvents && (
                            <div className="py-8 flex flex-col items-center">
                                <p className="text-[15px] text-muted text-center">No sessions yet.</p>
                                <p className="text-[13px] text-faded text-center mt-1">
                                    Once {client?.name || 'this client'} books, their history will appear here.
                                </p>
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
