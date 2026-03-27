import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';
import { supabase } from '../utils/supabase';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Footer from '../components/ui/Footer';

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

function getInitials(name) {
    return (name || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtDateTime(iso) {
    if (!iso) return 'TBD';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
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

function getLocalDateKey(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getClientBookingTab(booking, todayKey = getLocalDateKey()) {
    const status = String(booking?.status || '').toLowerCase();
    const bookingDateKey = getLocalDateKey(booking?.scheduled_at);

    if (status === 'pending') return 'pending';
    if (status === 'completed' || status === 'cancelled') return 'past';
    if (status === 'confirmed') {
        if (!bookingDateKey || !todayKey) return 'upcoming';
        return bookingDateKey < todayKey ? 'past' : 'upcoming';
    }

    return null;
}

// ─── Status pill config ───────────────────────────────────────────────────────
function getStatusStyle(status) {
    switch (status) {
        case 'pending':
            return { background: '#FFF5E6', color: '#92400E', label: 'Pending' };
        case 'confirmed':
            return { background: T.successBg, color: T.success, label: 'Confirmed' };
        case 'completed':
            return { background: T.successBg, color: T.success, label: 'Completed' };
        case 'cancelled':
            return { background: T.dangerBg, color: '#B04040', label: 'Cancelled' };
        default:
            return { background: T.avatarBg, color: T.muted, label: status };
    }
}

// ─── TabBar ───────────────────────────────────────────────────────────────────
function TabBar({ tabs, activeTab, onTabChange }) {
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        style={{
                            flex: 1,
                            borderRadius: 14,
                            padding: '14px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 4,
                            background: isActive ? T.hero : T.card,
                            border: isActive ? `2px solid ${T.accent}` : `1px solid rgba(140,106,100,0.18)`,
                            cursor: 'pointer',
                            fontFamily: F,
                        }}
                    >
                        <span
                            style={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: isActive ? T.accent : T.ink,
                            }}
                        >
                            {tab.count}
                        </span>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 500,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                color: T.muted,
                            }}
                        >
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

// ─── BookingRow ───────────────────────────────────────────────────────────────
function BookingRow({ booking, onTap, showReview }) {
    const statusStyle = getStatusStyle(booking.status);
    const subtitle = [booking.service_name, fmtDuration(booking.duration)]
        .filter(Boolean)
        .join(' · ');
    const price = fmtPrice(booking.price);

    return (
        <div
            onClick={onTap || undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 0',
                borderBottom: `1px solid ${T.line}`,
                cursor: onTap ? 'pointer' : 'default',
            }}
        >
            {/* Avatar */}
            <Avatar
                initials={getInitials(booking.provider_name)}
                size={40}
                bg={T.avatarBg}
                color={T.muted}
            />

            {/* Middle */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontFamily: F,
                        fontSize: 15,
                        fontWeight: 500,
                        color: T.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {booking.provider_name || 'Provider'}
                </div>
                {subtitle && (
                    <div
                        style={{
                            fontFamily: F,
                            fontSize: 13,
                            color: T.muted,
                            marginTop: 2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {subtitle}
                    </div>
                )}
            </div>

            {/* Right */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {price && (
                    <div
                        style={{
                            fontFamily: F,
                            fontSize: 14,
                            fontWeight: 600,
                            color: T.ink,
                        }}
                    >
                        {price}
                    </div>
                )}
                <div
                    style={{
                        fontFamily: F,
                        fontSize: 12,
                        color: T.muted,
                        marginTop: 2,
                    }}
                >
                    {fmtDateTime(booking.scheduled_at)}
                </div>
                <div style={{ marginTop: 4 }}>
                    <span
                        style={{
                            fontFamily: F,
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            display: 'inline-block',
                            background: statusStyle.background,
                            color: statusStyle.color,
                        }}
                    >
                        {statusStyle.label}
                    </span>
                </div>
                {showReview && booking.status === 'completed' && !booking.reviewed && (
                    <div
                        style={{
                            fontFamily: F,
                            fontSize: 12,
                            color: T.accent,
                            fontWeight: 500,
                            marginTop: 4,
                        }}
                    >
                        Leave a review →
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState({ message }) {
    return (
        <div
            style={{
                textAlign: 'center',
                padding: '48px 0',
                fontFamily: F,
                fontSize: 14,
                color: T.muted,
            }}
        >
            {message}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientBookings() {
    const { onMenu, isDesktop } = useOutletContext();
    const navigate = useNavigate();
    const { session } = useSession();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        const loadBookings = () => request('/bookings/me')
            .then((data) => setBookings(data?.bookings || []))
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));

        loadBookings();
    }, []);

    useEffect(() => {
        if (!supabase || !session?.user?.id) return undefined;

        const refresh = () => {
            request('/bookings/me')
                .then((data) => setBookings(data?.bookings || []))
                .catch(() => {});
        };

        const channel = supabase
            .channel(`client-bookings:${session.user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `client_id=eq.${session.user.id}`,
            }, refresh)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

    const todayKey = getLocalDateKey();

    const pending = bookings
        .filter((b) => getClientBookingTab(b, todayKey) === 'pending')
        .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const upcoming = bookings
        .filter((b) => getClientBookingTab(b, todayKey) === 'upcoming')
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

    const past = bookings
        .filter((b) => getClientBookingTab(b, todayKey) === 'past')
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

    const tabs = [
        { id: 'pending', label: 'Pending', count: pending.length },
        { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
        { id: 'past', label: 'Past', count: past.length },
    ];

    function getRows() {
        if (activeTab === 'pending') return pending;
        if (activeTab === 'upcoming') return upcoming;
        return past;
    }

    function getEmptyMessage() {
        if (activeTab === 'pending') return 'No pending bookings.';
        if (activeTab === 'upcoming') return 'No upcoming sessions.';
        return 'No past sessions yet.';
    }

    function handleRowTap(booking) {
        if (activeTab === 'pending') return undefined;
        return () => navigate(`/app/relationship/${booking.provider_id}`);
    }

    const rows = getRows();

    // ── Desktop layout ────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ marginBottom: 24 }}>
                        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                    <div
                        style={{
                            background: T.card,
                            borderRadius: 16,
                            border: `1px solid ${T.line}`,
                            padding: '0 24px',
                        }}
                    >
                        {loading ? (
                            <EmptyState message="Loading…" />
                        ) : rows.length === 0 ? (
                            <EmptyState message={getEmptyMessage()} />
                        ) : (
                            rows.map((b) => (
                                <BookingRow
                                    key={b.id}
                                    booking={b}
                                    onTap={activeTab !== 'pending' ? () => navigate(`/app/relationship/${b.provider_id}`) : undefined}
                                    showReview={activeTab === 'past'}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Mobile layout ─────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col min-h-screen" style={{ background: T.base }}>
            <Header onMenu={onMenu} />
            <div style={{ padding: '16px 20px 8px' }}>
                <h1
                    style={{
                        fontFamily: F,
                        fontSize: 32,
                        fontWeight: 600,
                        color: T.ink,
                        letterSpacing: '-0.03em',
                        margin: 0,
                    }}
                >
                    Bookings
                </h1>
            </div>

            {/* TabBar */}
            <div style={{ padding: '0 20px 20px' }}>
                <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '0 20px' }}>
                {loading ? (
                    <EmptyState message="Loading…" />
                ) : rows.length === 0 ? (
                    <EmptyState message={getEmptyMessage()} />
                ) : (
                    rows.map((b) => (
                        <BookingRow
                            key={b.id}
                            booking={b}
                            onTap={activeTab !== 'pending' ? () => navigate(`/app/relationship/${b.provider_id}`) : undefined}
                            showReview={activeTab === 'past'}
                        />
                    ))
                )}
            </div>

            <Footer />
        </div>
    );
}
