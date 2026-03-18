import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SideMenu from '../ui/SideMenu';
import { useSession } from '../../auth/authContext';

// ─── Provider menu items ──────────────────────────────────────────────────────
// id maps to the first path segment after /provider (or 'home' for the index route)
// d is the SVG path string for the 22×22 icon
const PROVIDER_MENU = [
    {
        id: 'home',
        label: 'Home',
        path: '/provider',
        d: 'M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9',
    },
    {
        id: 'appointments',
        label: 'Bookings',
        path: '/provider/appointments',
        d: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
        badge: true,
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
        id: 'schedule',
        label: 'Calendar',
        path: '/provider/schedule',
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
        id: 'profile',
        label: 'Profile',
        path: '/provider/profile',
        d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
];

// Derive the active menu id from the current pathname
function useProviderActiveId(items) {
    const { pathname } = useLocation();
    // Exact match for the root /provider route; startsWith for all others
    for (const item of items) {
        if (item.path === '/provider') {
            if (pathname === '/provider') return item.id;
        } else if (pathname.startsWith(item.path)) {
            return item.id;
        }
    }
    return 'home';
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const ProviderLayout = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { session, profile, logout } = useSession();

    const activeId = useProviderActiveId(PROVIDER_MENU);

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
        const item = PROVIDER_MENU.find((m) => m.id === id);
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
                items={PROVIDER_MENU}
                active={activeId}
                onNav={handleNav}
                userName={displayName}
                userInitials={initials}
                userPhoto={userPhoto}
            />
        </div>
    );
};

export default ProviderLayout;
