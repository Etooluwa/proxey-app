import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Icons } from '../Icons';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';

const AppShell = () => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const { unreadCount, notifications, markAllAsRead } = useNotifications();

    // Display helpers with fallbacks
    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'User';
    const displayPhoto = profile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
    const displayCity = profile?.city || profile?.defaultLocation || 'San Francisco, CA';

    const handleNotificationClick = (e) => {
        e.stopPropagation();
        if (!notificationsOpen && markAllAsRead) {
            markAllAsRead();
        }
        setNotificationsOpen(!notificationsOpen);
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
            <Sidebar role="client" />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <header className="h-16 md:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 relative">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden flex items-center gap-2">
                            <div className="w-6 h-6 bg-brand-400 rounded-md transform rotate-45 flex items-center justify-center">
                                <div className="w-3 h-3 bg-white rounded-sm transform -rotate-45"></div>
                            </div>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kliques</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 relative">
                        {/* Location Badge */}
                        <div className="hidden md:flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <Icons.MapPin size={16} className="text-brand-500" />
                            <span className="text-sm text-gray-600 font-medium">{displayCity}</span>
                        </div>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={handleNotificationClick}
                                className={`relative p-2 rounded-full transition-colors ${notificationsOpen ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Icons.Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Notifications</h3>
                                        <button onClick={() => navigate('/app/notifications')} className="text-xs font-bold text-brand-600 hover:underline">See All</button>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications && notifications.length > 0 ? (
                                            notifications.slice(0, 5).map((notification, idx) => (
                                                <div key={notification.id || idx} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''}`}>
                                                    <p className="text-sm text-gray-800 font-medium mb-1">{notification.title}</p>
                                                    <p className="text-xs text-gray-500">{notification.message}</p>
                                                    <p className="text-[10px] text-gray-400 mt-2">{new Date(notification.timestamp || Date.now()).toLocaleDateString()}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-gray-400 text-sm">
                                                No notifications yet
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Link */}
                        <button
                            onClick={() => navigate('/app/account')}
                            className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100 hover:bg-gray-50 rounded-xl transition-colors p-1"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">{displayName}</p>
                                <p className="text-xs text-gray-500">MEMBER</p>
                            </div>
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white shadow-sm object-cover"
                            />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto scroll-smooth pb-24 md:pb-10">
                    <Outlet />
                </main>

                <MobileBottomNav role="client" />
            </div>
        </div>
    );
};

export default AppShell;
