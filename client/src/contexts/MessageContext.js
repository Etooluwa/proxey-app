import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '../auth/authContext';

const MessageContext = createContext();

export const useMessages = () => useContext(MessageContext);

const INITIAL_CLIENT_CONVERSATIONS = [
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

const INITIAL_PROVIDER_CONVERSATIONS = [
    {
        id: '1',
        clientName: 'Alice Cooper',
        avatar: 'https://picsum.photos/seed/alice/100/100',
        lastMessage: 'Is 10 AM okay for you?',
        time: '5m ago',
        unread: 1,
        online: true,
        serviceInterest: 'Deep Home Cleaning'
    },
    {
        id: '2',
        clientName: 'Bob Smith',
        avatar: 'https://picsum.photos/seed/bob/100/100',
        lastMessage: 'Thanks again for the great work!',
        time: '3h ago',
        unread: 0,
        online: false,
        serviceInterest: 'Window Cleaning'
    },
    {
        id: '3',
        clientName: 'Carol Danvers',
        avatar: 'https://picsum.photos/seed/carol/100/100',
        lastMessage: 'I need to reschedule.',
        time: '1d ago',
        unread: 0,
        online: false,
        serviceInterest: 'Move-out Clean'
    }
];

export const MessageProvider = ({ children }) => {
    const { session, role } = useSession();
    const userId = session?.user?.id;

    const [conversations, setConversations] = useState([]);

    // Load conversations when userId or role changes
    useEffect(() => {
        // Try to load from localStorage first if both userId and role are available
        if (userId && role) {
            const storageKey = `proxey.conversations.${role}.${userId}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    console.log('Loaded conversations from storage:', parsed);
                    setConversations(parsed);
                    return;
                } catch (e) {
                    console.error("Failed to parse conversations", e);
                }
            }
        }

        // If no role available yet, default to provider conversations for now
        // This handles the case where role loads asynchronously
        const initialConvs = role === 'provider' ? INITIAL_PROVIDER_CONVERSATIONS :
                            role === 'client' ? INITIAL_CLIENT_CONVERSATIONS :
                            INITIAL_PROVIDER_CONVERSATIONS; // default to provider

        console.log('Setting conversations with role:', role, 'convos count:', initialConvs.length);
        setConversations(initialConvs);
    }, [userId, role]);

    // Save conversations when they change
    useEffect(() => {
        if (userId && role && conversations.length > 0) {
            const storageKey = `proxey.conversations.${role}.${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(conversations));
        }
    }, [conversations, userId, role]);

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
