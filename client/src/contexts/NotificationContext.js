import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '../auth/authContext';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { session, profile } = useSession();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Load notifications from localStorage on mount (simulating backend)
    useEffect(() => {
        if (session?.user?.id) {
            const savedNotifications = localStorage.getItem(`notifications_${session.user.id}`);
            if (savedNotifications) {
                const parsed = JSON.parse(savedNotifications);
                setNotifications(parsed);
                setUnreadCount(parsed.filter(n => !n.read).length);
            } else {
                // Initial state for new users - could be triggered by onboarding, 
                // but checking here ensures it exists if local storage is empty.
                // However, we'll let the onboarding flow trigger it to be more precise,
                // or just leave it empty initially.
                setNotifications([]);
                setUnreadCount(0);
            }
        }
    }, [session?.user?.id]);

    // Save to localStorage whenever notifications change
    useEffect(() => {
        if (session?.user?.id) {
            localStorage.setItem(`notifications_${session.user.id}`, JSON.stringify(notifications));
            setUnreadCount(notifications.filter(n => !n.read).length);
        }
    }, [notifications, session?.user?.id]);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
