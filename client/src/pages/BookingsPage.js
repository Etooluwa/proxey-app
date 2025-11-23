import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { CATEGORIES, TOP_PROVIDERS, CLIENT_BOOKINGS } from '../constants';

// --- UTILS: CALENDAR LINK GENERATOR ---
const generateCalendarLinks = (booking) => {
    const startTime = new Date(`${booking.date} ${booking.time}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Assume 1 hour if duration not parsed

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const details = {
        title: `${booking.serviceName} with ${booking.providerName}`,
        description: `Service: ${booking.serviceName}\nProvider: ${booking.providerName}\nLocation: ${booking.location}\nPrice: $${booking.price}`,
        location: booking.location,
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

// --- SUB-VIEWS ---

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
                    <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
                    >
                        <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm text-xl">
                            G
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">Google Calendar</span>
                    </a>

                    <a
                        href={outlookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
                    >
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center shadow-sm text-blue-600">
                            <Icons.Message size={20} />
                        </div>
                        <span className="font-bold text-gray-700 group-hover:text-gray-900">Outlook</span>
                    </a>

                    <button
                        onClick={downloadIcs}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-all group"
                    >
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

const CancelBookingView = ({ booking, onBack, onConfirm }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = () => {
        setIsProcessing(true);
        setTimeout(() => {
            onConfirm();
        }, 1000);
    };

    return (
        <div className="max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300 py-12">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.Alert size={40} strokeWidth={2} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Cancel Appointment?</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Are you sure you want to cancel your booking with <span className="font-bold text-gray-900">{booking.providerName}</span>?
                    <br /><span className="text-xs text-gray-400 mt-2 block">This action cannot be undone.</span>
                </p>

                <div className="bg-gray-50 p-4 rounded-xl mb-8 text-left flex gap-4 border border-gray-100">
                    <img src={booking.providerAvatar} alt={booking.providerName} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">{booking.serviceName}</h4>
                        <p className="text-xs text-gray-500">{booking.date} at {booking.time}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                    >
                        {isProcessing ? 'Cancelling...' : 'Yes, Cancel Booking'}
                    </button>
                    <button
                        onClick={onBack}
                        disabled={isProcessing}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        No, Keep it
                    </button>
                </div>
            </div>
        </div>
    );
};

const RescheduleBookingView = ({ booking, onBack, onConfirm }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleConfirm = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto text-center pt-12 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Icons.Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Rescheduled!</h2>
                <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                    Your appointment with <span className="font-semibold text-gray-900">{booking.providerName}</span> has been updated.
                </p>
                <button onClick={() => onConfirm(date, time)} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
                    Back to Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 py-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Reschedule Booking</h1>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">

                {/* Current Slot Info */}
                <div className="bg-brand-50 p-4 rounded-xl border border-brand-100 flex items-center justify-between">
                    <div>
                        <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">Current Time</span>
                        <span className="font-bold text-brand-900 flex items-center gap-2">
                            <Icons.Calendar size={16} /> {booking.date} • {booking.time}
                        </span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">New Date</label>
                    <div className="relative">
                        <Icons.Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">New Time</label>
                    <div className="relative">
                        <Icons.Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reason for change (Optional)</label>
                    <textarea
                        placeholder="Conflict with work schedule..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-24 resize-none text-gray-700"
                    />
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!date || !time || isProcessing}
                    className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
               ${!date || !time || isProcessing
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-gray-900 text-white hover:bg-brand-600 shadow-brand-200'}
            `}
                >
                    {isProcessing ? 'Updating...' : 'Confirm New Time'}
                </button>
            </div>
        </div>
    );
};

