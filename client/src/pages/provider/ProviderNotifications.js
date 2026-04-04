/**
 * ProviderNotifications — v6 Warm Editorial
 * Route: /provider/notifications          → limited preview (3 most recent)
 * Route: /provider/notifications?all=1   → full list
 *
 * Data from NotificationContext (real-time Supabase).
 * Type map:
 *   booking_request / new_booking / time_request → "booking"
 *   booking_completed / completed               → "completed"
 *   connected / new_client / new_connection     → "connected"
 *   (default)                                   → "reminder"
 */
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import BackBtn from '../../components/ui/BackBtn';
import Avatar from '../../components/ui/Avatar';
import Lbl from '../../components/ui/Lbl';
import Divider from '../../components/ui/Divider';
import Footer from '../../components/ui/Footer';

// ─── Type normalisation ───────────────────────────────────────────────────────

const BOOKING_TYPES = new Set([
    'booking_request', 'new_booking', 'time_request', 'appointment_request',
    'booking_accepted', 'appointment_accepted',
    'booking_cancelled', 'booking_rescheduled',
]);
const COMPLETED_TYPES = new Set([
    'booking_completed', 'completed', 'session_completed',
]);
const CONNECTED_TYPES = new Set([
    'connected', 'new_client', 'new_connection',
]);
const MESSAGE_TYPES = new Set([
    'new_message',
]);
const REVIEW_TYPES = new Set([
    'new_review',
]);
const PAYMENT_SUCCESS_TYPES = new Set([
    'payment_succeeded',
]);
const PAYMENT_FAILED_TYPES = new Set([
    'payment_failed',
]);

function normaliseType(rawType) {
    if (!rawType) return 'reminder';
    const t = rawType.toLowerCase();
    if (BOOKING_TYPES.has(t)) return 'booking';
    if (COMPLETED_TYPES.has(t)) return 'completed';
    if (CONNECTED_TYPES.has(t)) return 'connected';
    if (MESSAGE_TYPES.has(t)) return 'message';
    if (REVIEW_TYPES.has(t)) return 'review';
    if (PAYMENT_SUCCESS_TYPES.has(t)) return 'completed';
    if (PAYMENT_FAILED_TYPES.has(t)) return 'payment_failed';
    return 'reminder';
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE = {
    // Accent calendar icon — new booking
    booking: {
        bg: '#C25E4A',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
            </svg>
        ),
    },
    // Green person+ icon — new client connected
    connected: {
        bg: '#5A8A5E',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" strokeLinecap="round" />
                <line x1="22" y1="11" x2="16" y2="11" strokeLinecap="round" />
            </svg>
        ),
    },
    // Gray check — session completed
    completed: {
        bg: '#8C6A64',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    message: {
        bg: '#3D231E',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    review: {
        bg: '#5A8A5E',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    payment_failed: {
        bg: '#B04040',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 8v5" strokeLinecap="round" />
                <path d="M12 16.5h.01" strokeLinecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    // Muted clock — reminder / default
    reminder: {
        bg: '#B0948F',
        icon: (
            <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="1.75" viewBox="0 0 24 24">
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

function initialsFromNotif(n) {
    const name =
        n.data?.client_name ||
        n.data?.sender_name ||
        n.data?.other_name ||
        n.title?.split(' ')[0] ||
        '?';
    return getInitials(name);
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
        <p className="text-[13px] text-muted text-center px-8">
            Booking requests, new clients, and session updates will appear here.
        </p>
    </div>
);

// ─── Single notification item ─────────────────────────────────────────────────

const NotifItem = ({ n, onAction }) => {
    const type = normaliseType(n.type);
    const badge = BADGE[type];
    const unread = !n.is_read && !n.read;
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

                    {/* Footer row: timestamp + action CTA */}
                    <div className="flex items-center justify-between gap-3">
                        <Lbl style={{ fontSize: '10px' }}>{formatRelTime(ts)}</Lbl>
                        {type === 'booking' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white focus:outline-none"
                                style={{ background: '#3D231E' }}
                            >
                                View Request
                            </button>
                        )}
                        {type === 'connected' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold focus:outline-none"
                                style={{ background: '#EBF2EC', color: '#3D6B41' }}
                            >
                                View Client
                            </button>
                        )}
                        {type === 'message' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white focus:outline-none"
                                style={{ background: '#3D231E' }}
                            >
                                Open Chat
                            </button>
                        )}
                        {type === 'review' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold focus:outline-none"
                                style={{ background: '#EBF2EC', color: '#3D6B41' }}
                            >
                                View Review
                            </button>
                        )}
                        {type === 'completed' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold focus:outline-none"
                                style={{ background: '#EBF2EC', color: '#3D6B41' }}
                            >
                                View Booking
                            </button>
                        )}
                        {type === 'payment_failed' && unread && (
                            <button
                                onClick={() => onAction(n)}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold focus:outline-none"
                                style={{ background: '#FDEDEA', color: '#8F2E2E' }}
                            >
                                View Payment
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

const ProviderNotifications = ({ showAll: showAllProp = false }) => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const showAll = showAllProp || searchParams.get('all') === '1';

    const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

    const displayed = showAll ? notifications : notifications.slice(0, 3);
    const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length;

    const handleMarkAllRead = () => markAllAsRead();

    const handleViewAll = () => setSearchParams({ all: '1' }, { replace: true });

    const handleBack = () => {
        if (showAll) {
            setSearchParams({}, { replace: true });
        } else {
            navigate(-1);
        }
    };

    const handleAction = (n) => {
        markAsRead(n.id);
        const type = normaliseType(n.type);
        if (type === 'booking') {
            const bookingId = n.data?.booking_id;
            if (bookingId) navigate(`/provider/appointments/${bookingId}`);
            else navigate('/provider/appointments');
        } else if (type === 'connected') {
            const clientId = n.data?.client_id;
            if (clientId) navigate(`/provider/client/${clientId}`);
            else navigate('/provider/clients');
        } else if (type === 'completed' || type === 'payment_failed') {
            const bookingId = n.data?.booking_id;
            if (bookingId) navigate(`/provider/appointments/${bookingId}`);
            else navigate('/provider/appointments');
        } else if (type === 'message') {
            const conversationId = n.data?.conversation_id;
            const clientId = n.data?.client_id;
            if (conversationId) navigate(`/provider/messages/${conversationId}`);
            else navigate('/provider/messages', clientId ? { state: { clientId } } : undefined);
        } else if (type === 'review') {
            const bookingId = n.data?.booking_id || n.booking_id;
            if (bookingId) navigate(`/provider/appointments/${bookingId}`);
            else navigate('/provider/profile');
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
                                onAction={handleAction}
                            />
                        ))}

                        {/* View All — preview mode only */}
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
            </div>

            <Footer />
        </div>
    );
};

export default ProviderNotifications;
