import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '../auth/authContext';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

const INITIAL_CONVERSATIONS = [
    {
        id: '1',
        providerId: 'p1',
        providerName: 'Sarah Jenkins',
        avatar: 'https://picsum.photos/seed/sarah/100/100',
        lastMessage: 'Great, see you on Thursday at 10!',
        time: '2m ago',
        unread: 2,
    },
    {
        id: '2',
        providerId: 'p2',
        providerName: 'Mike Ross',
        avatar: 'https://picsum.photos/seed/mike/100/100',
        lastMessage: 'Can you send me a photo of the leak?',
        time: '1h ago',
        unread: 0,
    },
    {
        id: '3',
        providerId: 'p5',
        providerName: 'David Green',
        avatar: 'https://picsum.photos/seed/david/100/100',
        lastMessage: 'Thanks for the review!',
        time: '2d ago',
        unread: 0,
    }
];

export const MessageProvider = ({ children }) => {
    const { session } = useSession();
    const userId = session?.user?.id;

    const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);

    // Load conversations when userId changes
    useEffect(() => {
        if (userId) {
            const saved = localStorage.getItem(`proxey.conversations.${userId}`);
            if (saved) {
                try {
                    setConversations(JSON.parse(saved));
                } catch (e) {
                    console.error("Failed to parse conversations", e);
                    setConversations(INITIAL_CONVERSATIONS);
                }
            } else {
                // If no saved conversations for this user, reset to initial (or empty)
                // For prototype, we reset to INITIAL_CONVERSATIONS so they see data
                setConversations(INITIAL_CONVERSATIONS);
            }
        }
    }, [userId]);

    // Save conversations when they change
    useEffect(() => {
        if (userId) {
            localStorage.setItem(`proxey.conversations.${userId}`, JSON.stringify(conversations));
        }
    }, [conversations, userId]);

    const markAsRead = (conversationId) => {
        setConversations(prev => prev.map(c =>
            c.id === conversationId ? { ...c, unread: 0 } : c
        ));
    };

    const getUnreadCount = () => {
        return conversations.reduce((total, c) => total + c.unread, 0);
    };

    return (
        <MessageContext.Provider value={{
            conversations,
            markAsRead,
            getUnreadCount
        }}>
            {children}
        </MessageContext.Provider>
    );
};
