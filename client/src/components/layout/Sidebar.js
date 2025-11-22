import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { useAuth } from '../../auth/authContext';

export const Sidebar = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const clientLinks = [
        { id: 'home', path: '/app', label: 'Home', icon: Icons.Dashboard },
        { id: 'bookings', path: '/app/bookings', label: 'My Bookings', icon: Icons.Calendar },
        { id: 'messages', path: '/app/messages', label: 'Messages', icon: Icons.Message },
        { id: 'profile', path: '/app/account', label: 'Profile', icon: Icons.User },
    ];

    const providerLinks = [
        { id: 'dashboard', path: '/provider', label: 'Dashboard', icon: Icons.Dashboard },
        { id: 'schedule', path: '/provider/schedule', label: 'Schedule', icon: Icons.Calendar },
        { id: 'earnings', path: '/provider/earnings', label: 'Earnings', icon: Icons.Wallet },
        { id: 'messages', path: '/provider/messages', label: 'Messages', icon: Icons.Message },
        { id: 'services', path: '/provider/services', label: 'My Services', icon: Icons.Wrench },
        { id: 'profile', path: '/provider/profile', label: 'Profile', icon: Icons.User },
    ];

    const links = role === 'client' ? clientLinks : providerLinks;

    const handleLogout = async () => {
        await signOut();
        navigate('/auth/sign-in');
    };

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-100 h-full sticky top-0">
            <div className="p-8 flex items-center gap-2">
                {/* Logo Mockup */}
                <div className="w-8 h-8 bg-brand-400 rounded-lg transform rotate-45 flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm transform -rotate-45"></div>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Kliques</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-4">
                    Menu
                </div>
                {links.map((link) => {
                    const Icon = link.icon;
                    // Check if current path starts with link path (for active state)
                    // Exact match for root /app or /provider, startsWith for others
                    const isActive = link.path === '/app' || link.path === '/provider'
                        ? location.pathname === link.path
                        : location.pathname.startsWith(link.path);

                    return (
                        <button
                            key={link.id}
                            onClick={() => navigate(link.path)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-brand-50 text-brand-600 font-semibold shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
                            <span>{link.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <Icons.LogOut size={20} />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
    );
};
