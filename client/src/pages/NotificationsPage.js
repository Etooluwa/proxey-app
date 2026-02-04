import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Icons } from '../components/Icons';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, clearNotifications } = useNotifications();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment_request':
                return Icons.Calendar;
            case 'appointment_accepted':
            case 'appointment_declined':
                return Icons.CheckCircle;
            default:
                return Icons.Bell;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'appointment_request':
                return 'bg-yellow-100 text-yellow-600';
            case 'appointment_accepted':
                return 'bg-green-100 text-green-600';
            case 'appointment_declined':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-brand-100 text-brand-600';
        }
    };

    const handleRequestClick = (notification) => {
        markAsRead(notification.id);
        // Find the request ID from notification data
        if (notification.requestId) {
            navigate(`/provider/requests/${notification.requestId}`);
        }
    };

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
                        {notifications.map((notification) => {
                            const IconComponent = getNotificationIcon(notification.type);
                            const colorClass = getNotificationColor(notification.type);
                            const isRequest = notification.type === 'appointment_request';

                            return (
                                <div
                                    key={notification.id}
                                    onClick={() => {
                                        if (isRequest) {
                                            handleRequestClick(notification);
                                        } else {
                                            markAsRead(notification.id);
                                        }
                                    }}
                                    className={`p-6 transition-colors cursor-pointer ${
                                        !notification.read ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                                    } ${isRequest ? 'border-l-4 border-l-yellow-400' : ''}`}
                                >
                                    <div className="flex gap-4 items-start">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                            <IconComponent size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1 gap-4">
                                                <div>
                                                    <h3 className={`text-sm font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    {isRequest && (
                                                        <p className="text-xs text-yellow-600 font-semibold mt-1">ACTION REQUIRED</p>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                    {new Date(notification.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {notification.message}
                                            </p>

                                            {/* Action Button for Request Notifications */}
                                            {isRequest && (
                                                <div className="mt-4 flex gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRequestClick(notification);
                                                        }}
                                                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg font-bold text-sm hover:bg-yellow-200 transition-colors"
                                                    >
                                                        Review Request
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
