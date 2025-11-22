
import React from 'react';
import { Icons } from './Icons';
import { UserRole } from '../types';

interface NotificationPanelProps {
  role: UserRole;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ role, onClose }) => {
  // Mock Data tailored for Provider view based on context
  const PROVIDER_NOTIFICATIONS = [
    {
      id: '1',
      type: 'BOOKING_REQ',
      title: 'New Booking Request',
      message: 'Michael Scott requested a Deep Home Cleaning.',
      time: '10 min ago',
      unread: true,
      icon: Icons.Calendar,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      id: '2',
      type: 'SYSTEM',
      title: 'Payout Processed',
      message: 'Your weekly payout of $450.00 has been sent to your bank.',
      time: '1 hour ago',
      unread: true,
      icon: Icons.Wallet,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: '3',
      type: 'REMINDER',
      title: 'Upcoming Appointment',
      message: 'Reminder: Cleaning with Alice Cooper starts in 1 hour.',
      time: '2 hours ago',
      unread: false,
      icon: Icons.Clock,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      id: '4',
      type: 'REVIEW',
      title: 'New 5-Star Review',
      message: '"Jane was amazing! Highly recommended."',
      time: '1 day ago',
      unread: false,
      icon: Icons.Star,
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      id: '5',
      type: 'SECURITY',
      title: 'Security Alert',
      message: 'New login detected from San Jose, CA.',
      time: '2 days ago',
      unread: false,
      icon: Icons.Alert,
      color: 'bg-gray-100 text-gray-600'
    }
  ];

  const CLIENT_NOTIFICATIONS = [
    {
      id: '1',
      type: 'BOOKING_CONFIRM',
      title: 'Booking Confirmed',
      message: 'Sarah Jenkins accepted your request for Deep Home Cleaning.',
      time: '2 hours ago',
      unread: true,
      icon: Icons.Check,
      color: 'bg-green-100 text-green-600'
    },
    {
      id: '2',
      type: 'MESSAGE',
      title: 'New Message',
      message: 'Mike Ross: "Can you send me a photo of the leak?"',
      time: '5 hours ago',
      unread: true,
      icon: Icons.Message,
      color: 'bg-brand-100 text-brand-600'
    }
  ];

  const notifications = role === UserRole.PROVIDER ? PROVIDER_NOTIFICATIONS : CLIENT_NOTIFICATIONS;

  return (
    <div className="absolute top-16 right-0 md:right-10 w-full md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-bold text-gray-900">Notifications</h3>
        <button className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">
          Mark all as read
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => {
            const Icon = notification.icon;
            return (
              <div 
                key={notification.id} 
                className={`p-4 flex gap-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer relative ${notification.unread ? 'bg-blue-50/30' : ''}`}
              >
                {/* Unread Dot */}
                {notification.unread && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center ${notification.color}`}>
                  <Icon size={20} />
                </div>
                
                <div>
                  <h4 className={`text-sm ${notification.unread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                    {notification.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed pr-4">
                    {notification.message}
                  </p>
                  <span className="text-[10px] text-gray-400 font-medium mt-2 block">
                    {notification.time}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Icons.Bell className="text-gray-300" size={24} />
            </div>
            <p className="text-sm text-gray-500 font-medium">No new notifications</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-50 bg-gray-50/30 text-center">
        <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-gray-700">
          View All History
        </button>
      </div>
    </div>
  );
};
