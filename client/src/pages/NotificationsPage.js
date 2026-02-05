import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import { Icons } from '../components/Icons';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, deleteNotification, loading } = useNotifications();

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'appointment_request':
            case 'booking_request':
            case 'time_request':
                return Icons.Calendar;
            case 'appointment_accepted':
            case 'booking_accepted':
            case 'time_request_accepted':
                return Icons.CheckCircle;
            case 'appointment_declined':
            case 'booking_declined':
            case 'time_request_declined':
                return Icons.XCircle;
            case 'booking_cancelled':
                return Icons.XCircle;
            case 'new_message':
                return Icons.MessageSquare;
            default:
                return Icons.Bell;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'appointment_request':
            case 'booking_request':
            case 'time_request':
                return 'bg-yellow-100 text-yellow-600';
            case 'appointment_accepted':
            case 'booking_accepted':
            case 'time_request_accepted':
                return 'bg-green-100 text-green-600';
            case 'appointment_declined':
            case 'booking_declined':
            case 'time_request_declined':
            case 'booking_cancelled':
                return 'bg-red-100 text-red-600';
            case 'new_message':
                return 'bg-blue-100 text-blue-600';
            default:
                return 'bg-brand-100 text-brand-600';
        }
    };

    const isActionRequired = (type) => {
        return ['appointment_request', 'booking_request', 'time_request'].includes(type);
    };

    const handleNotificationClick = (notification) => {
        markAsRead(notification.id);
        // Navigate based on notification type
        const requestId = notification.request_id || notification.data?.request_id;
        const bookingId = notification.booking_id || notification.data?.booking_id;
        const threadId = notification.data?.thread_id;

        if (isActionRequired(notification.type) && requestId) {
            navigate(`/provider/requests/${requestId}`);
        } else if (bookingId) {
            navigate(`/bookings/${bookingId}`);
        } else if (notification.type === 'new_message' && threadId) {
            navigate(`/messages/${threadId}`);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read && !n.read).length;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                    {unreadCount > 0 && (
                        <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
                    )}
                </div>
                {notifications.length > 0 && unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-brand-600 font-bold hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {loading ? (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading notifications...</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((notification) => {
                                const IconComponent = getNotificationIcon(notification.type);
                                const colorClass = getNotificationColor(notification.type);
                                const isRequest = isActionRequired(notification.type);
                                const isUnread = !notification.is_read && !notification.read;

                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-6 transition-colors cursor-pointer ${
                                            isUnread ? 'bg-blue-50/30 hover:bg-blue-50/50' : 'hover:bg-gray-50'
                                        } ${isRequest ? 'border-l-4 border-l-yellow-400' : ''}`}
                                    >
                                        <div className="flex gap-4 items-start">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                                <IconComponent size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1 gap-4">
                                                    <div>
                                                        <h3 className={`text-sm font-bold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                            {notification.title}
                                                        </h3>
                                                        {isRequest && (
                                                            <p className="text-xs text-yellow-600 font-semibold mt-1">ACTION REQUIRED</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                                            {new Date(notification.timestamp || notification.created_at).toLocaleString()}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Delete notification"
                                                        >
                                                            <Icons.X size={14} className="text-gray-400" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {notification.message || notification.body}
                                                </p>

                                                {/* Action Button for Request Notifications */}
                                                {isRequest && (
                                                    <div className="mt-4 flex gap-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleNotificationClick(notification);
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
            )}
        </div>
    );
};

export default NotificationsPage;
