import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import HeroCard from '../components/ui/HeroCard';
import HeroPill from '../components/ui/HeroPill';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', success: '#5A8A5E' };
const F = "'Sora',system-ui,sans-serif";

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
    const { isDesktop } = useOutletContext() || {};

    const [provider, setProvider] = useState(null);
    const [stats, setStats] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!session?.accessToken) { setLoading(false); return; }

        const fetchRelationship = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/client/relationship/${providerId}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
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

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 960, margin: '0 auto' }}>
                    {/* Back button */}
                    <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: F, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 28, padding: 0 }}>
                        <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M19 12H5M5 12l7-7M5 12l7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Back
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 28, alignItems: 'start' }}>
                        {/* Left: HeroCard provider info */}
                        <div style={{ background: '#FDDCC6', borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden' }}>
                            {/* Topo texture */}
                            <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none', backgroundSize: 'cover', backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 200 Q 100 100 200 200 T 400 200' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3Cpath d='M-50 250 Q 50 150 150 250 T 350 250' stroke='%233D231E' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")` }} />
                            <div style={{ position: 'relative' }}>
                                {/* Avatar + name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                                    {loading ? (
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(61,35,30,0.1)' }} />
                                    ) : (
                                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 600, color: T.ink, fontFamily: F, flexShrink: 0 }}>{initials}</div>
                                    )}
                                    <div>
                                        {loading ? (
                                            <>
                                                <div style={{ height: 20, width: 120, background: 'rgba(61,35,30,0.1)', borderRadius: 6, marginBottom: 6 }} />
                                                <div style={{ height: 14, width: 80, background: 'rgba(61,35,30,0.08)', borderRadius: 4 }} />
                                            </>
                                        ) : (
                                            <>
                                                <p style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: T.ink, margin: '0 0 4px', letterSpacing: '-0.02em' }}>{provider?.name || 'Provider'}</p>
                                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>{role || 'Professional'}</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Connected pill */}
                                {!loading && connectedSince && (
                                    <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 9999, background: 'rgba(61,35,30,0.1)', fontFamily: F, fontSize: 11, fontWeight: 500, color: T.ink, marginBottom: 20, letterSpacing: '0.03em' }}>
                                        Connected · {connectedSince}
                                    </div>
                                )}

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
                                    <div>
                                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Sessions</span>
                                        <span style={{ fontFamily: F, fontSize: 32, fontWeight: 600, color: T.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{loading ? '—' : (stats?.sessions ?? 0)}</span>
                                    </div>
                                    <div>
                                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Last Visit</span>
                                        <span style={{ fontFamily: F, fontSize: 32, fontWeight: 600, color: T.accent, letterSpacing: '-0.02em', lineHeight: 1 }}>
                                            {loading ? '—' : (lastVisit ? new Date(lastVisit).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')}
                                        </span>
                                    </div>
                                </div>

                                {/* CTA buttons */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <button onClick={() => navigate('/app/booking-flow', { state: { providerId } })} style={{ padding: '12px', borderRadius: 12, background: T.ink, border: 'none', fontFamily: F, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                                        Book a Session →
                                    </button>
                                    <button onClick={() => navigate('/app/messages', { state: { providerId } })} style={{ padding: '12px', borderRadius: 12, background: 'transparent', border: '1.5px solid rgba(61,35,30,0.25)', fontFamily: F, fontSize: 14, fontWeight: 600, color: T.ink, cursor: 'pointer' }}>
                                        Message →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Timeline */}
                        <div>
                            <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 16 }}>Connected Timeline</span>

                            {error && <p style={{ fontFamily: F, fontSize: 14, color: T.muted }}>{error}</p>}

                            {/* Loading skeleton */}
                            {loading && [1, 2, 3].map((i) => (
                                <div key={i} style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(140,106,100,0.2)', marginTop: 4 }} />
                                        {i < 3 && <div style={{ flex: 1, width: 1, background: 'rgba(140,106,100,0.15)', marginTop: 4 }} />}
                                    </div>
                                    <div style={{ flex: 1, paddingBottom: 12 }}>
                                        <div style={{ height: 14, width: 160, background: 'rgba(140,106,100,0.1)', borderRadius: 6, marginBottom: 6 }} />
                                        <div style={{ height: 12, width: 100, background: 'rgba(140,106,100,0.08)', borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))}

                            {/* Empty */}
                            {!loading && !error && bookings.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                                    <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: '0 0 4px' }}>No sessions yet</p>
                                    <p style={{ fontFamily: F, fontSize: 13, color: T.faded, margin: 0 }}>Book your first session to start your timeline.</p>
                                </div>
                            )}

                            {/* Bookings — reuse the existing BookingCard component */}
                            {!loading && !error && bookings.length > 0 && bookings.map((booking, i) => (
                                <BookingCard
                                    key={booking.id}
                                    booking={booking}
                                    isFirst={i === bookings.length - 1}
                                    isLast={i === bookings.length - 1}
                                    onRebook={() => navigate('/app/booking-flow', { state: { providerId, serviceId: booking.service_id } })}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
