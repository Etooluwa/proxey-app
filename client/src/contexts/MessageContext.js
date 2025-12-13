import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from '../auth/authContext';
import { fetchMessages, sendMessage } from '../data/messages';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
    const { session, role } = useSession();
    const userId = session?.user?.id;

    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);

    const refresh = useCallback(async () => {
        if (!userId) return;
        try {
            const data = await fetchMessages();
            setMessages(data);

            // Build lightweight conversations list grouped by thread_id
            const grouped = data.reduce((acc, msg) => {
                const threadId = msg.thread_id || "default";
                if (!acc[threadId]) acc[threadId] = [];
                acc[threadId].push(msg);
                return acc;
            }, {});

            const convs = Object.entries(grouped).map(([threadId, msgs]) => {
                const sorted = msgs.slice().sort(
                    (a, b) => new Date(b.sent_at || 0) - new Date(a.sent_at || 0)
                );
                const last = sorted[0] || {};
                const otherParty =
                    last.sender_id === userId ? last.receiver_id : last.sender_id;
                const otherName =
                    otherParty === last.sender_id
                        ? last.sender_name || last.sender_id
                        : last.receiver_name || last.receiver_id;
                const otherAvatar =
                    otherParty === last.sender_id
                        ? last.sender_avatar
                        : last.receiver_avatar;
                return {
                    id: threadId,
                    lastMessage: last.body || "",
                    time: last.sent_at || "",
                    unread: 0,
                    otherParty,
                    clientName: last.client_name || otherName || "Conversation",
                    providerName: last.provider_name || otherName || "Conversation",
                    avatar:
                        otherAvatar ||
                        "https://api.dicebear.com/7.x/identicon/svg?seed=" + otherParty,
                    serviceInterest: last.service || "Message",
                    online: false,
                };
            });
            setConversations(convs);
        } catch (e) {
            console.error("[messages] Failed to load messages", e);
        }
    }, [userId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const markAsRead = (conversationId) => {
        setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, unread: 0 } : c))
        );
    };

    const send = async ({ receiverId, body, threadId }) => {
        const payload = {
            receiverId,
            body,
        };
        if (threadId) payload.threadId = threadId;
        const sent = await sendMessage(payload);
        setMessages((prev) => [...prev, sent]);
        refresh();
        return sent;
    };

    const getUnreadCount = () => {
        return conversations.reduce((total, c) => total + c.unread, 0);
    };

    return (
        <MessageContext.Provider value={{
            conversations,
            messages,
            markAsRead,
            getUnreadCount,
            refresh,
            send
        }}>
            {children}
        </MessageContext.Provider>
    );
};
