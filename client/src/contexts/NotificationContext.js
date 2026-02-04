import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from '../auth/authContext';
import { fetchClientNotifications, createClientNotification, markClientNotificationRead } from '../data/notifications';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { session } = useSession();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const data = await fetchClientNotifications();
            // Sanitize notifications to prevent React rendering objects
            const sanitized = (data || []).map(n => ({
                ...n,
                title: typeof n.title === 'object' ? JSON.stringify(n.title) : String(n.title || 'Notification'),
                message: typeof n.message === 'object' ? JSON.stringify(n.message) : String(n.message || n.body || ''),
                body: typeof n.body === 'object' ? JSON.stringify(n.body) : String(n.body || '')
            }));
            setNotifications(sanitized);
            setUnreadCount(sanitized.filter((n) => !n.is_read).length);
        } catch (error) {
            console.error("[notifications] Failed to load notifications", error);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const addNotification = async (notification) => {
        const payload = {
            type: notification.type || null,
            title: notification.title || notification.message || "Notification",
            body: notification.message || notification.body || "",
            data: notification.data || {},
        };
        const created = await createClientNotification(payload);
        setNotifications((prev) => [created, ...prev]);
        setUnreadCount((prev) => prev + (created.is_read ? 0 : 1));
    };

    const markAsRead = async (id) => {
        try {
            const updated = await markClientNotificationRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? updated : n))
            );
            setUnreadCount((prev) => prev - (updated.is_read ? 1 : 0));
        } catch (error) {
            console.error("[notifications] Failed to mark as read", error);
        }
    };

    const markAllAsRead = () => {
        // No bulk endpoint; mark locally and rely on individual calls if needed
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllAsRead,
            clearNotifications,
            refresh
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
