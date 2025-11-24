import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const [conversations, setConversations] = useState(() => {
        const saved = localStorage.getItem('conversations');
        return saved ? JSON.parse(saved) : INITIAL_CONVERSATIONS;
    });

    useEffect(() => {
        localStorage.setItem('conversations', JSON.stringify(conversations));
    }, [conversations]);

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
