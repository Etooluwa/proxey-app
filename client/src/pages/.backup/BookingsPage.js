import React, { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { CATEGORIES } from '../constants';
import { useBookings } from '../contexts/BookingContext';

const generateCalendarLinks = (booking) => {
    const start = booking.scheduled_at || booking.scheduledAt;
    const startTime = start ? new Date(start) : new Date();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const details = {
        title: `${booking.service_name || booking.serviceName || 'Service'} with ${booking.provider_id || booking.providerName || 'Provider'}`,
        description: `Service: ${booking.service_name || booking.serviceName || ''}\nProvider: ${booking.provider_id || booking.providerName || ''}\nLocation: ${booking.location || ''}\nPrice: $${booking.price || ''}`,
        location: booking.location || '',
        start: formatDate(startTime),
        end: formatDate(endTime)
    };

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(details.title)}&dates=${details.start}/${details.end}&details=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${startTime.toISOString()}&enddt=${endTime.toISOString()}&subject=${encodeURIComponent(details.title)}&body=${encodeURIComponent(details.description)}&location=${encodeURIComponent(details.location)}`;

    const downloadIcs = () => {
        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
URL:${document.location.href}
DTSTART:${details.start}
DTEND:${details.end}
SUMMARY:${details.title}
DESCRIPTION:${details.description}
LOCATION:${details.location}
END:VEVENT
END:VCALENDAR`;

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'appointment.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return { googleUrl, outlookUrl, downloadIcs };
};

const CalendarExportModal = ({ booking, onClose }) => {
    const { googleUrl, outlookUrl, downloadIcs } = generateCalendarLinks(booking);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Add to Calendar</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group">
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm text-xl">G</div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">Google Calendar</span>
                    </a>

                    <a href={outlookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                            <Icons.Message size={20} />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">Outlook</span>
                    </a>

                    <button onClick={downloadIcs} className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group">
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm text-gray-600">
                            <Icons.Calendar size={20} />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">iCal / Apple Calendar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const BookingsPage = () => {
    const { bookings, upcoming, past, cancel } = useBookings();
    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showCalendarModal, setShowCalendarModal] = useState(false);

    useEffect(() => {
        if (selectedCategory === 'all') {
            setSelectedCategory(null);
        }
    }, [selectedCategory]);

    const filterByCategory = (list) => {
        if (!selectedCategory) return list;
        return list.filter(b => (b.category || '').toLowerCase() === selectedCategory.toLowerCase());
    };

    const filterBySearch = (list) => {
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(b =>
            (b.provider_name || b.providerId || '').toLowerCase().includes(q) ||
            (b.service_name || '').toLowerCase().includes(q) ||
            (b.location || '').toLowerCase().includes(q)
        );
    };

    const currentList = () => {
        const base = activeTab === 'UPCOMING' ? upcoming : past;
        return filterBySearch(filterByCategory(base));
    };

    const handleCancel = async (bookingId) => {
        try {
            await cancel(bookingId);
        } catch (e) {
            console.error("Cancel failed", e);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-500">Manage your upcoming and past appointments</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                            className={`px-3 py-2 rounded-lg text-sm font-semibold border ${selectedCategory === cat.name ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-gray-700 border-gray-200'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold border ${!selectedCategory ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                        All
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex p-1 bg-gray-100 rounded-xl w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('UPCOMING')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'UPCOMING'
                            ? 'bg-white shadow-sm text-brand-600'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Upcoming ({upcoming.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('PAST')}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PAST'
                            ? 'bg-white shadow-sm text-gray-900'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Past ({past.length})
                    </button>
                </div>

                <div className="relative w-full md:w-72">
                    <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {currentList().length === 0 && (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                        No bookings in this tab.
                    </div>
                )}

                {currentList().map((booking) => (
                    <div
                        key={booking.id}
                        className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-brand-100 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center">
                                <Icons.Calendar size={18} />
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {booking.service_name || booking.serviceName || 'Service'}
                                    </h3>
                                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                        {booking.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {booking.provider_id || booking.providerId || booking.providerName || 'Provider'}
                                </p>
                                <div className="flex gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Icons.Calendar size={14} /> {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleDateString() : booking.date || 'TBD'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Icons.Clock size={14} /> {booking.scheduled_at ? new Date(booking.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : booking.time || 'TBD'}
                                    </span>
                                    {booking.location && (
                                        <span className="flex items-center gap-1">
                                            <Icons.MapPin size={14} /> {booking.location}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={() => { setSelectedBooking(booking); setShowCalendarModal(true); }}
                                className="px-4 py-2 bg-white border border-gray-200 text-gray-800 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                            >
                                Add to calendar
                            </button>
                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <button
                                    onClick={() => handleCancel(booking.id)}
                                    className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-xl text-sm font-bold hover:bg-red-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showCalendarModal && selectedBooking && (
                <CalendarExportModal booking={selectedBooking} onClose={() => setShowCalendarModal(false)} />
            )}
        </div>
    );
};

export default BookingsPage;
