import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';

export const MobileBottomNav = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const clientLinks = [
        { id: 'home', path: '/app', label: 'Home', icon: Icons.Dashboard },
        { id: 'bookings', path: '/app/bookings', label: 'Bookings', icon: Icons.Calendar },
        { id: 'messages', path: '/app/messages', label: 'Messages', icon: Icons.Message },
        { id: 'profile', path: '/app/account', label: 'Profile', icon: Icons.User },
    ];

    const providerLinks = [
        { id: 'dashboard', path: '/provider', label: 'Home', icon: Icons.Dashboard },
        { id: 'schedule', path: '/provider/schedule', label: 'Schedule', icon: Icons.Calendar },
        { id: 'earnings', path: '/provider/earnings', label: 'Earn', icon: Icons.Wallet },
        { id: 'messages', path: '/provider/messages', label: 'Chat', icon: Icons.Message },
        { id: 'services', path: '/provider/services', label: 'Services', icon: Icons.Wrench },
        { id: 'profile', path: '/provider/profile', label: 'Profile', icon: Icons.User },
    ];

    const links = role === 'client' ? clientLinks : providerLinks;

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-safe-area safe-area-bottom">
            <div className="flex justify-around items-center h-16 px-1">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = link.path === '/app' || link.path === '/provider'
                        ? location.pathname === link.path
                        : location.pathname.startsWith(link.path);

                    return (
                        <button
                            key={link.id}
                            onClick={() => navigate(link.path)}
                            className={`flex-1 flex flex-col items-center justify-center h-full py-1 transition-colors active:scale-95 ${isActive ? 'text-brand-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Icon
                                size={role === 'provider' ? 20 : 24}
                                className={`mb-1 ${isActive ? 'fill-brand-50' : ''}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className={`font-medium leading-tight ${role === 'provider' ? 'text-[9px]' : 'text-[10px]'}`}>
                                {link.label}
                            </span>
                        </button>
                    );
                })}
            </div>
            {/* Spacer for iPhone Home Indicator if needed, though usually handled by body padding/safe-area */}
        </div>
    );
};
