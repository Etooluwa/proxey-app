/**
 * ProviderMessages — v6 Warm Editorial
 * Route: /provider/messages
 *
 * Conversation list. Tap a row → navigate to /provider/messages/:conversationId
 */
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { useMessages } from '../../contexts/MessageContext';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Header from '../../components/ui/Header';
import Avatar from '../../components/ui/Avatar';
import Divider from '../../components/ui/Divider';
import HeroCard from '../../components/ui/HeroCard';
import Footer from '../../components/ui/Footer';

// ─── Desktop tokens ────────────────────────────────────────────────────────────
const T = { ink: '#3D231E', muted: '#8C6A64', accent: '#C25E4A', line: 'rgba(140,106,100,0.18)', card: '#FFFFFF', avatarBg: '#F2EBE5', base: '#FBF7F2', faded: '#B0948F', hero: '#FDDCC6' };
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

// Two overlapping chat bubble shapes
const ChatBubbles = () => (
    <div style={{ position: 'relative', width: 120, height: 90, margin: '0 auto 28px' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 72, height: 56, borderRadius: '20px 20px 4px 20px', background: '#FDDCC6', transform: 'rotate(-3deg)' }} />
        <div style={{ position: 'absolute', right: 0, bottom: 0, width: 72, height: 56, borderRadius: '20px 20px 20px 4px', background: '#F2EBE5', transform: 'rotate(3deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F', opacity: 0.6 }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F', opacity: 0.3 }} />
            </div>
        </div>
    </div>
);

const MessagesEmpty = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <ChatBubbles />
        <p style={{ fontFamily: "'Sora',system-ui,sans-serif", fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', color: '#3D231E', margin: '0 0 10px' }}>
            The best conversations<br />haven't started yet.
        </p>
        <p style={{ fontFamily: "'Sora',system-ui,sans-serif", fontSize: 14, color: '#8C6A64', margin: 0, lineHeight: 1.6, maxWidth: 280 }}>
            When clients connect with you, this is where you'll coordinate sessions and keep the relationship going.
        </p>
    </div>
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
                <Avatar initials={getInitials(chat.client_name)} size={44} />
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
                        {chat.client_name || 'Client'}
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

// ─── Desktop inline chat panel ────────────────────────────────────────────────

function DesktopChatPanel({ chat, messages: msgs = [], session, onSend, onClose }) {
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const attachmentPreviewUrl = attachment ? URL.createObjectURL(attachment) : null;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs]);
    useEffect(() => () => {
        if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    }, [attachmentPreviewUrl]);

    const handleSend = async () => {
        const content = text.trim();
        const attachedFile = attachment;
        if ((!content && !attachedFile) || sending) return;
        setSending(true);
        setText('');
        setAttachment(null);
        try { await onSend({ conversationId: chat.id, content, imageFile: attachedFile }); }
        catch (e) {
            console.error(e);
            setText(content);
            setAttachment(attachedFile);
        }
        finally { setSending(false); }
    };

    const handleAttachmentPick = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setAttachment(file);
        event.target.value = '';
    };

    const myId = session?.user?.id;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
                <Avatar initials={getInitials(chat.client_name)} size={36} />
                <span style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: T.ink, flex: 1 }}>{chat.client_name || 'Client'}</span>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
                </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgs.length === 0 && (
                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, textAlign: 'center', margin: 'auto' }}>No messages yet. Say hello!</p>
                )}
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

            {/* Input */}
            <div style={{ position: 'relative', padding: '12px 16px', borderTop: `1px solid ${T.line}`, flexShrink: 0, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {attachmentPreviewUrl && (
                    <div style={{ position: 'absolute', bottom: 68, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 16, border: `1px solid ${T.line}`, background: '#F6EFE8' }}>
                        <img src={attachmentPreviewUrl} alt={attachment?.name || 'Attachment preview'} style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachment?.name || 'Attached image'}</p>
                            <p style={{ fontFamily: F, fontSize: 12, color: T.muted, margin: '4px 0 0' }}>Ready to send</p>
                        </div>
                        <button type="button" onClick={() => setAttachment(null)} style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${T.line}`, background: '#fff', cursor: 'pointer', flexShrink: 0 }}>
                            <svg width="14" height="14" fill="none" stroke={T.muted} strokeWidth="1.75" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" /></svg>
                        </button>
                    </div>
                )}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    style={{ width: 40, height: 40, borderRadius: '50%', background: 'transparent', border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    aria-label="Attach image"
                >
                    <svg width="16" height="16" fill="none" stroke={T.muted} strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                </button>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Type a message…"
                    rows={1}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: `1px solid ${T.line}`, background: T.avatarBg, fontFamily: F, fontSize: 14, color: T.ink, resize: 'none', outline: 'none', lineHeight: 1.5 }}
                />
                <button
                    onClick={handleSend}
                    disabled={(!text.trim() && !attachment) || sending}
                    style={{ width: 40, height: 40, borderRadius: '50%', background: (text.trim() || attachment) ? T.ink : T.avatarBg, border: 'none', cursor: (text.trim() || attachment) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
                >
                    <svg width="16" height="16" fill="none" stroke={(text.trim() || attachment) ? '#fff' : T.muted} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleAttachmentPick}
                />
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ProviderMessages = () => {
    const { onMenu, isDesktop } = useOutletContext() || {};
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, session } = useSession();
    const { unreadCount: notifUnread } = useNotifications();
    const { conversations, markAsRead, setCurrentConversation, loadMessages, messages, sendMessage } = useMessages();
    const [activeChat, setActiveChat] = useState(null);
  
    // Pre-select conversation from route state (e.g., from ProviderClientTimeline with { clientId })
    useEffect(() => {
        const targetClientId = location.state?.clientId;
        if (!targetClientId || conversations.length === 0) return;

        const match = conversations.find((c) => c.client_id === targetClientId);
        if (match) {
            markAsRead(match.id);
            setCurrentConversation(match.id);
            loadMessages(match.id);
            navigate(`/provider/messages/${match.id}`, { replace: true });
        }
    }, [location.state?.clientId, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSelect = (chat) => {
        markAsRead(chat.id);
        setCurrentConversation(chat.id);
        loadMessages(chat.id);
        if (isDesktop) {
            setActiveChat(chat);
        } else {
            navigate(`/provider/messages/${chat.id}`);
        }
    };

    const activeMsgs = activeChat ? (messages[activeChat.id] || []) : [];

    const initials = (profile?.name || profile?.first_name || '?')
        .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

    // ── Desktop layout ─────────────────────────────────────────────────────────
    if (isDesktop) {
        // Empty state — full-width centered, no panel layout
        if (conversations.length === 0) {
            return (
                <div style={{ padding: '40px', fontFamily: F }}>
                    <div style={{ maxWidth: 900, margin: '0 auto' }}>
                        <h1 style={{ fontFamily: F, fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em', color: T.ink, margin: '0 0 32px' }}>Messages</h1>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
                            {/* Two overlapping chat bubble shapes */}
                            <div style={{ position: 'relative', width: 120, height: 90, marginBottom: 28 }}>
                                <div style={{ position: 'absolute', left: 0, top: 0, width: 72, height: 56, borderRadius: '20px 20px 4px 20px', background: T.hero, transform: 'rotate(-3deg)' }} />
                                <div style={{ position: 'absolute', right: 0, bottom: 0, width: 72, height: 56, borderRadius: '20px 20px 20px 4px', background: T.avatarBg, transform: 'rotate(3deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingTop: 4 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F' }} />
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F', opacity: 0.6 }} />
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#B0948F', opacity: 0.3 }} />
                                    </div>
                                </div>
                            </div>
                            <p style={{ fontFamily: F, fontSize: 20, fontWeight: 400, letterSpacing: '-0.02em', color: T.ink, margin: '0 0 8px', textAlign: 'center' }}>
                                The best conversations<br />haven't started yet.
                            </p>
                            <p style={{ fontFamily: F, fontSize: 14, color: T.muted, margin: 0, textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
                                When clients connect with you, this is where you'll coordinate sessions and keep the relationship going.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        // Conversations exist — two-panel layout
        return (
            <div style={{ padding: '40px', fontFamily: F }}>
                <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 0, background: T.card, borderRadius: 20, border: `1px solid ${T.line}`, overflow: 'hidden', minHeight: 520 }}>
                        {/* Left: conversation list */}
                        <div style={{ borderRight: `1px solid ${T.line}`, overflowY: 'auto' }}>
                            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.line}` }}>
                                <span style={{ fontFamily: F, fontSize: 13, fontWeight: 600, color: T.ink }}>Conversations</span>
                            </div>
                            {conversations.map((chat) => {
                                const unread = (chat.provider_unread_count || 0) > 0;
                                const isActive = activeChat?.id === chat.id;
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleSelect(chat)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 16px', background: isActive ? 'rgba(194,94,74,0.06)' : 'transparent', border: 'none', borderBottom: `1px solid ${T.line}`, cursor: 'pointer', textAlign: 'left' }}
                                    >
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <Avatar initials={getInitials(chat.client_name)} size={38} />
                                            {unread && <div style={{ position: 'absolute', top: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: T.accent, border: `2px solid ${T.card}` }} />}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                                                <span style={{ fontFamily: F, fontSize: 14, fontWeight: unread ? 600 : 400, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.client_name || 'Client'}</span>
                                                <span style={{ fontFamily: F, fontSize: 11, color: '#B0948F', flexShrink: 0, marginLeft: 6 }}>{formatRelTime(chat.last_message_at)}</span>
                                            </div>
                                            <span style={{ fontFamily: F, fontSize: 12, color: unread ? T.ink : T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{chat.last_message || 'No messages yet'}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Right: active chat or select-prompt */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {activeChat ? (
                                <DesktopChatPanel
                                    chat={activeChat}
                                    messages={activeMsgs}
                                    session={session}
                                    onSend={sendMessage}
                                    onClose={() => setActiveChat(null)}
                                />
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                                    <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: T.ink, margin: '0 0 6px' }}>Select a conversation</p>
                                    <p style={{ fontFamily: F, fontSize: 13, color: T.muted, margin: 0 }}>Pick a client from the list to start chatting.</p>
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
            <Header
                onMenu={onMenu}
                showAvatar
                initials={initials}
                onNotif={() => navigate('/provider/notifications')}
                notifCount={notifUnread}
            />

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
                            const unread = (chat.provider_unread_count || 0) > 0;
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

export default ProviderMessages;
