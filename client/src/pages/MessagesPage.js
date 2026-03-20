/**
 * MessagesPage — v6 Warm Editorial
 * Route: /app/messages
 *
 * Conversation list. Tap a row → navigate to /app/messages/:conversationId
 */
import { useEffect } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useMessages } from '../contexts/MessageContext';
import { useSession } from '../auth/authContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Divider from '../components/ui/Divider';
import HeroCard from '../components/ui/HeroCard';
import Footer from '../components/ui/Footer';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(diff / 86400000);
    if (days < 7) return `${days}d`;
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name) {
    return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const MessagesEmpty = () => (
    <HeroCard>
        <div className="flex justify-center mb-5">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(194,94,74,0.12)' }}
            >
                <svg width="24" height="24" fill="none" stroke="#C25E4A" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
        </div>
        <p className="text-[20px] font-semibold text-ink text-center leading-tight tracking-[-0.02em] mb-2">
            No messages yet
        </p>
        <p className="text-[14px] text-muted text-center leading-relaxed">
            When you connect with a provider, you can message them here about bookings, questions, or updates.
        </p>
    </HeroCard>
);

// ─── Conversation row ─────────────────────────────────────────────────────────

const ConvoRow = ({ chat, unread, onClick }) => (
    <>
        <button
            onClick={onClick}
            className="w-full flex items-center gap-4 py-5 px-1 text-left focus:outline-none active:bg-avatarBg/40 transition-colors"
        >
            {/* Avatar + unread dot */}
            <div className="relative flex-shrink-0">
                <Avatar initials={getInitials(chat.provider_name || chat.client_name)} size={44} />
                {unread && (
                    <div
                        className="absolute top-0 right-0 w-[10px] h-[10px] rounded-full"
                        style={{ background: '#C25E4A', border: '2px solid #FBF7F2' }}
                    />
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                    <p
                        className="text-[15px] text-ink truncate"
                        style={{ fontWeight: unread ? 600 : 400 }}
                    >
                        {chat.provider_name || chat.client_name || 'Provider'}
                    </p>
                    <span className="text-[12px] text-faded ml-2 flex-shrink-0">
                        {formatRelTime(chat.last_message_at)}
                    </span>
                </div>
                <p
                    className="text-[14px] truncate"
                    style={{ color: unread ? '#3D231E' : '#8C6A64' }}
                >
                    {chat.last_message || 'No messages yet'}
                </p>
            </div>
        </button>
        <Divider />
    </>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const MessagesPage = () => {
    const { onMenu } = useOutletContext() || {};
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useSession();
    const { conversations, markAsRead, setCurrentConversation, loadMessages } = useMessages();

    // Pre-select from route state (e.g., navigate from RelationshipPage with { providerId })
    useEffect(() => {
        const targetProviderId = location.state?.providerId;
        if (!targetProviderId || conversations.length === 0) return;

        const match = conversations.find((c) => c.provider_id === targetProviderId);
        if (match) {
            markAsRead(match.id);
            setCurrentConversation(match.id);
            loadMessages(match.id);
            navigate(`/app/messages/${match.id}`, { replace: true });
        }
    }, [location.state?.providerId, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (chat) => {
        markAsRead(chat.id);
        setCurrentConversation(chat.id);
        loadMessages(chat.id);
        navigate(`/app/messages/${chat.id}`);
    };

    const userId = session?.user?.id;

    return (
        <div className="flex flex-col min-h-screen bg-base">
            <Header onMenu={onMenu} showAvatar={false} />

            <div className="px-5 pb-6 flex-1 flex flex-col">
                {/* Page title */}
                <div className="mb-5">
                    <h1 className="text-[32px] font-semibold text-ink tracking-[-0.03em] leading-tight m-0">
                        Messages
                    </h1>
                </div>

                {/* Empty state */}
                {conversations.length === 0 && <MessagesEmpty />}

                {/* List */}
                {conversations.length > 0 && (
                    <div>
                        <Divider />
                        {conversations.map((chat) => {
                            const unread =
                                session?.user?.role === 'provider'
                                    ? (chat.provider_unread_count || 0) > 0
                                    : (chat.client_unread_count || 0) > 0;
                            return (
                                <ConvoRow
                                    key={chat.id}
                                    chat={chat}
                                    unread={unread}
                                    onClick={() => handleSelect(chat)}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default MessagesPage;
