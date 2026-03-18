import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';
import Footer from '../components/ui/Footer';
import Nav from '../components/ui/Nav';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: "'yy" });
}

function formatDuration(minutes) {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} hr ${m} min` : `${h} hr`;
}

function formatPrice(cents) {
    if (!cents && cents !== 0) return null;
    return `$${(cents / 100).toFixed(0)}`;
}

// ─── Frosted stat card (inside gradient header) ───────────────────────────────

const StatCard = ({ label, value }) => (
    <div
        className="flex-1 rounded-card px-2.5 py-3"
        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
    >
        <p className="font-manrope text-[11px] text-white/70 m-0 mb-1">{label}</p>
        <p className="font-manrope text-[18px] font-bold text-white m-0 leading-tight">{value}</p>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const RelationshipPage = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { session } = useSession();

    const [provider, setProvider] = useState(null);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRelationship = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/client/relationship/${providerId}`, {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                if (!res.ok) throw new Error('Failed to load');
                const data = await res.json();
                setProvider(data.provider);
                setStats(data.stats);
                setBookings(data.bookings || []);
            } catch (err) {
                console.error('Failed to load relationship:', err);
                setError('Could not load relationship data.');
            } finally {
                setLoading(false);
            }
        };

        if (session?.access_token) fetchRelationship();
    }, [providerId, session]);

    // Derived provider display values
    const initials = (provider?.name || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const role = provider?.categories?.[0] || null;

    return (
        <div className="flex flex-col min-h-screen bg-background font-manrope">

            {/* ── Gradient header ── */}
            <div
                className="relative z-10 px-5 pb-12 rounded-b-header -mb-5 flex-shrink-0"
                style={{
                    background: 'linear-gradient(180deg, #D45400 0%, #E87020 40%, #F09050 65%, #F5C4A0 82%, #F2F2F7 100%)',
                }}
            >
                {/* Back button row */}
                <div className="pt-1 mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="-m-2 p-2 flex items-center justify-center focus:outline-none"
                        aria-label="Back"
                    >
                        <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Provider identity */}
                <div className="flex items-center gap-3.5 mb-4">
                    <Avatar
                        initials={initials}
                        src={provider?.avatar || undefined}
                        size={60}
                        variant="glass"
                    />
                    <div>
                        <p className="font-manrope text-[22px] font-bold text-white m-0 mb-0.5 leading-tight">
                            {loading ? '—' : (provider?.name || 'Provider')}
                        </p>
                        <p className="font-manrope text-[14px] text-white/80 m-0">
                            {loading ? '' : (role || 'Professional')}
                        </p>
                    </div>
                </div>

                {/* Frosted stat cards */}
                {!loading && stats && (
                    <div className="flex gap-2.5">
                        <StatCard
                            label="Together since"
                            value={stats.together_since ? formatShortDate(stats.together_since) : '—'}
                        />
                        <StatCard label="Sessions" value={stats.sessions ?? 0} />
                        <StatCard
                            label="Spent"
                            value={stats.total_spent ? formatPrice(stats.total_spent) : '$0'}
                        />
                    </div>
                )}
                {loading && (
                    <div className="flex gap-2.5">
                        {['Together since', 'Sessions', 'Spent'].map((l) => (
                            <div
                                key={l}
                                className="flex-1 rounded-card px-2.5 py-3"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                            >
                                <p className="font-manrope text-[11px] text-white/50 m-0 mb-1">{l}</p>
                                <div className="h-5 w-12 rounded bg-white/20" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Body ── */}
            <div className="px-4 pt-8 flex-1 flex flex-col">

                {error && (
                    <p className="font-manrope text-[14px] text-muted text-center py-8">{error}</p>
                )}

                {!error && (
                    <>
                        {/* Action buttons */}
                        <div className="flex gap-2 mb-6">
                            <button
                                onClick={() =>
                                    navigate('/app/booking-flow', {
                                        state: { providerId },
                                    })
                                }
                                className="flex-1 py-3.5 rounded-card font-manrope text-[15px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
                                style={{ background: '#0D1619' }}
                            >
                                Book appointment
                            </button>
                            <button
                                onClick={() =>
                                    navigate('/app/messages', {
                                        state: { providerId },
                                    })
                                }
                                className="flex-1 py-3.5 rounded-card font-manrope text-[15px] font-semibold text-foreground bg-card focus:outline-none active:scale-[0.98] transition-transform"
                                style={{ border: '1px solid #E5E5EA' }}
                            >
                                Message
                            </button>
                        </div>

                        {/* History heading */}
                        <p className="font-manrope text-[18px] font-bold text-foreground m-0 mb-3.5 px-1">
                            History
                        </p>

                        {/* Loading skeleton rows */}
                        {loading && (
                            <div className="space-y-0">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-0">
                                        <div className="flex flex-col items-center w-6 flex-shrink-0 pt-5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-divider flex-shrink-0" />
                                            {i < 3 && <div className="w-0.5 flex-1 bg-divider mt-[-1px]" />}
                                        </div>
                                        <div className="flex-1 mb-3">
                                            <div className="bg-card rounded-card shadow-card p-4 animate-pulse">
                                                <div className="h-4 bg-divider rounded w-2/3 mb-2" />
                                                <div className="h-3 bg-divider rounded w-1/3" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Empty history */}
                        {!loading && bookings.length === 0 && (
                            <div className="flex flex-col items-center py-10 gap-2">
                                <p className="font-manrope text-[15px] text-muted text-center">
                                    No sessions yet
                                </p>
                            </div>
                        )}

                        {/* Timeline */}
                        {!loading && bookings.length > 0 && (
                            <div>
                                {bookings.map((booking, i) => {
                                    const isFirst = i === 0;
                                    const isLast = i === bookings.length - 1;
                                    const dotColor = isFirst ? '#FF751F' : '#22C55E';

                                    return (
                                        <div key={booking.id} className="flex">
                                            {/* Timeline spine */}
                                            <div className="flex flex-col items-center w-6 flex-shrink-0 pt-5">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 z-[1]"
                                                    style={{
                                                        background: dotColor,
                                                        border: '2px solid #F2F2F7',
                                                    }}
                                                />
                                                {!isLast && (
                                                    <div
                                                        className="w-0.5 flex-1 mt-[-1px]"
                                                        style={{ background: '#E5E5EA' }}
                                                    />
                                                )}
                                            </div>

                                            {/* Card */}
                                            <div className="flex-1 mb-3">
                                                <Card>
                                                    {/* Header row: service name + price */}
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex-1 min-w-0 pr-3">
                                                            <p className="font-manrope text-[16px] font-semibold text-foreground m-0 mb-0.5 truncate">
                                                                {booking.service_name || 'Service'}
                                                            </p>
                                                            <p className="font-manrope text-[13px] text-muted m-0">
                                                                {formatDate(booking.scheduled_at)}
                                                                {booking.duration
                                                                    ? ` · ${formatDuration(booking.duration)}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                        {booking.price != null && (
                                                            <span className="font-manrope text-[15px] font-semibold text-foreground flex-shrink-0">
                                                                {formatPrice(booking.price)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Notes */}
                                                    {booking.notes && (
                                                        <p
                                                            className="font-manrope text-[14px] text-muted m-0 mt-2 mb-2.5"
                                                            style={{ lineHeight: 1.5 }}
                                                        >
                                                            {booking.notes}
                                                        </p>
                                                    )}

                                                    {/* Rebook button */}
                                                    <button
                                                        onClick={() =>
                                                            navigate('/app/booking-flow', {
                                                                state: {
                                                                    providerId,
                                                                    serviceId: booking.service_id,
                                                                },
                                                            })
                                                        }
                                                        className="mt-2 px-3.5 py-1.5 rounded-pill font-manrope text-[13px] font-semibold text-foreground bg-background focus:outline-none active:scale-[0.98] transition-transform"
                                                        style={{ border: '1px solid #E5E5EA' }}
                                                    >
                                                        Rebook
                                                    </button>
                                                </Card>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default RelationshipPage;
