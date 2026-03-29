/**
 * ChatPage — v6 Warm Editorial
 * Route: /app/messages/:conversationId  (client)
 *        /provider/messages/:conversationId  (provider)
 *
 * Uses MessageContext for messages + Supabase realtime (subscription already
 * managed in MessageContext when currentConversation is set).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMessages } from '../contexts/MessageContext';
import { useSession } from '../auth/authContext';
import Avatar from '../components/ui/Avatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name) {
    return (name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDateLabel(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Cluster builder ──────────────────────────────────────────────────────────
// Groups consecutive messages from the same sender into clusters.
// Returns an array of { messages, isMe, showAvatar (first of cluster from them) }

function buildClusters(messages, myId) {
    if (!messages || messages.length === 0) return [];

    const clusters = [];
    let current = null;

    for (const msg of messages) {
        const isMe = msg.sender_id === myId;
        if (!current || current.isMe !== isMe) {
            current = { isMe, msgs: [msg] };
            clusters.push(current);
        } else {
            current.msgs.push(msg);
        }
    }
    return clusters;
}

// ─── Message bubble ───────────────────────────────────────────────────────────

const Bubble = ({ msg, isMe, isFirst, isLast, otherInitials, showAvatarSlot }) => (
    <div
        className="flex items-end gap-2"
        style={{ justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: isLast ? 0 : 2 }}
    >
        {/* Avatar slot — left side for received messages */}
        {!isMe && (
            <div className="w-7 flex-shrink-0 flex items-end">
                {isFirst && <Avatar initials={otherInitials} size={28} />}
            </div>
        )}

        <div style={{ maxWidth: '75%' }}>
            <div
                className="px-3.5 py-2.5 text-[14px] leading-relaxed"
                style={{
                    borderRadius: isMe
                        ? isLast ? '18px 18px 4px 18px' : '18px 18px 18px 18px'
                        : isLast ? '18px 18px 18px 4px' : '18px 18px 18px 18px',
                    background: isMe ? '#3D231E' : '#F2EBE5',
                    color: isMe ? '#FFFFFF' : '#3D231E',
                    fontFamily: 'inherit',
                }}
            >
                {msg.content}
            </div>
        </div>

        {/* Spacer to keep sent bubbles from hugging right edge */}
        {isMe && <div className="w-0" />}
    </div>
);

// ─── Date divider ─────────────────────────────────────────────────────────────

const DateDivider = ({ label }) => (
    <div className="flex items-center justify-center py-4">
        <span
            className="text-[10px] font-medium uppercase tracking-[0.05em] text-faded"
        >
            {label}
        </span>
    </div>
);

// ─── Three-dot menu ───────────────────────────────────────────────────────────

const ThreeDot = ({ onClick }) => (
    <button onClick={onClick} className="p-2 focus:outline-none" aria-label="More options">
        <svg width="20" height="20" fill="none" stroke="#3D231E" strokeWidth="1.5" viewBox="0 0 24 24">
            <path
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </button>
);

// ─── Input bar ────────────────────────────────────────────────────────────────

