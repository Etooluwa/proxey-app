/**
 * MessagesPage — v6 Warm Editorial
 * Route: /app/messages
 *
 * Conversation list. Tap a row → navigate to /app/messages/:conversationId
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useMessages } from '../contexts/MessageContext';
import { useSession } from '../auth/authContext';
import Header from '../components/ui/Header';
import Avatar from '../components/ui/Avatar';
import Divider from '../components/ui/Divider';
import HeroCard from '../components/ui/HeroCard';
import Footer from '../components/ui/Footer';

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = { ink: '#3D231E', muted: '#8C6A64', faded: '#B0948F', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', hero: '#FDDCC6', avatarBg: '#F2EBE5', base: '#FBF7F2' };
const F = "'Sora',system-ui,sans-serif";

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

// ─── Desktop chat panel ───────────────────────────────────────────────────────

function DesktopChatPanel({ chat, msgs = [], session, onSend, onClose }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const myId = session?.user?.id;

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

    const handleSend = async () => {
        const content = text.trim();
        if (!content || sending) return;
        setSending(true);
        setText('');
        try { await onSend({ conversationId: chat.id, content }); } catch (e) { console.error(e); }
        finally { setSending(false); }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
                <Avatar initials={getInitials(chat.provider_name || chat.client_name)} size={36} />
                <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.ink, flex: 1 }}>{chat.provider_name || chat.client_name || 'Provider'}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
                </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgs.length === 0 && <p style={{ fontFamily: F, fontSize: 13, color: T.muted, textAlign: 'center', margin: 'auto' }}>No messages yet. Say hello!</p>}
                {msgs.map((msg) => {
                    const isMine = msg.sender_id === myId;
                    return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                            <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMine ? T.ink : T.avatarBg }}>
                                {msg.image_url && <img src={msg.image_url} alt="" style={{ maxWidth: '100%', borderRadius: 8, display: 'block', marginBottom: msg.content ? 6 : 0 }} />}
                                {msg.content && <p style={{ fontFamily: F, fontSize: 14, color: isMine ? '#fff' : T.ink, margin: 0, lineHeight: 1.5 }}>{msg.content}</p>}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            <div style={{ padding: '12px 16px', borderTop: `1px solid ${T.line}`, flexShrink: 0, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    rows={1}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 14, color: T.ink, resize: 'none', outline: 'none', lineHeight: 1.5 }}
                />
                <button onClick={handleSend} disabled={!text.trim() || sending} style={{ width: 40, height: 40, borderRadius: '50%', background: text.trim() ? T.ink : T.avatarBg, border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
                    <svg width="16" height="16" fill="none" stroke={text.trim() ? '#fff' : T.muted} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MessagesPage = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useSession();
    const { conversations, markAsRead, setCurrentConversation, loadMessages, messages, sendMessage } = useMessages();
    const [activeChat, setActiveChat] = useState(null);

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
        if (isDesktop) {
            setActiveChat(chat);
        } else {
            navigate(`/app/messages/${chat.id}`);
        }
    };

    const userId = session?.user?.id;
    const activeMsgs = activeChat ? (messages[activeChat.id] || []) : [];

    if (isDesktop) {
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, background: T.card, borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', minHeight: 560 }}>
                        {/* Left: conversation list */}
                        <div style={{ borderRight: `1px solid ${T.line}`, overflowY: 'auto' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.line}` }}>
                                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>Messages</span>
                            </div>
                            {conversations.length === 0 && (
                                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>No conversations yet.</p>
                                </div>
                            )}
                            {conversations.map((chat) => {
                                const unread = session?.user?.role === 'provider'
                                    ? (chat.provider_unread_count || 0) > 0
                                    : (chat.client_unread_count || 0) > 0;
                                const isActive = activeChat?.id === chat.id;
                                const displayName = chat.provider_name || chat.client_name || 'Provider';
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleSelect(chat)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', background: isActive ? 'rgba(194,94,74,0.06)' : 'transparent', border: 'none', borderBottom: `1px solid ${T.line}`, cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <Avatar initials={getInitials(displayName)} size={38} />
                                            {unread && <div style={{ position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: T.accent, border: `2px solid ${T.card}` }} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                                <span style={{ fontFamily: F, fontSize: 14, fontWeight: unread ? 600 : 400, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                                                <span style={{ fontFamily: F, fontSize: 11, color: T.faded, flexShrink: 0, marginLeft: 6 }}>{formatRelTime(chat.last_message_at)}</span>
                                            </div>
                                            <span style={{ fontFamily: F, fontSize: 12, color: unread ? T.ink : T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{chat.last_message || 'No messages yet'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: chat or placeholder */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeChat ? (
                                <DesktopChatPanel
                                    chat={activeChat}
                                    msgs={activeMsgs}
                                    session={session}
                                    onSend={sendMessage}
                                    onClose={() => setActiveChat(null)}
                                />
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(194,94,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                        <svg width="22" height="22" fill="none" stroke={T.accent} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                    <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.ink, margin: '0 0 6px' }}>Select a conversation</p>
                                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>Pick a provider from the list to start chatting.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

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
