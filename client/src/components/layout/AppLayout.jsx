import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../ui/SideMenu';
import { DesktopSidebar, DesktopHeader } from './DesktopSidebar';
import { useSession } from '../../auth/authContext';
import { useIsDesktop } from '../../hooks/useIsDesktop';
import { useMessages } from '../../contexts/MessageContext';
import { useNotifications } from '../../contexts/NotificationContext';

// ─── Client nav items ─────────────────────────────────────────────────────────
const CLIENT_MENU = [
    {
        id: 'home',
        label: 'My kliques',
        path: '/app',
        d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    },
    {
        id: 'messages',
        label: 'Messages',
        path: '/app/messages',
        d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
        badge: true,
    },
    {
        id: 'notifications',
        label: 'Notifications',
        path: '/app/notifications',
        d: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
        badge: true,
    },
    {
        id: 'profile',
        label: 'Profile',
        path: '/app/profile',
        d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
];

// ─── Page titles for desktop header ──────────────────────────────────────────
const PAGE_TITLES = {
    '/app': { title: 'My Kliques', subtitle: 'Your relationships' },
    '/app/messages': { title: 'Messages', subtitle: '' },
    '/app/notifications': { title: 'Notifications', subtitle: '' },
    '/app/profile': { title: 'Profile', subtitle: '' },
};

function useActiveId(items, rootPath) {
    const { pathname } = useLocation();
    for (const item of items) {
        if (item.path === rootPath) {
            if (pathname === rootPath) return item.id;
        } else if (pathname.startsWith(item.path)) {
            return item.id;
        }
    }
    return items[0]?.id ?? 'home';
}

function usePageMeta(items, rootPath) {
    const { pathname } = useLocation();
    // Exact match first
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    // Prefix match
    for (const [path, meta] of Object.entries(PAGE_TITLES)) {
        if (path !== rootPath && pathname.startsWith(path)) return meta;
    }
    return { title: '', subtitle: '' };
}

const AppLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { session, profile, logout } = useSession();
    const isDesktop = useIsDesktop();
    const { getUnreadCount } = useMessages();
    const { unreadCount: notifUnread } = useNotifications();

    const msgUnread = getUnreadCount();

    const activeId = useActiveId(CLIENT_MENU, '/app');
    const { title, subtitle } = usePageMeta(CLIENT_MENU, '/app');

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const initials = displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    // Inject live counts into nav items
    const navItems = CLIENT_MENU.map((item) => {
        if (item.id === 'messages') return { ...item, count: msgUnread > 0 ? msgUnread : undefined };
        if (item.id === 'notifications') return { ...item, count: notifUnread > 0 ? notifUnread : undefined };
        return item;
    });

    const handleNav = (id) => {
        const item = CLIENT_MENU.find((m) => m.id === id);
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
                    isProvider={false}
                    onSignOut={handleSignOut}
                />
                <div style={{ marginLeft: '260px', minHeight: '100vh' }}>
                    <DesktopHeader title={title} subtitle={subtitle} />
                    <main>
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
                onSignOut={handleSignOut}
            />
        </div>
    );
};

export default AppLayout;