const InputBar = ({ value, onChange, onSend, sending }) => {
    const hasText = value.trim().length > 0;

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <div
            className="flex items-end gap-2 px-4 py-3 bg-base"
            style={{ borderTop: '1px solid rgba(140,106,100,0.2)' }}
        >
            {/* Plus / attach */}
            <button
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 focus:outline-none"
                style={{ border: '1px solid rgba(140,106,100,0.2)', background: 'transparent' }}
                aria-label="Attach"
            >
                <svg width="18" height="18" fill="none" stroke="#8C6A64" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
                <textarea
                    value={value}
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    disabled={sending}
                    className="w-full px-4 py-2.5 text-[14px] text-ink placeholder:text-faded resize-none focus:outline-none"
                    style={{
                        borderRadius: '20px',
                        border: '1px solid rgba(140,106,100,0.2)',
                        background: '#F2EBE5',
                        fontFamily: 'inherit',
                        lineHeight: 1.5,
                        boxSizing: 'border-box',
                    }}
                />
            </div>

            {/* Send button */}
            <button
                onClick={onSend}
                disabled={!hasText || sending}
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 focus:outline-none transition-colors"
                style={{
                    background: hasText ? '#C25E4A' : '#F2EBE5',
                    cursor: hasText ? 'pointer' : 'default',
                }}
                aria-label="Send"
            >
                <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke={hasText ? '#fff' : '#B0948F'}
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const ChatPage = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { session } = useSession();
    const {
        conversations,
        messages: messagesMap,
        currentConversation,
        setCurrentConversation,
        loadMessages,
        sendMessage,
        markAsRead,
    } = useMessages();

    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef(null);
    const userId = session?.user?.id;

    // Activate this conversation in context (triggers realtime subscription in MessageContext)
    useEffect(() => {
        if (!conversationId) return;
        setCurrentConversation(conversationId);
        loadMessages(conversationId);
        markAsRead(conversationId);
    }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messagesMap, conversationId]);

    const conversation = conversations.find((c) => c.id === conversationId);
    const rawMessages = messagesMap[conversationId] || [];
    const clusters = buildClusters(rawMessages, userId);

    // The "other person" — for client it's the provider, for provider it's the client
    const isProvider = session?.user?.role === 'provider';
    const otherName = isProvider
        ? (conversation?.client_name || 'Client')
        : (conversation?.provider_name || 'Provider');
    const otherInitials = getInitials(otherName);

    // Profile link for the other person in the header
    const otherProfilePath = isProvider
        ? (conversation?.client_id ? `/provider/clients/${conversation.client_id}` : null)
        : (conversation?.provider_id ? `/app/relationship/${conversation.provider_id}` : null);

    const handleOtherProfile = () => {
        if (otherProfilePath) navigate(otherProfilePath);
    };

    // Group clusters by day for date dividers
    const dateGroups = [];
    let lastDateLabel = null;
    for (const cluster of clusters) {
        const ts = cluster.msgs[0]?.created_at;
        const label = formatDateLabel(ts);
        if (label !== lastDateLabel) {
            dateGroups.push({ type: 'divider', label });
            lastDateLabel = label;
        }
        dateGroups.push({ type: 'cluster', cluster });
    }

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || !conversationId || sending) return;
        setInput('');
        setSending(true);
        try {
            await sendMessage({ conversationId, content: text });
        } catch (err) {
            console.error('[ChatPage] send error:', err);
            setInput(text); // restore on failure
        } finally {
            setSending(false);
        }
    }, [input, conversationId, sending, sendMessage]);

    const handleBack = () => {
        const basePath = isProvider ? '/provider/messages' : '/app/messages';
        navigate(basePath);
    };

    return (
        <div className="flex flex-col h-screen bg-base">
            {/* ── Chat header */}
            <div
                className="flex items-center gap-3 px-5 pt-10 pb-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(140,106,100,0.2)' }}
            >
                {/* Back */}
                <button
                    onClick={handleBack}
                    className="p-1 -ml-1 focus:outline-none flex-shrink-0"
                    aria-label="Back"
                >
                    <svg width="22" height="22" fill="none" stroke="#3D231E" strokeWidth="1.75" viewBox="0 0 24 24">
                        <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Avatar + Name — clickable if profile path available */}
                <button
                    onClick={handleOtherProfile}
                    disabled={!otherProfilePath}
                    className="flex items-center gap-3 flex-1 min-w-0 focus:outline-none group"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: otherProfilePath ? 'pointer' : 'default', textAlign: 'left' }}
                >
                    <Avatar initials={otherInitials} size={36} />
                    <p
                        className="text-[15px] font-semibold text-ink m-0 truncate"
                        style={{ textDecoration: otherProfilePath ? 'underline' : 'none', textDecorationColor: 'rgba(140,106,100,0.4)', textUnderlineOffset: '3px' }}
                    >
                        {otherName}
                    </p>
                </button>

                {/* Three-dot menu */}
                <ThreeDot />
            </div>

            {/* ── Messages */}
            <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 flex flex-col">
                {rawMessages.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <p className="text-[14px] text-muted text-center">No messages yet.</p>
                        <p className="text-[13px] text-faded text-center mt-1">Send a message to start the conversation.</p>
                    </div>
                )}

                {dateGroups.map((item, idx) => {
                    if (item.type === 'divider') {
                        return <DateDivider key={`divider-${idx}`} label={item.label} />;
                    }

                    const { cluster } = item;
                    return (
                        <div key={`cluster-${idx}`} className="flex flex-col mb-3">
                            {cluster.msgs.map((msg, mi) => {
                                const isFirst = mi === 0;
                                const isLast = mi === cluster.msgs.length - 1;
                                return (
                                    <Bubble
                                        key={msg.id}
                                        msg={msg}
                                        isMe={cluster.isMe}
                                        isFirst={isFirst}
                                        isLast={isLast}
                                        otherInitials={otherInitials}
                                    />
                                );
                            })}
                            {/* Timestamp below last bubble in cluster */}
                            <p
                                className="text-[10px] mt-1 px-1"
                                style={{
                                    color: '#B0948F',
                                    textAlign: cluster.isMe ? 'right' : 'left',
                                    marginLeft: !cluster.isMe ? '36px' : 0,
                                }}
                            >
                                {formatTime(cluster.msgs[cluster.msgs.length - 1]?.created_at)}
                            </p>
                        </div>
                    );
                })}

                <div ref={bottomRef} />
            </div>

            {/* ── Input bar */}
            <InputBar
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={handleSend}
                sending={sending}
            />
        </div>
    );
};

export default ChatPage;
