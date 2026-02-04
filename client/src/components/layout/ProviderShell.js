import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { Icons } from '../Icons';
import { useSession } from '../../auth/authContext';
import { useNotifications } from '../../contexts/NotificationContext';

const ProviderShell = () => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const { notifications, unreadCount, markAllAsRead } = useNotifications();

    const displayName = profile?.name || session?.user?.email?.split('@')[0] || 'Provider';
    const displayPhoto = profile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-800 relative">
            <Sidebar role="provider" />

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

                        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-64 lg:w-96 transition-all focus-within:ring-2 focus-within:ring-brand-100 focus-within:border-brand-300">
                            <Icons.Search size={18} className="text-gray-400 mr-3" />
                            <input type="text" placeholder="Search..." className="bg-transparent outline-none text-sm w-full placeholder-gray-400 text-gray-700" />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-6 relative">
                        <div className="hidden md:flex items-center gap-2 text-gray-400 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                            <Icons.MapPin size={16} className="text-brand-500" />
                            <span className="text-sm text-gray-600 font-medium">{profile?.city || 'Location'}</span>
                        </div>

                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNotificationsOpen(!notificationsOpen);
                                    if (!notificationsOpen && unreadCount > 0) {
                                        markAllAsRead();
                                    }
                                }}
                                className={`relative p-2 rounded-full transition-colors ${notificationsOpen ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Icons.Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllAsRead} className="text-xs font-bold text-brand-600 hover:text-brand-700">
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length > 0 ? (
                                            notifications.slice(0, 5).map((notification) => {
                                                const isRequest = notification.type === 'appointment_request';
                                                const getIcon = () => {
                                                    if (isRequest) return Icons.Calendar;
                                                    if (notification.type === 'appointment_accepted') return Icons.Check;
                                                    if (notification.type === 'appointment_declined') return Icons.X;
                                                    return Icons.Bell;
                                                };
                                                const NotifIcon = getIcon();
                                                const bgColor = isRequest ? 'bg-yellow-100 text-yellow-600' : (!notification.read ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500');

                                                return (
                                                    <div key={notification.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}>
                                                        <div className="flex gap-3">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                                                                <NotifIcon size={14} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{notification.title}</p>
                                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
                                                                {isRequest && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setNotificationsOpen(false);
                                                                            navigate(`/provider/requests/${notification.requestId}`);
                                                                        }}
                                                                        className="text-xs font-bold text-yellow-600 hover:text-yellow-700 mt-2"
                                                                    >
                                                                        Review Request →
                                                                    </button>
                                                                )}
                                                                <p className="text-[10px] text-gray-400 mt-2">{new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-8 text-center text-gray-400">
                                                <p className="text-sm">No notifications yet</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setNotificationsOpen(false);
                                                navigate('/provider/notifications');
                                            }}
                                            className="text-sm font-bold text-brand-600 hover:text-brand-700"
                                        >
                                            See All
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/provider/profile')}
                            className="flex items-center gap-3 pl-2 md:pl-4 border-l border-gray-100 hover:bg-gray-50 rounded-xl transition-colors p-1"
                        >
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-bold text-gray-900">{displayName}</p>
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
                <main className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth pb-24 md:pb-10">
                    <Outlet />
                </main>

                <MobileBottomNav role="provider" />
            </div>
        </div>
    );
};

export default ProviderShell;