const MessageProviderView = ({ booking, onBack, onSend }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const quickTags = ["I'm running late", "Is the location correct?", "Rescheduling question", "Thanks!"];

    const handleSend = () => {
        setIsSending(true);
        setTimeout(() => {
            setIsSending(false);
            setIsSent(true);
        }, 1000);
    };

    if (isSent) {
        return (
            <div className="max-w-lg mx-auto text-center pt-20 animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Icons.Message size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent</h2>
                <p className="text-gray-500 mb-8">
                    {booking.providerName} will receive your message instantly.
                </p>
                <button onClick={onSend} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-300 py-6">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Message Provider</h1>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">

                {/* Recipient Info */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <img src={booking.providerAvatar} alt={booking.providerName} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{booking.providerName}</h3>
                        <p className="text-sm text-brand-600 font-medium">Regarding: {booking.serviceName}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Quick select</label>
                    <div className="flex flex-wrap gap-2">
                        {quickTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setMessage(tag)}
                                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-8">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-40 resize-none text-gray-700 placeholder-gray-400 text-base"
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={!message || isSending}
                    className={`w-full py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
               ${!message || isSending
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-200'}
            `}
                >
                    {isSending ? 'Sending...' : 'Send Message'} <Icons.Message size={18} />
                </button>
            </div>
        </div>
    );
};

const LeaveReviewView = ({ booking, onBack, onSuccess }) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = () => {
        if (rating === 0) return; // Validation
        setIsSubmitting(true);
        // Mock API call
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="max-w-xl mx-auto text-center pt-12 animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Icons.Check size={48} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Review Submitted!</h2>
                <p className="text-gray-500 mb-8 text-lg leading-relaxed">
                    Thanks for sharing your experience with <span className="font-semibold text-gray-900">{booking.providerName}</span>.<br />
                    Your feedback helps others make better choices.
                </p>
                <button onClick={onSuccess} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200">
                    Return to Bookings
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 py-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Write a Review</h1>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg">

                {/* Provider Info */}
                <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <img src={booking.providerAvatar} alt={booking.providerName} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{booking.providerName}</h3>
                        <p className="text-sm text-gray-500">{booking.serviceName} • {booking.date}</p>
                    </div>
                </div>

                {/* Rating Inputs */}
                <div className="mb-8 text-center">
                    <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Rate your experience</label>
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Icons.Star
                                    size={40}
                                    className={`transition-colors ${(hoverRating || rating) >= star
                                        ? 'text-yellow-400 fill-current'
                                        : 'text-gray-200'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-brand-600 mt-2 h-5 transition-all">
                        {hoverRating === 5 ? 'Amazing!' : hoverRating === 4 ? 'Good' : hoverRating === 3 ? 'Okay' : hoverRating === 2 ? 'Poor' : hoverRating === 1 ? 'Terrible' : ''}
                    </p>
                </div>

                {/* Review Text */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Your Review</label>
                    <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Share details of your own experience..."
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-40 resize-none text-gray-700 placeholder-gray-400"
                    />
                    <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-400 font-medium">Minimum 10 characters</span>
                        <span className="text-xs text-gray-400 font-medium">{reviewText.length}/500</span>
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-xl transition-all flex items-center justify-center gap-2
               ${rating === 0 || isSubmitting ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-gray-900 hover:bg-brand-600 shadow-gray-200 hover:shadow-brand-200'}
            `}
                >
                    {isSubmitting ? (
                        <>Submitting...</>
                    ) : (
                        <>Submit Review <Icons.ChevronRight size={18} /></>
                    )}
                </button>

            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---

const BookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState(CLIENT_BOOKINGS);
    const [activeFilter, setActiveFilter] = useState('UPCOMING');

    // View States
    const [reviewingBookingId, setReviewingBookingId] = useState(null);
    const [cancellingBookingId, setCancellingBookingId] = useState(null);
    const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
    const [messagingBookingId, setMessagingBookingId] = useState(null);
    const [calendarBookingId, setCalendarBookingId] = useState(null);

    const handleUpdateBooking = (updatedBooking) => {
        setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    };

    const filteredBookings = bookings.filter(booking => {
        if (activeFilter === 'UPCOMING') return booking.status === 'confirmed' || booking.status === 'pending';
        if (activeFilter === 'PAST') return booking.status === 'completed';
        if (activeFilter === 'CANCELLED') return booking.status === 'cancelled';
        return true;
    });

    // --- Render Logic for Sub-Views ---

    if (reviewingBookingId) {
        const booking = bookings.find(b => b.id === reviewingBookingId);
        if (booking) {
            return (
                <LeaveReviewView
                    booking={booking}
                    onBack={() => setReviewingBookingId(null)}
                    onSuccess={() => setReviewingBookingId(null)}
                />
            );
        }
    }

    if (cancellingBookingId) {
        const booking = bookings.find(b => b.id === cancellingBookingId);
        if (booking) {
            return (
                <CancelBookingView
                    booking={booking}
                    onBack={() => setCancellingBookingId(null)}
                    onConfirm={() => {
                        handleUpdateBooking({ ...booking, status: 'cancelled' });
                        setCancellingBookingId(null);
                    }}
                />
            );
        }
    }

    if (reschedulingBookingId) {
        const booking = bookings.find(b => b.id === reschedulingBookingId);
        if (booking) {
            return (
                <RescheduleBookingView
                    booking={booking}
                    onBack={() => setReschedulingBookingId(null)}
                    onConfirm={(newDate, newTime) => {
                        // Format date/time for mock
                        const formattedDate = new Date(newDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        handleUpdateBooking({ ...booking, date: formattedDate, time: newTime });
                        setReschedulingBookingId(null);
                    }}
                />
            );
        }
    }

    if (messagingBookingId) {
        const booking = bookings.find(b => b.id === messagingBookingId);
        if (booking) {
            return (
                <MessageProviderView
                    booking={booking}
                    onBack={() => setMessagingBookingId(null)}
                    onSend={() => setMessagingBookingId(null)}
                />
            );
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                    <p className="text-gray-500 text-sm">Manage your appointments and history</p>
                </div>
                <button
                    onClick={() => navigate('/app')}
                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-gray-200"
                >
                    + New Booking
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                {['UPCOMING', 'PAST', 'CANCELLED'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveFilter(tab)}
                        className={`px-6 py-3 text-sm font-bold transition-all relative ${activeFilter === tab
                            ? 'text-brand-600'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab.charAt(0) + tab.slice(1).toLowerCase()}
                        {activeFilter === tab && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-600 rounded-t-full"></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Bookings List */}
            <div className="space-y-4">
                {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex flex-col md:flex-row gap-6">

                                {/* Date Box */}
                                <div className="flex-shrink-0 flex md:flex-col items-center justify-center bg-gray-50 rounded-xl p-4 w-full md:w-24 border border-gray-100">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{booking.date.split(' ')[0]}</span>
                                    <span className="text-2xl font-bold text-gray-900">{booking.date.split(' ')[1].replace(',', '')}</span>
                                    <span className="text-xs font-medium text-gray-500 mt-1">{booking.time}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-bold text-gray-900">{booking.serviceName}</h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                booking.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                                                    'bg-red-50 text-red-500'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 mb-4">
                                        <img src={booking.providerAvatar} alt={booking.providerName} className="w-6 h-6 rounded-full object-cover" />
                                        <span className="text-sm text-gray-600 font-medium">with {booking.providerName}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-sm text-gray-500">{booking.location}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                                        {booking.status === 'confirmed' && (
                                            <>
                                                <button
                                                    onClick={() => setMessagingBookingId(booking.id)}
                                                    className="px-4 py-2 bg-brand-50 text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors"
                                                >
                                                    Message
                                                </button>
                                                <button
                                                    onClick={() => setReschedulingBookingId(booking.id)}
                                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                                                >
                                                    Reschedule
                                                </button>
                                                <button
                                                    onClick={() => setCalendarBookingId(booking.id)}
                                                    className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                                                >
                                                    Add to Calendar
                                                </button>
                                                <button
                                                    onClick={() => setCancellingBookingId(booking.id)}
                                                    className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors ml-auto"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}

                                        {booking.status === 'completed' && (
                                            <>
                                                <button
                                                    onClick={() => setReviewingBookingId(booking.id)}
                                                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-brand-600 transition-colors shadow-sm"
                                                >
                                                    Leave Review
                                                </button>
                                                <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors">
                                                    Book Again
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Calendar className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg">No {activeFilter.toLowerCase()} bookings</h3>
                        <p className="text-gray-500 mb-6">You don't have any appointments in this category.</p>
                        {activeFilter !== 'UPCOMING' && (
                            <button
                                onClick={() => setActiveFilter('UPCOMING')}
                                className="text-sm font-semibold text-brand-600 hover:underline"
                            >
                                View Upcoming
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Calendar Modal */}
            {calendarBookingId && (
                <CalendarExportModal
                    booking={bookings.find(b => b.id === calendarBookingId)}
                    onClose={() => setCalendarBookingId(null)}
                />
            )}

        </div>
    );
};

export default BookingsPage;
