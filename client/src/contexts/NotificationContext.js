import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from '../auth/authContext';
import {
    fetchClientNotifications,
    fetchProviderNotifications,
    markClientNotificationRead,
    markProviderNotificationRead,
    markAllNotificationsRead as markAllRead,
    deleteNotification as deleteNotif
} from '../data/notifications';
import { supabase } from '../utils/supabase';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

// Helper to sanitize notification data for React rendering
const sanitizeNotification = (n) => ({
    ...n,
    title: typeof n.title === 'object' ? JSON.stringify(n.title) : String(n.title || 'Notification'),
    message: typeof n.message === 'object' ? JSON.stringify(n.message) : String(n.message || n.body || ''),
    body: typeof n.body === 'object' ? JSON.stringify(n.body) : String(n.body || ''),
    // Normalize timestamp field
    timestamp: n.timestamp || n.created_at,
    // Normalize read status
    read: n.read ?? n.is_read ?? false,
    is_read: n.is_read ?? n.read ?? false
});

export const NotificationProvider = ({ children }) => {
    const { session } = useSession();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const subscriptionRef = useRef(null);

    // Determine user role
    const userRole = session?.user?.role || 'client';
    const isProvider = userRole === 'provider';

    const refresh = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        try {
            const fetchFn = isProvider ? fetchProviderNotifications : fetchClientNotifications;
            const data = await fetchFn();
            const sanitized = (data || []).map(sanitizeNotification);
            setNotifications(sanitized);
            setUnreadCount(sanitized.filter((n) => !n.is_read).length);
        } catch (error) {
            console.error("[notifications] Failed to load notifications", error);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id, isProvider]);

    // Initial load
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!supabase || !session?.user?.id) return;

        const userId = session.user.id;
        const tableName = isProvider ? 'notifications' : 'client_notifications';
        const filterField = isProvider ? 'provider_id' : 'user_id';

        // Subscribe to INSERT and UPDATE events
        const channel = supabase
            .channel(`${tableName}:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: tableName,
                    filter: `${filterField}=eq.${userId}`
                },
                (payload) => {
                    console.log('[notifications] Real-time notification received:', payload);
                    const newNotification = sanitizeNotification(payload.new);
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: tableName,
                    filter: `${filterField}=eq.${userId}`
                },
                (payload) => {
                    console.log('[notifications] Real-time notification updated:', payload);
                    const updated = sanitizeNotification(payload.new);
                    setNotifications((prev) => {
                        const newList = prev.map((n) => (n.id === updated.id ? updated : n));
                        setUnreadCount(newList.filter((n) => !n.is_read).length);
                        return newList;
                    });
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: tableName,
                    filter: `${filterField}=eq.${userId}`
                },
                (payload) => {
                    console.log('[notifications] Real-time notification deleted:', payload);
                    setNotifications((prev) => {
                        const newList = prev.filter((n) => n.id !== payload.old.id);
                        setUnreadCount(newList.filter((n) => !n.is_read).length);
                        return newList;
                    });
                }
            )
            .subscribe((status) => {
                console.log('[notifications] Subscription status:', status);
            });

        subscriptionRef.current = channel;

        // Cleanup subscription on unmount or user change
        return () => {
            if (subscriptionRef.current) {
                console.log('[notifications] Unsubscribing from real-time notifications');
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
        };
    }, [session?.user?.id, isProvider]);

    const markAsRead = async (id) => {
        try {
            const markFn = isProvider ? markProviderNotificationRead : markClientNotificationRead;
            const updated = await markFn(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? sanitizeNotification(updated) : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("[notifications] Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await markAllRead(userRole);
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("[notifications] Failed to mark all as read", error);
            // Fallback: mark locally
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await deleteNotif(id, userRole);
            setNotifications((prev) => {
                const notification = prev.find((n) => n.id === id);
                const newList = prev.filter((n) => n.id !== id);
                if (notification && !notification.is_read) {
                    setUnreadCount((prev) => Math.max(0, prev - 1));
                }
                return newList;
            });
        } catch (error) {
            console.error("[notifications] Failed to delete notification", error);
        }
    };

    const clearNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            loading,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            clearNotifications,
            refresh
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
