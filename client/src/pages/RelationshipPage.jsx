import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import HeroCard from '../components/ui/HeroCard';
import HeroPill from '../components/ui/HeroPill';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(iso) {
    if (!iso) return '—';
    // e.g. "Jan 2026"
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

function getInitials(name) {
    return (name || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// ─── Timeline dot color by booking status ─────────────────────────────────────
// completed → success green  |  upcoming (pending/confirmed) → accent  |  milestone (first) → gold

function dotColor(booking, isFirst) {
    if (isFirst) return '#D4A017'; // gold milestone
    if (booking.status === 'completed') return '#5A8A5E';
    if (booking.status === 'cancelled') return '#B0948F';
    return '#C25E4A'; // pending / confirmed → accent
}

// ─── Hero provider avatar — translucent white circle ─────────────────────────

const HeroAvatar = ({ initials }) => (
    <div
        className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-semibold text-ink flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
        {initials}
    </div>
);

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

const Shimmer = ({ className }) => (
    <div className={`bg-line/60 rounded animate-pulse ${className}`} />
);

// ─── Timeline booking card ────────────────────────────────────────────────────

const BookingCard = ({ booking, isFirst, isLast, onRebook }) => {
    const dot = dotColor(booking, isFirst);
    const isUpcoming = booking.status === 'pending' || booking.status === 'confirmed';

    return (
        <div className="flex gap-4">
            {/* Spine */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                <div className="mt-5 flex-shrink-0">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: dot, border: '2px solid #FBF7F2' }}
                    />
                </div>
                {!isLast && (
                    <div className="flex-1 w-px mt-1" style={{ background: 'rgba(140,106,100,0.25)' }} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-5">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex-1 min-w-0 pr-3">
                        <p className="text-[15px] font-semibold text-ink m-0 mb-0.5 truncate">
                            {booking.service_name || 'Session'}
                            {isFirst && (
                                <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.05em] text-[#D4A017]">
                                    First
                                </span>
                            )}
                        </p>
                        <p className="text-[13px] text-muted m-0">
                            {formatDate(booking.scheduled_at)}
                            {booking.duration ? ` · ${formatDuration(booking.duration)}` : ''}
                        </p>
                    </div>
                    {booking.price != null && (
                        <span className="text-[15px] font-semibold text-ink flex-shrink-0">
                            {formatPrice(booking.price)}
                        </span>
                    )}
                </div>

                {booking.notes && (
                    <p className="text-[13px] text-muted leading-relaxed mt-1.5 mb-2">
                        {booking.notes}
                    </p>
                )}

                {/* Status pill */}
                <div className="flex items-center gap-2 mt-2">
                    {isUpcoming ? (
                        <span
                            className="text-[11px] font-medium uppercase tracking-[0.05em] px-2 py-0.5 rounded-pill"
                            style={{ background: 'rgba(194,94,74,0.1)', color: '#C25E4A' }}
                        >
                            Upcoming
                        </span>
                    ) : booking.status === 'completed' ? (
                        <span
                            className="text-[11px] font-medium uppercase tracking-[0.05em] px-2 py-0.5 rounded-pill"
                            style={{ background: '#EBF2EC', color: '#5A8A5E' }}
                        >
                            Completed
                        </span>
                    ) : booking.status === 'cancelled' ? (
                        <span
                            className="text-[11px] font-medium uppercase tracking-[0.05em] px-2 py-0.5 rounded-pill text-faded"
                            style={{ background: 'rgba(140,106,100,0.1)' }}
                        >
                            Cancelled
                        </span>
                    ) : null}

                    {!isUpcoming && booking.status !== 'cancelled' && (
                        <button
                            onClick={onRebook}
                            className="text-[12px] font-semibold text-accent focus:outline-none"
                        >
                            Rebook →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

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
        if (!session?.access_token) return;

        const fetchRelationship = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/client/relationship/${providerId}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
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

        fetchRelationship();
    }, [providerId, session]);

    const initials = getInitials(provider?.name);
    const role = provider?.categories?.[0] || null;
    const connectedSince = stats?.together_since ? formatShortDate(stats.together_since) : null;
    const lastVisit = bookings.find(b => b.status === 'completed')?.scheduled_at;

    return (
        <div className="flex flex-col min-h-screen bg-base">

            {/* ── Back nav ── */}
            <div className="flex items-center px-4 pt-3 pb-2">
                <BackBtn onClick={() => navigate(-1)} />
            </div>

            {/* ── Hero card ── */}
            <div className="px-5 mb-5">
                <HeroCard>
                    {/* Provider identity */}
                    <div className="flex items-center gap-4 mb-5">
                        {loading ? (
                            <Shimmer className="w-16 h-16 rounded-full" />
                        ) : (
                            <HeroAvatar initials={initials} />
                        )}
                        <div className="flex-1 min-w-0">
                            {loading ? (
                                <>
                                    <Shimmer className="h-5 w-32 mb-2" />
                                    <Shimmer className="h-3.5 w-20" />
                                </>
                            ) : (
                                <>
                                    <p className="text-[22px] font-semibold text-ink m-0 mb-0.5 leading-tight tracking-[-0.02em]">
                                        {provider?.name || 'Provider'}
                                    </p>
                                    <p className="text-[14px] text-muted m-0">
                                        {role || 'Professional'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Connected pill */}
                    {!loading && connectedSince && (
                        <div className="mb-5">
                            <HeroPill>Connected · {connectedSince}</HeroPill>
                        </div>
                    )}

                    {/* Stats row */}
                    <div className="flex gap-6">
                        <div>
                            <Lbl>Sessions</Lbl>
                            <p className="text-[28px] font-semibold text-accent tracking-[-0.02em] m-0 leading-tight">
                                {loading ? '—' : (stats?.sessions ?? 0)}
                            </p>
                        </div>
                        <div>
                            <Lbl>Last Visit</Lbl>
                            <p className="text-[28px] font-semibold text-accent tracking-[-0.02em] m-0 leading-tight">
                                {loading ? '—' : (lastVisit
                                    ? new Date(lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                    : '—'
                                )}
                            </p>
                        </div>
                    </div>
                </HeroCard>
            </div>

            {/* ── CTA buttons ── */}
            <div className="px-5 flex gap-3 mb-7">
                <button
                    onClick={() => navigate('/app/booking-flow', { state: { providerId } })}
                    className="flex-1 py-3.5 rounded-pill bg-ink text-white text-[14px] font-semibold focus:outline-none active:opacity-80 transition-opacity"
                >
                    Book a Session →
                </button>
                <button
                    onClick={() => navigate('/app/messages', { state: { providerId } })}
                    className="flex-1 py-3.5 rounded-pill text-ink text-[14px] font-semibold focus:outline-none active:opacity-80 transition-opacity"
                    style={{ border: '1.5px solid rgba(140,106,100,0.35)' }}
                >
                    Message →
                </button>
            </div>

            {/* ── Timeline ── */}
            <div className="px-5 flex-1 flex flex-col">
                {error && (
                    <p className="text-[14px] text-muted text-center py-8">{error}</p>
                )}

                {!error && (
                    <>
                        <Lbl className="block mb-3">Connected Timeline</Lbl>

                        {/* Loading skeleton */}
                        {loading && (
                            <div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-4 mb-4">
                                        <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                                            <div className="mt-5 w-3 h-3 rounded-full bg-line" />
                                            {i < 3 && <div className="flex-1 w-px bg-line mt-1" />}
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
                            <div className="flex flex-col items-center py-10">
                                <p className="text-[14px] text-muted text-center">No sessions yet</p>
                                <p className="text-[13px] text-faded text-center mt-1">
                                    Book your first session to start your timeline.
                                </p>
                            </div>
                        )}

                        {/* Booking rows */}
                        {!loading && bookings.length > 0 && (
                            <div>
                                {bookings.map((booking, i) => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        isFirst={i === bookings.length - 1} // oldest = first = milestone
                                        isLast={i === bookings.length - 1}
                                        onRebook={() =>
                                            navigate('/app/booking-flow', {
                                                state: { providerId, serviceId: booking.service_id },
                                            })
                                        }
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

export default RelationshipPage;
