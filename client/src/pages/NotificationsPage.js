import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Icons } from '../components/Icons';

const NotificationsPage = () => {
    const { notifications, markAsRead, clearNotifications } = useNotifications();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                {notifications.length > 0 && (
                    <button
                        onClick={clearNotifications}
                        className="text-sm text-red-600 font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Clear All
                    </button>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-6 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!notification.read ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-500'}`}>
                                        <Icons.Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {notification.title}
                                            </h3>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                {new Date(notification.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {notification.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Icons.Bell size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No notifications</h3>
                        <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
