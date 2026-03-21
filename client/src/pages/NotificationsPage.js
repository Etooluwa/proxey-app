/**
 * NotificationsPage — v6 Warm Editorial
 * Route: /app/notifications          → limited preview (3 most recent)
 * Route: /app/notifications?all=1   → full list
 *
 * Data from NotificationContext (real-time via Supabase).
 * Type map: booking_accepted/time_request_accepted → "accepted"
 *           booking_declined/time_request_declined → "rejected"
 *           connected                              → "connected"
 *           reminder / upcoming_session            → "reminder"
 *           (default)                              → "reminder"
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';
import HeroCard from '../components/ui/HeroCard';

// ─── Type normalisation ───────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set([
    'booking_accepted', 'appointment_accepted', 'time_request_accepted',
]);
const REJECTED_TYPES = new Set([
    'booking_declined', 'appointment_declined', 'time_request_declined',
    'booking_cancelled',
]);
const CONNECTED_TYPES = new Set(['connected', 'new_connection']);
const REMINDER_TYPES = new Set(['reminder', 'upcoming_session']);

function normaliseType(rawType) {
    if (!rawType) return 'reminder';
    if (ACCEPTED_TYPES.has(rawType)) return 'accepted';
    if (REJECTED_TYPES.has(rawType)) return 'rejected';
    if (CONNECTED_TYPES.has(rawType)) return 'connected';
    return 'reminder';
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE = {
    accepted: {
        bg: '#5A8A5E',
        icon: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    rejected: {
        bg: '#B04040',
        icon: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
        ),
    },
    connected: {
        bg: '#C25E4A',
        icon: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    reminder: {
        bg: '#8C6A64',
        icon: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) {
    return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// Extract provider/client initials from notification data
function initialsFromNotif(n) {
    const name =
        n.data?.provider_name ||
        n.data?.client_name ||
        n.data?.other_name ||
        n.title?.split(' ')[0] ||
        '?';
    return getInitials(name);
}

// Extract a decline reason from notification data
function declineReason(n) {
    return n.data?.reason || n.data?.decline_reason || null;
}

// Extract a booking_id to link Pay Now
function bookingId(n) {
    return n.data?.booking_id || n.booking_id || null;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const Empty = () => (
    <div className="py-14 flex flex-col items-center">
        <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(194,94,74,0.08)' }}
        >
            <svg width="24" height="24" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M15 17H20L18.595 15.595A1.98 1.98 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <p className="text-[15px] font-semibold text-ink mb-1">All caught up</p>
        <p className="text-[13px] text-muted text-center px-8">No notifications yet. Check back after your next booking.</p>
    </div>
);

// ─── Single notification item ─────────────────────────────────────────────────

const NotifItem = ({ n, onMarkRead, onPayNow }) => {
    const type = normaliseType(n.type);
    const badge = BADGE[type];
    const unread = !n.is_read && !n.read;
    const reason = declineReason(n);
    const bid = bookingId(n);
    const ts = n.timestamp || n.created_at;

    return (
        <div>
            <div
                className="flex gap-3.5 py-5"
                style={{ opacity: unread ? 1 : 0.55 }}
            >
                {/* Avatar + badge */}
                <div className="relative flex-shrink-0">
                    <Avatar initials={initialsFromNotif(n)} size={44} />
                    <div
                        className="absolute flex items-center justify-center rounded-full"
                        style={{
                            bottom: -2,
                            right: -2,
                            width: 22,
                            height: 22,
                            background: badge.bg,
                            border: '2px solid #FBF7F2',
                        }}
                    >
                        {badge.icon}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                            className="text-[15px] text-ink m-0"
                            style={{ fontWeight: unread ? 600 : 400 }}
                        >
                            {n.title}
                        </p>
                        {unread && (
                            <div
                                className="w-2 h-2 rounded-full flex-shrink-0 mt-[6px]"
                                style={{ background: '#C25E4A' }}
                            />
                        )}
                    </div>

                    {/* Body */}
                    <p className="text-[13px] text-muted leading-relaxed m-0 mb-1.5">
                        {n.message || n.body}
                    </p>

                    {/* Decline reason block */}
                    {reason && (
                        <div
                            className="px-3.5 py-2.5 rounded-[10px] mb-2"
                            style={{ background: '#F2EBE5' }}
                        >
                            <Lbl className="block mb-1" style={{ fontSize: 9 }}>Reason</Lbl>
                            <p className="text-[13px] text-ink leading-relaxed m-0 italic">
                                "{reason}"
                            </p>
                        </div>
                    )}

                    {/* Footer row: timestamp + Pay Now */}
                    <div className="flex items-center justify-between gap-3">
                        <Lbl style={{ fontSize: '10px' }}>{formatRelTime(ts)}</Lbl>
                        {type === 'accepted' && bid && unread && (
                            <button
                                onClick={() => onPayNow(bid)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white focus:outline-none"
                                style={{ background: '#3D231E' }}
                            >
                                Pay Now
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <Divider />
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const NotificationsPage = ({ showAll: showAllProp = false }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const showAll = showAllProp || searchParams.get('all') === '1';

    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

    const displayed = showAll ? notifications : notifications.slice(0, 3);
    const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length;

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    const handlePayNow = (bid) => {
        navigate('/app/booking-flow', { state: { bookingId: bid } });
    };

    const handleViewAll = () => {
        setSearchParams({ all: '1' });
    };

    const handleBack = () => {
        if (showAll) {
            setSearchParams({});
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-base">
            {/* ── Header */}
            <div className="flex items-center gap-3 px-5 pt-10 pb-4">
                <BackBtn onClick={handleBack} />
                <p className="flex-1 text-[13px] font-semibold text-ink m-0">
                    {showAll ? 'All Notifications' : 'Notifications'}
                </p>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-accent focus:outline-none uppercase tracking-[0.04em]"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            {/* ── Content */}
            <div className="px-5 flex-1 flex flex-col">
                <Divider />

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-14">
                        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                    </div>
                )}

                {/* Empty */}
                {!loading && notifications.length === 0 && <Empty />}

                {/* Items */}
                {!loading && notifications.length > 0 && (
                    <>
                        {displayed.map((n) => (
                            <NotifItem
                                key={n.id}
                                n={n}
                                onMarkRead={markAsRead}
                                onPayNow={handlePayNow}
                            />
                        ))}

                        {/* View All button — only on preview */}
                        {!showAll && (
                            <button
                                onClick={handleViewAll}
                                className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-[12px] text-[14px] font-semibold text-ink focus:outline-none"
                                style={{ border: '1px solid rgba(140,106,100,0.2)' }}
                            >
                                View All Notifications
                                <Lbl style={{ fontSize: '10px', margin: 0 }}>
                                    {notifications.length}
                                </Lbl>
                            </button>
                        )}
                    </>
                )}

                <Footer />
            </div>
        </div>
    );
};

export default NotificationsPage;
