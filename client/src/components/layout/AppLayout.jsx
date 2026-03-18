import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../ui/SideMenu';
import { useSession } from '../../auth/authContext';

// ─── Client menu items ────────────────────────────────────────────────────────
// id maps to the first path segment after /app (or 'home' for the index route)
// d is the SVG path string for the 22×22 icon
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
        id: 'profile',
        label: 'Profile',
        path: '/app/account',
        d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
];

// Derive the active menu id from the current pathname
function useClientActiveId(items) {
    const { pathname } = useLocation();
    // Exact match for the root /app route; startsWith for all others
    for (const item of items) {
        if (item.path === '/app') {
            if (pathname === '/app') return item.id;
        } else if (pathname.startsWith(item.path)) {
            return item.id;
        }
    }
    return 'home';
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const AppLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { session, profile, logout } = useSession();

    const activeId = useClientActiveId(CLIENT_MENU);

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'You';
    const initials = displayName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    const userPhoto = profile?.photo || undefined;

    const handleNav = (id) => {
        if (id === 'logout') {
            logout().then(() => navigate('/'));
            return;
        }
        const item = CLIENT_MENU.find((m) => m.id === id);
        if (item) navigate(item.path);
    };

    return (
        <div className="relative min-h-screen bg-background font-manrope">
            {/* Page content — each child page renders its own GradientHeader */}
            <main>
                <Outlet context={{ onMenu: () => setMenuOpen(true) }} />
            </main>

            {/* Offcanvas side menu */}
            <SideMenu
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={CLIENT_MENU}
                active={activeId}
                onNav={handleNav}
                userName={displayName}
                userInitials={initials}
                userPhoto={userPhoto}
            />
        </div>
    );
};

export default AppLayout;
