import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../ui/SideMenu';
import { DesktopSidebar, DesktopHeader } from './DesktopSidebar';
import { useSession } from '../../auth/authContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useMessages } from '../../contexts/MessageContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { request } from '../../data/apiClient';
import { supabase } from '../../utils/supabase';
import { fetchProviderProfile } from '../../data/provider';

// ─── Provider nav items ───────────────────────────────────────────────────────
const PROVIDER_MENU = [
    {
        id: 'home',
        label: 'Home',
        path: '/provider',
        d: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
    },
    {
        id: 'bookings',
        label: 'Bookings',
        path: '/provider/bookings',
        d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
        id: 'clients',
        label: 'My kliques',
        path: '/provider/clients',
        d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
        id: 'services',
        label: 'Services',
        path: '/provider/services',
        d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    },
    {
        id: 'calendar',
        label: 'Calendar',
        path: '/provider/calendar',
        d: 'M8 7V3m8 4V3M3 11h18M5 5h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z',
    },
    {
        id: 'messages',
        label: 'Messages',
        path: '/provider/messages',
        d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        badge: true,
    },
    {
        id: 'earnings',
        label: 'Earnings',
        path: '/provider/earnings',
        d: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        path: '/provider/notifications',
        d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        badge: true,
    },
    {
        id: 'profile',
        label: 'Profile',
        path: '/provider/profile',
        d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
];

// ─── Page titles for desktop header ──────────────────────────────────────────
const PAGE_TITLES = {
    '/provider': { title: 'Dashboard', subtitle: 'Welcome back' },
    '/provider/bookings': { title: '', subtitle: '' },
    '/provider/clients': { title: 'My Kliques', subtitle: '' },
    '/provider/insights': { title: 'Client Insights', subtitle: '' },
    '/provider/services': { title: 'Services', subtitle: '' },
    '/provider/calendar': { title: 'Calendar', subtitle: '' },
    '/provider/messages': { title: 'Messages', subtitle: '' },
    '/provider/earnings': { title: 'Earnings', subtitle: '' },
    '/provider/notifications': { title: 'Notifications', subtitle: '' },
    '/provider/profile': { title: 'Profile', subtitle: '' },
};

function useActiveId(items, rootPath) {
    const { pathname } = useLocation();
    const sorted = [...items].sort((a, b) => b.path.length - a.path.length);
    for (const item of sorted) {
        if (item.path === rootPath) {
            if (pathname === rootPath) return item.id;
        } else if (pathname.startsWith(item.path)) {
            return item.id;
        }
    }
    return items[0]?.id ?? 'home';
}

function usePageMeta(rootPath) {
    const { pathname } = useLocation();
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Find longest prefix match
    let best = null;
    let bestLen = 0;
    for (const [path, meta] of Object.entries(PAGE_TITLES)) {
        if (path !== rootPath && pathname.startsWith(path) && path.length > bestLen) {
            best = meta;
            bestLen = path.length;
        }
    }
    return best || { title: '', subtitle: '' };
}

const ProviderLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const navigate = useNavigate();
    const { session, profile, logout, updateProfile } = useSession();
    const isDesktop = useIsDesktop();
    const { getUnreadCount } = useMessages();
    const { unreadCount: notifUnread } = useNotifications();

    const msgUnread = getUnreadCount();
    const providerId = session?.user?.id;

    const refreshPendingCount = useCallback(() => {
        if (!providerId) {
            setPendingCount(0);
            return Promise.resolve();
        }

        return request('/provider/bookings/pending-count')
            .then((d) => setPendingCount(d?.count ?? 0))
            .catch(() => setPendingCount(0));
    }, [providerId]);

    // Fetch pending booking count for the Bookings badge
    useEffect(() => {
        refreshPendingCount();
    }, [refreshPendingCount]);

    useEffect(() => {
        if (!providerId) return undefined;

        let cancelled = false;

        async function hydrateProviderProfile() {
            try {
                const providerProfile = await fetchProviderProfile();
                if (cancelled || !providerProfile) return;

                await updateProfile({
                    name: providerProfile.name || providerProfile.business_name || profile?.name,
                    city: providerProfile.city || profile?.city,
                    photo: providerProfile.photo || providerProfile.avatar || profile?.photo,
                    avatar: providerProfile.avatar || providerProfile.photo || profile?.avatar,
                    // If the provider has a handle, they completed onboarding — mark profile complete
                    ...(providerProfile.handle ? { isProfileComplete: true } : {}),
                });
            } catch (error) {
                console.warn('[ProviderLayout] Failed to hydrate provider profile', error);
            }
        }

        hydrateProviderProfile();

        return () => {
            cancelled = true;
        };
    }, [providerId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!supabase || !providerId) return undefined;

        const channel = supabase
            .channel(`provider-layout-bookings:${providerId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'bookings',
                filter: `provider_id=eq.${providerId}`,
            }, () => {
                refreshPendingCount();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [providerId, refreshPendingCount]);

    const activeId = useActiveId(PROVIDER_MENU, '/provider');
    const { title, subtitle } = usePageMeta('/provider');

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const avatarSrc = profile?.photo || profile?.avatar || '';

    // Inject live counts into nav items
    const navItems = PROVIDER_MENU.map((item) => {
        if (item.id === 'bookings') return { ...item, count: pendingCount > 0 ? pendingCount : undefined };
        if (item.id === 'messages') return { ...item, badge: false, count: msgUnread > 0 ? msgUnread : undefined };
        if (item.id === 'notifications') return { ...item, badge: false, count: notifUnread > 0 ? notifUnread : undefined };
        return item;
    });

    const handleNav = (id) => {
        const item = PROVIDER_MENU.find((m) => m.id === id);
        if (item) navigate(item.path);
    };

    const handleSignOut = () => {
        logout().then(() => navigate('/login'));
    };

    // ── Desktop layout ────────────────────────────────────────────────────────
    if (isDesktop) {
        return (
            <div style={{ minHeight: '100vh', background: '#FBF7F2' }}>
                <DesktopSidebar
                    items={navItems}
                    active={activeId}
                    onNav={handleNav}
                    userName={displayName}
                    userInitials={initials}
                    userAvatar={avatarSrc}
                    isProvider={true}
                    onSignOut={handleSignOut}
                />
                <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
                    <DesktopHeader title={title} subtitle={subtitle} />
                    <main style={{ paddingTop: 16 }}>
                        <Outlet context={{ onMenu: () => {}, isDesktop: true }} />
                    </main>
                </div>
            </div>
        );
    }

    // ── Mobile layout ─────────────────────────────────────────────────────────
    return (
        <div className="relative min-h-screen" style={{ background: '#FBF7F2' }}>
            <main>
                <Outlet context={{ onMenu: () => setMenuOpen(true), isDesktop: false }} />
            </main>
            <SideMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={navItems}
                active={activeId}
                onNav={handleNav}
                userName={displayName}
                userInitials={initials}
                userAvatar={avatarSrc}
                onSignOut={handleSignOut}
            />
        </div>
    );
};

export default ProviderLayout;
