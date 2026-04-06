import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { useSession } from '../auth/authContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
    ink: '#3D231E',
    muted: '#8C6A64',
    faded: '#B0948F',
    accent: '#C25E4A',
    avatarBg: '#F2EBE5',
    line: 'rgba(140,106,100,0.18)',
    card: '#FFFFFF',
    success: '#5A8A5E',
};
const F = "'Sora',system-ui,sans-serif";

// ─── Type normalisation (mirrors ProviderNotifications) ───────────────────────
const BOOKING_TYPES = new Set([
    'booking_request', 'new_booking', 'time_request', 'appointment_request',
    'accepted', 'rejected', 'booking_accepted', 'appointment_accepted', 'booking_declined', 'appointment_declined', 'booking_cancelled', 'booking_rescheduled',
]);
const COMPLETED_TYPES = new Set([
    'booking_completed', 'completed', 'session_completed', 'session_complete',
]);
const CONNECTED_TYPES = new Set([
    'connected', 'new_client', 'new_connection',
]);
const MESSAGE_TYPES = new Set(['new_message']);
const REVIEW_TYPES = new Set(['new_review']);
const PAYMENT_SUCCESS_TYPES = new Set(['payment_success', 'payment_succeeded']);
const PAYMENT_FAILED_TYPES = new Set(['payment_failed']);

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

// ─── Badge colours per type ────────────────────────────────────────────────────
const BADGE_COLOR = {
    booking: T.accent,
    connected: T.success,
    completed: T.success,
    payment_failed: '#B04040',
    reminder: T.muted,
    message: T.ink,
    review: T.success,
};

