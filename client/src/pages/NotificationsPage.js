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
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import BackBtn from '../components/ui/BackBtn';
import Avatar from '../components/ui/Avatar';
import Lbl from '../components/ui/Lbl';
import Divider from '../components/ui/Divider';
import Footer from '../components/ui/Footer';
import HeroCard from '../components/ui/HeroCard';

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', base: '#FBF7F2' };
const F = "'Sora',system-ui,sans-serif";

// ─── Type normalisation ───────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set([
    'accepted', 'booking_accepted', 'appointment_accepted', 'time_request_accepted',
    'booking_rescheduled',
]);
const REJECTED_TYPES = new Set([
    'rejected', 'booking_declined', 'appointment_declined', 'time_request_declined',
    'booking_cancelled',
]);
const CONNECTED_TYPES = new Set(['connected', 'new_connection']);
const REMINDER_TYPES = new Set(['reminder', 'upcoming_session']);
const SESSION_COMPLETE_TYPES = new Set(['session_complete', 'booking_completed']);

function normaliseType(rawType) {
    if (!rawType) return 'reminder';
    if (ACCEPTED_TYPES.has(rawType)) return 'accepted';
    if (REJECTED_TYPES.has(rawType)) return 'rejected';
    if (CONNECTED_TYPES.has(rawType)) return 'connected';
    if (SESSION_COMPLETE_TYPES.has(rawType)) return 'session_complete';
    return 'reminder';
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE = {
    accepted: {
        bg: '#EBF2EC',
        icon: (
            <svg width="20" height="20" fill="none" stroke="#5A8A5E" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        iconBadge: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: '#5A8A5E',
    },
    session_complete: {
        bg: '#EBF2EC',
        icon: (
            <svg width="20" height="20" fill="none" stroke="#5A8A5E" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        iconBadge: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: '#5A8A5E',
    },
    rejected: {
        bg: '#F2EBE5',
        icon: (
            <svg width="20" height="20" fill="none" stroke="#B04040" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        iconBadge: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
        ),
        badgeBg: '#B04040',
    },
    connected: {
        bg: '#F2EBE5',
        icon: (
            <svg width="20" height="20" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        iconBadge: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.75" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: '#C25E4A',
    },
    reminder: {
        bg: '#F2EBE5',
        icon: (
            <svg width="20" height="20" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        iconBadge: (
            <svg width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        badgeBg: '#8C6A64',
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

// Extract a booking_id to link Pay Now / Leave a review
function bookingId(n) {
    return n.data?.booking_id || n.booking_id || null;
}

// Check if this notification should show a "Leave a review" prompt
function showReviewPrompt(n) {
    const type = normaliseType(n.type);
    if (type !== 'session_complete') return false;
    return n.data?.show_review_prompt !== false;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const Empty = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F2EBE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg width="24" height="24" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M15 17H20L18.595 15.595A1.98 1.98 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
        <p style={{ fontFamily: "'Sora',system-ui,sans-serif", fontSize: 18, fontWeight: 600, color: '#3D231E', margin: '0 0 8px', letterSpacing: '-0.02em' }}>All clear</p>
        <p style={{ fontFamily: "'Sora',system-ui,sans-serif", fontSize: 14, color: '#8C6A64', margin: 0, lineHeight: 1.7, maxWidth: 260 }}>
            No notifications yet. Check back after your next booking.
        </p>
    </div>
);

// ─── Single notification item ─────────────────────────────────────────────────

const NotifItem = ({ n, onMarkRead, onPayNow, onLeaveReview }) => {
    const type = normaliseType(n.type);
    const badge = BADGE[type];
    const unread = !n.is_read && !n.read;
    const reason = declineReason(n);
    const bid = bookingId(n);
    const ts = n.timestamp || n.created_at;
    const showReview = showReviewPrompt(n);

    const handleClick = () => {
        if (showReview && bid) {
            onMarkRead(n.id);
            onLeaveReview(bid);
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className="flex gap-3.5 py-5 w-full text-left"
                style={{ opacity: unread ? 1 : 0.55, background: 'transparent', border: 'none', cursor: showReview ? 'pointer' : 'default' }}
            >
                {/* Icon circle (session_complete uses large icon, others use avatar+badge) */}
                <div className="relative flex-shrink-0">
                    {type === 'session_complete' ? (
                        <div
                            className="flex items-center justify-center rounded-full"
                            style={{ width: 44, height: 44, background: badge.bg }}
                        >
                            {badge.icon}
                        </div>
                    ) : (
                        <>
                            <Avatar initials={initialsFromNotif(n)} size={44} />
                            <div
                                className="absolute flex items-center justify-center rounded-full"
                                style={{
                                    bottom: -2, right: -2,
                                    width: 22, height: 22,
                                    background: badge.badgeBg,
                                    border: '2px solid #FBF7F2',
                                }}
                            >
                                {badge.iconBadge}
                            </div>
                        </>
                    )}
                    {/* Unread dot */}
                    {unread && (
                        <div
                            style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: '#C25E4A', border: '2px solid #FBF7F2' }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p
                            className="text-[14px] text-ink m-0"
                            style={{ fontWeight: unread ? 600 : 500 }}
                        >
                            {n.title}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Lbl style={{ fontSize: '10px', margin: 0 }}>{formatRelTime(ts)}</Lbl>
                            {unread && (
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#C25E4A' }} />
                            )}
                        </div>
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

                    {/* Action pills row */}
                    <div className="flex items-center gap-3">
                        {/* Leave a review pill (session_complete) */}
                        {showReview && bid && (
                            <div
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6,
                                    padding: '6px 14px', borderRadius: 9999,
                                    background: '#FDDCC6', cursor: 'pointer',
                                }}
                            >
                                <svg width="12" height="12" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span style={{ fontSize: 12, fontWeight: 500, color: '#C25E4A', fontFamily: "'Sora',system-ui,sans-serif" }}>Leave a review</span>
                            </div>
                        )}

                        {/* Pay Now pill (accepted bookings) */}
                        {type === 'accepted' && bid && unread && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onPayNow(bid); }}
                                className="px-3.5 py-1.5 rounded-[8px] text-[11px] font-semibold text-white focus:outline-none"
                                style={{ background: '#3D231E' }}
                            >
                                Pay Now
                            </button>
                        )}
                    </div>
                </div>
            </button>
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
    const { isDesktop } = useOutletContext() || {};

    const displayed = showAll ? notifications : notifications.slice(0, 3);
    const unreadCount = notifications.filter((n) => !n.is_read && !n.read).length;

    const handleMarkAllRead = () => {
        markAllAsRead();
    };

    const handlePayNow = (bid) => {
        navigate('/app/booking-flow', { state: { bookingId: bid } });
    };

    const handleLeaveReview = (bid) => {
        navigate(`/app/review/${bid}`);
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

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 680, margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                        <span style={{ fontFamily: F, fontSize: 11, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {showAll ? 'All Notifications' : 'Recent Notifications'}
                        </span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} style={{ fontFamily: F, fontSize: 11, fontWeight: 600, color: T.accent, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #C25E4A', borderTopColor: 'transparent' }} />
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && notifications.length === 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 24px', textAlign: 'center' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F2EBE5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <svg width="22" height="22" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                                    <path d="M15 17H20L18.595 15.595A1.98 1.98 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <p style={{ fontFamily: F, fontSize: 18, fontWeight: 600, color: T.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>All clear</p>
                            <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.7 }}>No notifications yet.</p>
                        </div>
                    )}

                    {/* Notification items */}
                    {!loading && notifications.length > 0 && (
                        <div style={{ background: T.card, borderRadius: 16, border: `1px solid ${T.line}`, overflow: 'hidden' }}>
                            {displayed.map((n, i) => {
                                const type = normaliseType(n.type);
                                const badge = BADGE[type];
                                const unread = !n.is_read && !n.read;
                                const reason = declineReason(n);
                                const bid = bookingId(n);
                                const ts = n.timestamp || n.created_at;
                                return (
                                    <div key={n.id} style={{ padding: '18px 20px', borderBottom: i < displayed.length - 1 ? `1px solid ${T.line}` : 'none', opacity: unread ? 1 : 0.55 }}>
                                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                                            {/* Avatar + badge */}
                                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                                <Avatar initials={initialsFromNotif(n)} size={44} />
                                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: badge.bg, border: '2px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {badge.icon}
                                                </div>
                                            </div>
                                            {/* Content */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                                                    <p style={{ fontFamily: F, fontSize: 14, fontWeight: unread ? 600 : 400, color: T.ink, margin: 0 }}>{n.title}</p>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                                        <span style={{ fontFamily: F, fontSize: 11, color: T.faded }}>{formatRelTime(ts)}</span>
                                                        {unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.accent }} />}
                                                    </div>
                                                </div>
                                                <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: '0 0 6px', lineHeight: 1.5 }}>{n.message || n.body}</p>
                                                {reason && (
                                                    <div style={{ padding: '8px 12px', borderRadius: 8, background: T.avatarBg, marginBottom: 8 }}>
                                                        <p style={{ fontFamily: F, fontSize: 13, color: T.ink, margin: 0, fontStyle: 'italic' }}>"{reason}"</p>
                                                    </div>
                                                )}
                                                {type === 'accepted' && bid && unread && (
                                                    <button onClick={() => handlePayNow(bid)} style={{ padding: '6px 14px', borderRadius: 8, background: T.ink, border: 'none', fontFamily: F, fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                                                        Pay Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* View all button */}
                    {!loading && !showAll && notifications.length > 3 && (
                        <button onClick={handleViewAll} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 14, padding: '14px', borderRadius: 12, border: `1px solid ${T.line}`, background: 'transparent', fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink, cursor: 'pointer' }}>
                            View All Notifications
                            <span style={{ fontFamily: F, fontSize: 10, fontWeight: 500, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{notifications.length}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

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
                                onLeaveReview={handleLeaveReview}
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
