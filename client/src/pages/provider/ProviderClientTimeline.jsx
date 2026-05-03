/**
 * ProviderClientTimeline — v6 Warm Editorial
 * Route: /provider/client/:clientId
 *
 * API: GET /api/provider/clients/:clientId
 *   → { client, connection, stats, timeline, bookings }
 */
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../../auth/authContext';
import { useMessages } from '../../contexts/MessageContext';
import { request } from '../../data/apiClient';
import { supabase } from '../../utils/supabase';
import { formatMoney } from '../../utils/formatMoney';
import BackBtn from '../../components/ui/BackBtn';
import HeroCard from '../../components/ui/HeroCard';
import HeroPill from '../../components/ui/HeroPill';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

const FOLLOW_UP_DELAY_OPTIONS = [
    { label: '1 week',   days: 7 },
    { label: '2 weeks',  days: 14 },
    { label: '4 weeks',  days: 28 },
    { label: '6 weeks',  days: 42 },
    { label: '8 weeks',  days: 56 },
    { label: '3 months', days: 91 },
    { label: '6 months', days: 182 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || 'C').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function parseLocalDate(iso) {
    if (!iso) return null;
    return new Date(iso.replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, ''));
}

function fmtShortDate(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function fmtDate(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fmtDateShort(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '—';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtTime(iso) {
    const d = parseLocalDate(iso);
    if (!d || isNaN(d)) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const fmtPrice = (val, currency = 'cad') => (val == null ? null : formatMoney(val, currency));

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

const TimelineEntry = ({ entry, isLast, clientName, onPress }) => {
    const isConnected = entry.type === 'connected';
    const isUpcoming = entry.status === 'pending' || entry.status === 'confirmed';
    const isCompleted = entry.status === 'completed';
    const isCancelled = entry.status === 'cancelled';
    const dot = timelineDotColor(entry);
    const clickable = !isConnected && entry.id && typeof onPress === 'function';
    const price = fmtPrice(entry.price, entry.currency);
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
            <div
                className={`flex gap-3.5 py-5 ${clickable ? 'cursor-pointer active:opacity-70' : ''}`}
                onClick={clickable ? onPress : undefined}
            >
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
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!isConnected && price && (
                                <span className="text-[15px] text-ink">{price}</span>
                            )}
                            {clickable && (
                                <svg width="14" height="14" fill="none" stroke="#B0948F" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M7 17L17 7M17 7H7M17 7v10" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </div>
                    </div>

                    <Lbl className="block mb-1">
                        {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
                        {!isConnected && duration ? ` · ${duration}` : ''}
                    </Lbl>

                    <p className="text-[13px] text-muted m-0 mt-1">{metaLabel}</p>

                    {!isConnected && entry.session_notes && (
                        <p className="text-[13px] text-muted leading-relaxed italic m-0 mt-1.5">
                            "{entry.session_notes.slice(0, 100)}{entry.session_notes.length > 100 ? '…' : ''}"
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

    // Follow-up state
    const [followUps, setFollowUps] = useState([]);
    const [showFollowUpSheet, setShowFollowUpSheet] = useState(false);
    const [fuDelayDays, setFuDelayDays] = useState(42);
    const [fuCustomValue, setFuCustomValue] = useState('');
    const [fuCustomUnit, setFuCustomUnit] = useState('days');
    const [fuSubject, setFuSubject] = useState('');
    const [fuMessage, setFuMessage] = useState('');
    const [fuSaving, setFuSaving] = useState(false);
    const [fuError, setFuError] = useState('');
    const [fuCancelling, setFuCancelling] = useState(null);

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

    const loadFollowUps = useCallback(async () => {
        if (!clientId) return;
        try {
            const data = await request(`/provider/clients/${clientId}/follow-ups`);
            setFollowUps(data.followUps || []);
        } catch (err) {
            console.error('[follow-ups load]', err);
        }
    }, [clientId]);

    useEffect(() => { loadFollowUps(); }, [loadFollowUps]);

    const handleScheduleFollowUp = async () => {
        setFuError('');
        setFuSaving(true);
        try {
            await request(`/provider/clients/${clientId}/follow-ups`, {
                method: 'POST',
                body: JSON.stringify({
                    delayDays: fuDelayDays,
                    subject: fuSubject.trim() || null,
                    message: fuMessage.trim() || null,
                }),
            });
            setShowFollowUpSheet(false);
            setFuSubject('');
            setFuMessage('');
            setFuDelayDays(42);
            setFuCustomValue('');
            setFuCustomUnit('days');
            await loadFollowUps();
        } catch (err) {
            setFuError(err.message || 'Failed to schedule follow-up.');
        } finally {
            setFuSaving(false);
        }
    };

    const handleCancelFollowUp = async (fuId) => {
        setFuCancelling(fuId);
        try {
            await request(`/provider/follow-ups/${fuId}`, { method: 'DELETE' });
            await loadFollowUps();
        } catch (err) {
            console.error('[cancel follow-up]', err);
        } finally {
            setFuCancelling(null);
        }
    };

    const pendingFollowUps = followUps.filter((fu) => !fu.sent_at && !fu.cancelled_at);
    const sentFollowUps   = followUps.filter((fu) => fu.sent_at);

    const initials = getInitials(client?.name);
    const connectedSince = fmtShortDate(connection?.connected_at || stats?.connected_at);
    const lastVisit = stats?.last_visit;
    const hasBookingEvents = timeline.some((entry) => entry.type === 'booking');

    return (
        <>
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
            <div className="px-5 mb-7 flex gap-3">
                <button
                    onClick={handleMessage}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-ink focus:outline-none active:opacity-80 transition-opacity"
                    style={{ border: '1px solid rgba(140,106,100,0.35)', background: 'transparent' }}
                >
                    Message
                </button>
                <button
                    onClick={() => setShowFollowUpSheet(true)}
                    className="flex-1 py-3.5 rounded-[12px] text-[13px] font-semibold text-white focus:outline-none active:opacity-80 transition-opacity"
                    style={{ background: '#3D231E', border: 'none' }}
                >
                    Schedule follow-up
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
                                        onPress={entry.id && entry.type !== 'connected'
                                            ? () => navigate(`/provider/appointments/${entry.id}`)
                                            : undefined}
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

                {/* ── Scheduled follow-ups ── */}
                {(pendingFollowUps.length > 0 || sentFollowUps.length > 0) && (
                    <>
                        <Divider />
                        <Lbl className="block mb-3 mt-5">Follow-ups</Lbl>

                        {pendingFollowUps.map((fu) => (
                            <div
                                key={fu.id}
                                className="flex items-start justify-between gap-3 py-4"
                                style={{ borderBottom: '1px solid rgba(140,106,100,0.12)' }}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-ink font-semibold m-0 leading-snug">
                                        {fu.subject || 'Follow-up email'}
                                    </p>
                                    <p className="text-[12px] text-muted m-0 mt-0.5">
                                        Scheduled for {new Date(fu.send_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                    {fu.message && (
                                        <p className="text-[12px] text-faded m-0 mt-1 italic leading-relaxed">
                                            "{fu.message.slice(0, 80)}{fu.message.length > 80 ? '…' : ''}"
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleCancelFollowUp(fu.id)}
                                    disabled={fuCancelling === fu.id}
                                    className="flex-shrink-0 text-[12px] font-semibold focus:outline-none active:opacity-60"
                                    style={{ color: '#B04040', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' }}
                                >
                                    {fuCancelling === fu.id ? 'Cancelling…' : 'Cancel'}
                                </button>
                            </div>
                        ))}

                        {sentFollowUps.slice(0, 3).map((fu) => (
                            <div
                                key={fu.id}
                                className="flex items-start gap-3 py-4"
                                style={{ borderBottom: '1px solid rgba(140,106,100,0.12)' }}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] text-muted m-0 leading-snug">
                                        {fu.subject || 'Follow-up email'}
                                    </p>
                                    <p className="text-[12px] text-faded m-0 mt-0.5">
                                        Sent {new Date(fu.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <span
                                    className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.05em]"
                                    style={{ background: '#EBF2EC', color: '#5A8A5E' }}
                                >
                                    Sent
                                </span>
                            </div>
                        ))}
                    </>
                )}

                <Footer />
            </div>
        </div>

        {/* ── Schedule follow-up bottom sheet ── */}
        {showFollowUpSheet && (
            <div
                onClick={() => setShowFollowUpSheet(false)}
                style={{
                    position: 'fixed', inset: 0, zIndex: 50,
                    background: 'rgba(61,35,30,0.4)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    fontFamily: "'Sora',system-ui,sans-serif",
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: 540,
                        background: '#FBF7F2',
                        borderRadius: '24px 24px 0 0',
                        padding: '28px 24px 40px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                    }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <p style={{ fontSize: 18, fontWeight: 600, color: '#3D231E', margin: 0 }}>
                            Schedule follow-up
                        </p>
                        <button
                            onClick={() => setShowFollowUpSheet(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                            <svg width="18" height="18" fill="none" stroke="#8C6A64" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    <p style={{ fontSize: 13, color: '#8C6A64', margin: '0 0 20px', lineHeight: 1.6 }}>
                        An email will be sent to <strong style={{ color: '#3D231E' }}>{client?.name || 'this client'}</strong> after the selected delay.
                    </p>

                    {/* Delay picker */}
                    <p style={{ fontSize: 11, color: '#8C6A64', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, margin: '0 0 10px' }}>Send after</p>
                    <div className="flex flex-wrap gap-2" style={{ marginBottom: 8 }}>
                        {FOLLOW_UP_DELAY_OPTIONS.map((opt) => (
                            <button
                                key={opt.days}
                                type="button"
                                onClick={() => setFuDelayDays(opt.days)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 10,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    fontFamily: 'inherit',
                                    cursor: 'pointer',
                                    background: fuDelayDays === opt.days ? '#3D231E' : 'transparent',
                                    color:      fuDelayDays === opt.days ? '#fff' : '#8C6A64',
                                    border:     `1.5px solid ${fuDelayDays === opt.days ? '#3D231E' : 'rgba(140,106,100,0.3)'}`,
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => setFuDelayDays('')}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 10,
                                fontSize: 13,
                                fontWeight: 600,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                background: !FOLLOW_UP_DELAY_OPTIONS.some(o => o.days === fuDelayDays) ? '#3D231E' : 'transparent',
                                color:      !FOLLOW_UP_DELAY_OPTIONS.some(o => o.days === fuDelayDays) ? '#fff' : '#8C6A64',
                                border:     `1.5px solid ${!FOLLOW_UP_DELAY_OPTIONS.some(o => o.days === fuDelayDays) ? '#3D231E' : 'rgba(140,106,100,0.3)'}`,
                            }}
                        >
                            Custom
                        </button>
                    </div>
                    {!FOLLOW_UP_DELAY_OPTIONS.some(o => o.days === fuDelayDays) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, marginBottom: 20 }}>
                            <input
                                type="number"
                                min={1}
                                value={fuCustomValue}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setFuCustomValue(v);
                                    setFuDelayDays(v ? (fuCustomUnit === 'months' ? Math.round(Number(v) * 30) : Number(v)) : '');
                                }}
                                placeholder="e.g. 6"
                                style={{
                                    width: 80, padding: '11px 12px', borderRadius: 10,
                                    border: '1.5px solid rgba(140,106,100,0.3)',
                                    background: '#fff', fontSize: 14, color: '#3D231E',
                                    fontFamily: 'inherit', outline: 'none', textAlign: 'center',
                                    boxSizing: 'border-box',
                                }}
                            />
                            <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1.5px solid rgba(140,106,100,0.3)' }}>
                                {['days', 'months'].map((unit) => (
                                    <button
                                        key={unit}
                                        type="button"
                                        onClick={() => {
                                            setFuCustomUnit(unit);
                                            if (fuCustomValue) {
                                                setFuDelayDays(unit === 'months' ? Math.round(Number(fuCustomValue) * 30) : Number(fuCustomValue));
                                            }
                                        }}
                                        style={{
                                            padding: '10px 14px',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            fontFamily: 'inherit',
                                            cursor: 'pointer',
                                            background: fuCustomUnit === unit ? '#3D231E' : 'transparent',
                                            color:      fuCustomUnit === unit ? '#fff' : '#8C6A64',
                                            border: 'none',
                                            textTransform: 'capitalize',
                                        }}
                                    >
                                        {unit}
                                    </button>
                                ))}
                            </div>
                            <span style={{ fontSize: 13, color: '#8C6A64' }}>from now</span>
                        </div>
                    )}
                    {FOLLOW_UP_DELAY_OPTIONS.some(o => o.days === fuDelayDays) && <div style={{ marginBottom: 20 }} />}

                    {/* Subject */}
                    <p style={{ fontSize: 11, color: '#8C6A64', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, margin: '0 0 8px' }}>Subject (optional)</p>
                    <input
                        value={fuSubject}
                        onChange={(e) => setFuSubject(e.target.value)}
                        placeholder="Time for your next session?"
                        style={{
                            width: '100%', padding: '13px 16px', borderRadius: 12,
                            border: '1.5px solid rgba(140,106,100,0.3)',
                            background: '#fff', fontSize: 14, color: '#3D231E',
                            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                            marginBottom: 16,
                        }}
                    />

                    {/* Message */}
                    <p style={{ fontSize: 11, color: '#8C6A64', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, margin: '0 0 8px' }}>Personal message (optional)</p>
                    <textarea
                        value={fuMessage}
                        onChange={(e) => setFuMessage(e.target.value)}
                        rows={4}
                        placeholder={`Hi ${client?.name?.split(' ')[0] || 'there'}, just checking in! It's been a while — I'd love to see you again whenever you're ready.`}
                        style={{
                            width: '100%', padding: '13px 16px', borderRadius: 12,
                            border: '1.5px solid rgba(140,106,100,0.3)',
                            background: '#fff', fontSize: 14, color: '#3D231E',
                            fontFamily: 'inherit', outline: 'none', resize: 'vertical',
                            boxSizing: 'border-box', marginBottom: 6,
                        }}
                    />
                    <p style={{ fontSize: 12, color: '#B0948F', margin: '0 0 20px' }}>Leave blank to use the default message.</p>

                    {fuError && (
                        <p style={{ fontSize: 13, color: '#B04040', margin: '0 0 12px' }}>{fuError}</p>
                    )}

                    <button
                        onClick={handleScheduleFollowUp}
                        disabled={fuSaving}
                        style={{
                            width: '100%', padding: '14px', borderRadius: 12,
                            border: 'none', background: '#3D231E', color: '#fff',
                            fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
                            opacity: fuSaving ? 0.7 : 1, cursor: fuSaving ? 'default' : 'pointer',
                        }}
                    >
                        {fuSaving ? 'Scheduling…' : `Schedule for ${FOLLOW_UP_DELAY_OPTIONS.find(o => o.days === fuDelayDays)?.label || (fuDelayDays ? `${fuDelayDays} days` : '…')} from now`}
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

export default ProviderClientTimeline;