// ─── Badge icons ──────────────────────────────────────────────────────────────
function BadgeIcon({ type }) {
    if (type === 'booking') {
        return (
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="16" y1="2" x2="16" y2="6" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" strokeLinecap="round" />
            </svg>
        );
    }
    if (type === 'connected') {
        return (
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M8.5 3a4 4 0 100 8 4 4 0 000-8zM20 8v6m3-3h-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (type === 'message') {
        return (
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (type === 'review') {
        return (
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    if (type === 'payment_failed') {
        return (
            <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M12 8v5" strokeLinecap="round" />
                <path d="M12 16.5h.01" strokeLinecap="round" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    }
    // completed / reminder
    return (
        <svg width="9" height="9" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Navigate helper based on notification type + data ─────────────────────────
function getNavPath(n, isProvider) {
    const type = normaliseType(n.type);
    const data = n.data || {};
    const bookingId = data.booking_id || data.bookingId;
    const clientId = data.client_id || data.clientId;
    const providerId = data.provider_id || data.providerId;
    const conversationId = data.conversation_id || data.conversationId;

    if (isProvider) {
        if (type === 'booking') {
            return bookingId ? `/provider/appointments/${bookingId}` : '/provider/bookings';
        }
        if (type === 'connected') {
            return clientId ? `/provider/clients/${clientId}` : '/provider/clients';
        }
        if (type === 'completed' || type === 'payment_failed') {
            return bookingId ? `/provider/appointments/${bookingId}` : '/provider/bookings';
        }
        if (type === 'message') {
            return conversationId ? `/provider/messages/${conversationId}` : '/provider/messages';
        }
        if (type === 'review') {
            return bookingId ? `/provider/appointments/${bookingId}` : '/provider/profile';
        }
        return '/provider/notifications';
    } else {
        if (type === 'booking') {
            return bookingId ? `/app/bookings/${bookingId}` : '/app';
        }
        if (type === 'connected') {
            return '/app';
        }
        if (type === 'completed' || type === 'payment_failed') {
            return bookingId ? `/app/bookings/${bookingId}` : '/app/notifications';
        }
        return '/app/notifications';
    }
}

// ─── Bell icon ────────────────────────────────────────────────────────────────
function BellIcon() {
    return (
        <svg width="20" height="20" fill="none" stroke={T.ink} strokeWidth="1.5" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── NotificationDropdown ─────────────────────────────────────────────────────
/**
 * Desktop-only notification bell + dropdown panel.
 *
 * Reads from NotificationContext — same data source as the mobile notification
 * screens. No extra props needed; role is derived from the session.
 */
export default function NotificationDropdown() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
    const { session } = useSession();

    const isProvider = session?.user?.role === 'provider';
    const allNotifPath = isProvider ? '/provider/notifications' : '/app/notifications';

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const recent = notifications.slice(0, 3);

    const handleNotifClick = (n) => {
        if (!n.is_read) markAsRead(n.id);
        navigate(getNavPath(n, isProvider));
        setOpen(false);
    };

    const handleMarkAll = () => {
        markAllAsRead();
    };

    const handleViewAll = () => {
        navigate(allNotifPath);
        setOpen(false);
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                onClick={() => setOpen((o) => !o)}
                aria-label="Notifications"
                style={{
                    position: 'relative', padding: '8px', borderRadius: '10px',
                    background: T.avatarBg, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <BellIcon />
                {unreadCount > 0 && (
                    <div style={{
                        position: 'absolute', top: '2px', right: '2px',
                        minWidth: '18px', height: '18px', borderRadius: '9999px',
                        background: T.accent, color: '#fff',
                        fontFamily: F, fontSize: '10px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 4px', lineHeight: 1,
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    width: '380px', background: T.card, borderRadius: '16px',
                    border: `1px solid ${T.line}`,
                    boxShadow: '0 12px 40px rgba(61,35,30,0.10)',
                    zIndex: 50, overflow: 'hidden',
                }}>

                    {/* Panel header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '20px 20px 12px',
                    }}>
                        <span style={{ fontFamily: F, fontSize: '16px', fontWeight: 500, color: T.ink }}>
                            Notifications
                        </span>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAll}
                                style={{
                                    fontFamily: F, fontSize: '11px', fontWeight: 500,
                                    color: T.accent, textTransform: 'uppercase',
                                    letterSpacing: '0.05em', background: 'none',
                                    border: 'none', cursor: 'pointer', padding: 0,
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    <div style={{ height: '1px', background: T.line }} />

                    {/* Notification rows */}
                    {recent.length === 0 ? (
                        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                            <p style={{ fontFamily: F, fontSize: '13px', color: T.muted, margin: 0 }}>
                                You're all caught up
                            </p>
                        </div>
                    ) : (
                        recent.map((n) => {
                            const type = normaliseType(n.type);
                            const badgeColor = BADGE_COLOR[type];
                            const unread = !n.is_read;
                            // Derive initials from title or body
                            const words = (n.title || '').replace(/[^a-zA-Z ]/g, '').trim().split(/\s+/);
                            const initials = words.length >= 2
                                ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
                                : (words[0] || '?').slice(0, 2).toUpperCase();

                            return (
                                <div key={n.id}>
                                    <button
                                        onClick={() => handleNotifClick(n)}
                                        style={{
                                            display: 'flex', gap: '12px', padding: '16px 20px',
                                            width: '100%', textAlign: 'left',
                                            background: unread ? 'rgba(194,94,74,0.025)' : 'transparent',
                                            border: 'none', cursor: 'pointer', fontFamily: F,
                                        }}
                                    >
                                        {/* Avatar + type badge */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%',
                                                background: T.avatarBg, display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontFamily: F, fontSize: '12px', fontWeight: 500, color: T.muted,
                                            }}>
                                                {initials}
                                            </div>
                                            <div style={{
                                                position: 'absolute', bottom: '-2px', right: '-2px',
                                                width: '18px', height: '18px', borderRadius: '50%',
                                                background: badgeColor,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: `2px solid ${T.card}`,
                                            }}>
                                                <BadgeIcon type={type} />
                                            </div>
                                        </div>

                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                                <span style={{
                                                    fontSize: '13px', fontWeight: unread ? 500 : 400,
                                                    color: T.ink, lineHeight: 1.4,
                                                }}>
                                                    {n.title}
                                                </span>
                                                {unread && (
                                                    <div style={{
                                                        width: '7px', height: '7px', borderRadius: '50%',
                                                        background: T.accent, flexShrink: 0, marginTop: '4px',
                                                    }} />
                                                )}
                                            </div>
                                            {(n.message || n.body) && (
                                                <p style={{ fontSize: '12px', color: T.muted, margin: '2px 0 0', lineHeight: 1.4 }}>
                                                    {n.message || n.body}
                                                </p>
                                            )}
                                            <span style={{ fontSize: '10px', color: T.faded, marginTop: '4px', display: 'block' }}>
                                                {relativeTime(n.timestamp || n.created_at)}
                                            </span>
                                        </div>
                                    </button>
                                    <div style={{ padding: '0 20px' }}>
                                        <div style={{ height: '1px', background: T.line }} />
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* View all button */}
                    <button
                        onClick={handleViewAll}
                        style={{
                            width: '100%', padding: '14px', fontFamily: F, fontSize: '13px',
                            fontWeight: 500, color: T.ink, textAlign: 'center',
                            border: 'none', cursor: 'pointer', background: 'transparent',
                        }}
                    >
                        View All Notifications
                    </button>
                </div>
            )}
        </div>
    );
}
