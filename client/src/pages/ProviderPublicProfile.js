import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { TOP_PROVIDERS, PROVIDER_SERVICES, PROVIDER_PROMOTIONS } from '../constants';
import { useBookings } from '../contexts/BookingContext';

// --- MOCK CALENDAR DATA & UTILS ---
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Calendar Logic
const generateCalendarLinks = (serviceName, providerName, dateStr, location) => {
    const datePart = dateStr.split(',').slice(0, 2).join(','); // Oct 27, 2023
    const timePart = dateStr.split(',')[2]?.trim() || "10:00 AM";

    const startTime = new Date(`${datePart} ${timePart}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default

    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const details = {
        title: `${serviceName} with ${providerName}`,
        description: `Service: ${serviceName}\nProvider: ${providerName}\nLocation: ${location}`,
        location: location,
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


// --- BOOKING SUMMARY & CHECKOUT COMPONENT ---
const BookingSummaryView = ({ onBack, onSuccess, onBook, provider, service, timeLabel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState('');

    // Validate and apply promo code
    const handleApplyPromo = () => {
        setPromoError('');
        if (!promoCode.trim()) {
            setPromoError('Please enter a promo code');
            return;
        }

        // Find matching promo from PROVIDER_PROMOTIONS
        const matchedPromo = PROVIDER_PROMOTIONS.find(
            p => p.promoCode.toUpperCase() === promoCode.toUpperCase() && p.isActive
        );

        if (!matchedPromo) {
            setPromoError('Invalid or expired promo code');
            setAppliedPromo(null);
            return;
        }

        // Check if promo applies to this service
        if (matchedPromo.applicableServices[0] !== 'All Services' &&
            !matchedPromo.applicableServices.includes(service.title)) {
            setPromoError(`This code doesn't apply to ${service.title}`);
            setAppliedPromo(null);
            return;
        }

        setAppliedPromo(matchedPromo);
        setPromoCode('');
    };

    // Calculate Totals
    const subtotal = service.price;
    const bookingFee = 5.00;

    // Calculate discount
    let discountAmount = 0;
    if (appliedPromo) {
        discountAmount = appliedPromo.discountType === 'percentage'
            ? (subtotal * appliedPromo.discountValue) / 100
            : appliedPromo.discountValue;
    }

    const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
    const tax = subtotalAfterDiscount * 0.08; // 8% tax
    const total = subtotalAfterDiscount + bookingFee + tax;

    const handleConfirm = () => {
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setIsConfirmed(true);

            // Trigger the booking creation in App state
            if (onBook) {
                onBook({
                    serviceName: service.title,
                    providerName: provider.name,
                    providerAvatar: provider.avatarUrl,
                    providerId: provider.id,
                    date: timeLabel.split(',')[0], // Simple parsing mock
                    time: timeLabel.includes(',') ? timeLabel.split(',')[2].trim() : '10:00 AM',
                    price: total
                });
            }
        }, 2000);
    };

    const { googleUrl, outlookUrl, downloadIcs } = generateCalendarLinks(
        service.title,
        provider.name,
        timeLabel,
        "123 Main St, San Francisco"
    );

    if (isConfirmed) {
        return (
            <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-300 pt-8 pb-12 relative">
                <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden text-center p-10">
                    <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-in fade-in zoom-in duration-500 delay-100">
                        <Icons.Check size={48} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
                    <p className="text-gray-500 mb-8 text-lg">
                        You're all set for <span className="font-semibold text-gray-900">{timeLabel}</span>.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 max-w-md mx-auto border border-gray-100 text-left">
                        <div className="flex gap-4 mb-4 border-b border-gray-200 pb-4">
                            <img src={provider.avatarUrl} alt={provider.name} className="w-12 h-12 rounded-xl object-cover" />
                            <div>
                                <h4 className="font-bold text-gray-900">{service.title}</h4>
                                <p className="text-sm text-gray-500">with {provider.name}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Date & Time</span>
                                <span className="font-semibold text-gray-900">{timeLabel}</span>
                            </div>

                            <div className="flex justify-between pt-2">
                                <span className="text-gray-500">Total Paid</span>
                                <span className="font-bold text-brand-600">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 max-w-xs mx-auto">
                        <button onClick={onSuccess} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
                            Done
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowCalendarOptions(!showCalendarOptions)}
                                className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Icons.Calendar size={18} /> Add to Calendar
                            </button>

                            {/* Calendar Popover */}
                            {showCalendarOptions && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 z-10">
                                    <a
                                        href={googleUrl} target="_blank" rel="noreferrer"
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
                                    >
                                        Google Calendar
                                    </a>
                                    <a
                                        href={outlookUrl} target="_blank" rel="noreferrer"
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
                                    >
                                        Outlook
                                    </a>
                                    <button
                                        onClick={downloadIcs}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700"
                                    >
                                        Apple Calendar (iCal)
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className="text-sm font-bold text-gray-400 hover:text-gray-600 mt-2">
                            Download Receipt
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-12">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Review & Pay</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Col: Summary */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Service Detail Card */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Booking Details</h3>

                        <div className="flex flex-col md:flex-row gap-6 mb-6 pb-6 border-b border-gray-100">
                            <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 flex-shrink-0">
                                {service.priceUnit === 'fixed' ? <Icons.Tag size={32} /> : <Icons.Clock size={32} />}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-gray-900">{service.title}</h4>
                                <p className="text-gray-500 mb-2">{service.description}</p>
                                <div className="flex items-center gap-2 text-sm text-brand-600 font-medium bg-brand-50 w-fit px-3 py-1 rounded-lg">
                                    <Icons.Clock size={14} /> {service.duration} duration
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Provider</span>
                                <div className="flex items-center gap-3">
                                    <img src={provider.avatarUrl} alt={provider.name} className="w-8 h-8 rounded-full object-cover" />
                                    <span className="font-bold text-gray-900">{provider.name}</span>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date & Time</span>
                                <div className="flex items-center gap-2 font-bold text-gray-900">
                                    <Icons.Calendar size={16} className="text-gray-500" />
                                    {timeLabel}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                        <Icons.Shield className="text-blue-600 flex-shrink-0" size={24} />
                        <div>
                            <h4 className="font-bold text-blue-900 mb-1">Free Cancellation</h4>
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Cancel up to 24 hours before your appointment for a full refund. Cancellations made within 24 hours may be subject to a $20 fee.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Right Col: Payment & Confirmation */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-lg sticky top-24">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h3>

                    {/* Price Breakdown */}
                    <div className="space-y-3 mb-6 pb-6 border-b border-gray-100">
                        <div className="flex justify-between text-gray-600">
                            <span>{service.title} {service.priceUnit === 'hour' ? '(1 hr base)' : ''}</span>
                            <span className="font-medium">${subtotal.toFixed(2)}</span>
                        </div>
                        {appliedPromo && (
                            <div className="flex justify-between text-green-600 font-medium">
                                <span>
                                    Promo ({appliedPromo.promoCode}):
                                    {appliedPromo.discountType === 'percentage' ? ` -${appliedPromo.discountValue}%` : ` -$${appliedPromo.discountValue}`}
                                </span>
                                <span>-${discountAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                            <span>Booking Fee</span>
                            <span className="font-medium">${bookingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Estimated Tax</span>
                            <span className="font-medium">${tax.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-6">
                        <span className="font-bold text-gray-900 text-lg">Total</span>
                        <span className="font-bold text-gray-900 text-3xl">${total.toFixed(2)}</span>
                    </div>

                    {/* Promo Code Input */}
                    {!appliedPromo && (
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Have a Promo Code?</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => {
                                        setPromoCode(e.target.value.toUpperCase());
                                        setPromoError('');
                                    }}
                                    onKeyPress={(e) => e.key === 'Enter' && handleApplyPromo()}
                                    placeholder="Enter code"
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300"
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    className="px-4 py-2.5 bg-brand-600 text-white rounded-lg font-bold text-sm hover:bg-brand-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                            {promoError && (
                                <p className="text-red-600 text-xs font-medium mt-2">{promoError}</p>
                            )}
                        </div>
                    )}

                    {appliedPromo && (
                        <div className="mb-6 pb-6 border-b border-gray-100 bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase">Applied Promo</p>
                                    <p className="text-sm font-bold text-gray-900">{appliedPromo.promoCode}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setAppliedPromo(null);
                                        setPromoError('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <Icons.X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Method Selection (Mock) */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Payment Method</label>
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-gray-50 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-6 bg-gray-800 rounded text-white flex items-center justify-center text-[8px] font-bold tracking-widest">VISA</div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">•••• 4242</p>
                                    <p className="text-xs text-gray-400 group-hover:text-gray-500">Expires 12/24</p>
                                </div>
                            </div>
                            <button className="text-brand-600 text-xs font-bold hover:underline">Change</button>
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing}
                        className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-xl transition-all flex items-center justify-center gap-2
                  ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-600 hover:bg-brand-700 shadow-brand-200'}
               `}
                    >
                        {isProcessing ? (
                            <>Processing...</>
                        ) : (
                            <>Confirm & Pay <Icons.ArrowLeft className="rotate-180" size={20} /></>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        By confirming, you agree to Kliques's <a href="#" className="underline hover:text-gray-600">Terms of Service</a>.
                    </p>

                </div>

            </div>
        </div>
    );
};

// --- REQUEST TIME COMPONENT ---
const RequestTimeView = ({ onBack, providerName }) => {
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center animate-in zoom-in-95 mt-12">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <Icons.Check size={40} strokeWidth={3} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Request Sent!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    We've notified <span className="font-semibold text-gray-900">{providerName}</span> about your request.
                    <br />They typically respond within 1 hour.
                </p>
                <button onClick={onBack} className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-gray-200">
                    Back to Profile
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-300 pb-12">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Request a Time</h1>
                    <p className="text-gray-500 text-sm">Ask <span className="font-semibold text-brand-600">{providerName}</span> for a specific slot.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Date</label>
                    <div className="relative">
                        <Icons.Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input type="date" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Preferred Time</label>
                    <div className="relative">
                        <Icons.Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input type="time" className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all text-gray-700 font-medium" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Note (Optional)</label>
                    <textarea
                        placeholder={`Hi ${providerName.split(' ')[0]}, I need a service for...`}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all h-32 resize-none text-gray-700"
                    />
                </div>

                <button
                    onClick={() => setSubmitted(true)}
                    className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-200 hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
                >
                    Send Request <Icons.Message size={18} />
                </button>

                <p className="text-xs text-center text-gray-400 mt-4">
                    The provider will review your request and confirm availability.
                </p>
            </div>
        </div>
    );
}

// --- CALENDAR COMPONENT ---
const CalendarView = ({ onBack, onSelectSlot, onRequestTime, providerName }) => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();

        const daysArray = Array(firstDay).fill(null);
        for (let i = 1; i <= days; i++) {
            daysArray.push(new Date(year, month, i));
        }
        return daysArray;
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const isSameDay = (d1, d2) => {
        if (!d1 || !d2) return false;
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (date) => {
        const today = new Date();
        return isSameDay(date, today);
    };

    const isPast = (date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const getSlots = (date) => {
        if (!date) return [];
        // Mock logic: Weekends have different slots than weekdays
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;

        if (isWeekend) {
            return ['10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM'];
        }
        return ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
    };

    const slots = selectedDate ? getSlots(selectedDate) : [];
    const days = getDaysInMonth(viewDate);
    const monthName = viewDate.toLocaleString('default', { month: 'long' });
    const year = viewDate.getFullYear();

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            onSelectSlot(`${dateStr}, ${selectedTime}`);
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors bg-white border border-gray-200 shadow-sm">
                    <Icons.ArrowLeft size={20} className="text-gray-700" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Select Date & Time</h1>
                    <p className="text-gray-500 text-sm">Viewing availability for <span className="font-semibold text-brand-600">{providerName}</span></p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Calendar Side */}
                <div className="flex-1 w-full bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                    {/* Month Nav */}
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900">{monthName} {year}</h3>
                        <div className="flex gap-2">
                            <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 border border-gray-100 hover:border-gray-200 transition-all"><Icons.ChevronRight className="rotate-180" size={20} /></button>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 border border-gray-100 hover:border-gray-200 transition-all"><Icons.ChevronRight size={20} /></button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-2 tracking-wider">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                        {days.map((date, i) => {
                            if (!date) return <div key={`empty-${i}`} className="h-10 md:h-16"></div>;

                            const isSelected = isSameDay(selectedDate, date);
                            const disabled = isPast(date);
                            const isTodayDate = isToday(date);

                            return (
                                <button
                                    key={i}
                                    disabled={disabled}
                                    onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                                    className={`
                         h-10 md:h-16 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-sm font-medium transition-all relative group
                         ${isSelected ? 'bg-brand-600 text-white shadow-md shadow-brand-200 scale-105 z-10' : 'bg-gray-50 text-gray-700 hover:bg-white hover:shadow-md hover:border-gray-100 border border-transparent'}
                         ${disabled ? 'opacity-30 cursor-not-allowed hover:bg-gray-50 hover:shadow-none' : ''}
                         ${isTodayDate && !isSelected ? 'border-brand-200 bg-brand-50 text-brand-700' : ''}
                       `}
                                >
                                    <span className={`text-base md:text-lg ${isSelected ? 'font-bold' : 'font-semibold'}`}>{date.getDate()}</span>
                                    {!disabled && !isSelected && (
                                        <div className="w-1 h-1 rounded-full bg-brand-400 mt-1"></div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-100 flex gap-6 justify-center text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-brand-600"></div>
                            <span className="text-gray-600">Selected</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200"></div>
                            <span className="text-gray-600">Available</span>
                        </div>
                    </div>
                </div>

                {/* Slots Side */}
                <div className="w-full lg:w-96 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-auto lg:h-[600px]">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-900">Available Times</h3>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Icons.Calendar size={16} className="text-brand-500" />
                            {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a date'}
                        </p>
                    </div>

                    {selectedDate ? (
                        slots.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 overflow-y-auto custom-scrollbar pr-2 -mr-2 pb-4">
                                {slots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => setSelectedTime(slot)}
                                        className={`py-3 md:py-4 px-3 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${selectedTime === slot
                                            ? 'border-brand-500 bg-brand-600 text-white shadow-lg shadow-brand-200'
                                            : 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'
                                            }`}
                                    >
                                        {selectedTime === slot && <Icons.Check size={16} />}
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-12">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                    <Icons.Clock size={32} className="opacity-40" />
                                </div>
                                <p className="font-medium text-gray-600">No slots available.</p>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-12">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Icons.Calendar size={32} className="opacity-40" />
                            </div>
                            <p className="font-medium text-gray-600">Please select a date to view times.</p>
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-gray-100 space-y-4">
                        <button
                            disabled={!selectedTime}
                            onClick={handleConfirm}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-600 transition-all shadow-xl shadow-gray-200 hover:shadow-brand-200 flex items-center justify-center gap-2"
                        >
                            Confirm Time
                            <Icons.ArrowLeft className="rotate-180" size={20} />
                        </button>

                        <div className="text-center">
                            <button onClick={onRequestTime} className="text-sm font-bold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                                Request a specific time
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



// ... (imports)

// --- MAIN COMPONENT ---
const ProviderPublicProfile = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { addBooking } = useBookings(); // Use context
    const [viewMode, setViewMode] = useState('PROFILE');
    const [selectedService, setSelectedService] = useState(null);
    const [selectedTimeLabel, setSelectedTimeLabel] = useState(null);

    const provider = TOP_PROVIDERS.find(p => p.id === providerId) || TOP_PROVIDERS[0];
    const firstName = provider.name.split(' ')[0];

    const availableServices = PROVIDER_SERVICES.filter(service =>
        service.active && provider.categories.includes(service.category)
    );

    const displayServices = availableServices.length > 0 ? availableServices : [
        { id: 'default', title: `Standard ${provider.categories[0]} Service`, price: provider.hourlyRate, priceUnit: 'hour', duration: '1h', description: 'Standard service booking', category: provider.categories[0], active: true, bookingsCount: 0 }
    ];

    if (!selectedService && displayServices.length > 0) {
        setSelectedService(displayServices[0].id);
    }

    const selectedServiceData = displayServices.find(s => s.id === selectedService);

    const EXTENDED_DATA = {
        bio: `Hi, I'm ${firstName}! I have over 7 years of experience in the industry. I pride myself on punctuality, attention to detail, and leaving every client with a smile. I am fully insured and bring my own professional-grade supplies.`,
        responseRate: '100%',
        responseTime: 'within 1 hour',
        jobsCompleted: 342,
        repeatHires: '95%',
        portfolio: [
            'https://picsum.photos/seed/work1/400/300',
            'https://picsum.photos/seed/work2/400/300',
            'https://picsum.photos/seed/work3/400/300',
            'https://picsum.photos/seed/work4/400/300',
        ],
        reviews: [
            { id: 1, user: 'Alice M.', rating: 5, date: '2 days ago', text: 'Absolutely amazing service! Arrived early and did a thorough job.' },
            { id: 2, user: 'John D.', rating: 5, date: '1 week ago', text: 'Very professional and polite. Will definitely book again.' },
        ],
        availability: [
            { id: 'slot1', label: 'Tomorrow, 10:00 AM' },
            { id: 'slot2', label: 'Tomorrow, 2:00 PM' },
        ]
    };

    const handleCalendarSelection = (timeLabel) => {
        setSelectedTimeLabel(timeLabel);
        setViewMode('BOOKING_SUMMARY');
    };

    const handleBookClick = () => {
        if (selectedTimeLabel) {
            setViewMode('BOOKING_SUMMARY');
        } else {
            setViewMode('CALENDAR');
        }
    };

    const onBack = () => {
        navigate(-1);
    };

    const onBook = (data) => {
        // Add booking to context
        addBooking({
            ...data,
            location: '123 Main St, San Francisco, CA', // Mock location for now
            status: 'confirmed'
        });
        navigate('/app/bookings');
    };

    if (viewMode === 'CALENDAR') {
        return (
            <CalendarView
                onBack={() => setViewMode('PROFILE')}
                onSelectSlot={handleCalendarSelection}
                onRequestTime={() => setViewMode('REQUEST_TIME')}
                providerName={provider.name}
            />
        );
    }

    if (viewMode === 'REQUEST_TIME') {
        return (
            <RequestTimeView
                onBack={() => setViewMode('CALENDAR')}
                providerName={provider.name}
            />
        );
    }

    if (viewMode === 'BOOKING_SUMMARY' && selectedServiceData && selectedTimeLabel) {
        return (
            <BookingSummaryView
                provider={provider}
                service={selectedServiceData}
                timeLabel={selectedTimeLabel}
                onBack={() => setViewMode('PROFILE')}
                onSuccess={() => onBook()}
                onBook={onBook}
            />
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-12">

            {/* Navigation Header */}
            <button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors font-medium"
            >
                <Icons.ArrowLeft size={20} />
                Back to search
            </button>

            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100 mb-8">
                <div className="h-48 md:h-64 bg-gradient-to-r from-gray-800 to-gray-900 relative">
                    <img
                        src={`https://picsum.photos/seed/${provider.id}-cover/1200/400`}
                        alt="Cover"
                        className="w-full h-full object-cover opacity-40"
                    />
                </div>

                <div className="px-4 md:px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 md:-mt-12 mb-2">
                        <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-full md:w-auto">
                            <img
                                src={provider.avatarUrl}
                                alt={provider.name}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-gray-100 mx-auto md:mx-0"
                            />
                            <div className="mb-1 text-center md:text-left">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center justify-center md:justify-start gap-2">
                                    {provider.name}
                                    <Icons.Check size={24} className="text-brand-500 fill-current" />
                                </h1>
                                <p className="text-base md:text-lg text-gray-600 font-medium">{provider.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-6 mt-4 md:mt-0 bg-gray-50 px-4 md:px-6 py-3 rounded-2xl border border-gray-100 w-full md:w-auto justify-between md:justify-start">
                            <div className="text-center flex-1 md:flex-none">
                                <div className="flex items-center gap-1 justify-center text-gray-900 font-bold text-xl">
                                    4.9 <Icons.Star size={16} className="text-yellow-400 fill-current" />
                                </div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Rating</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-center flex-1 md:flex-none">
                                <div className="text-gray-900 font-bold text-xl">{EXTENDED_DATA.jobsCompleted}</div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Jobs</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="text-center flex-1 md:flex-none">
                                <div className="text-gray-900 font-bold text-xl">{EXTENDED_DATA.repeatHires}</div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wide">Repeat</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 md:gap-3 mt-6 md:mt-4 justify-center md:justify-start">
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                            <Icons.MapPin size={16} /> {provider.location}
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                            <Icons.Shield size={16} /> Verified
                        </div>
                        {provider.categories.map(cat => (
                            <div key={cat} className="text-xs md:text-sm text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg font-medium border border-brand-100">
                                {cat}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6 md:space-y-8">

                    {/* About */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About Me</h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                            {EXTENDED_DATA.bio}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                    <Icons.Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Response Time</p>
                                    <p className="text-sm font-bold text-gray-900">{EXTENDED_DATA.responseTime}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <Icons.Check size={20} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Reliability</p>
                                    <p className="text-sm font-bold text-gray-900">{EXTENDED_DATA.responseRate} Response Rate</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Promotions */}
                    {PROVIDER_PROMOTIONS.filter(p => p.isActive).length > 0 && (
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                    <Icons.Tag size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Active Promotions</h2>
                                    <p className="text-sm text-gray-500">Limited time offers from {provider.name.split(' ')[0]}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {PROVIDER_PROMOTIONS.filter(p => p.isActive).map((promo) => {
                                    const expiryDate = new Date(promo.expiresOn);
                                    const today = new Date();
                                    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                                    const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

                                    return (
                                        <div key={promo.id} className="relative overflow-hidden bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="font-bold text-gray-900">{promo.title}</h3>
                                                        {isExpiringSoon && (
                                                            <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded animate-pulse">
                                                                ENDING SOON
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-3">{promo.description}</p>

                                                    <div className="flex flex-wrap items-center gap-4">
                                                        <div className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                                                            <p className="text-xs text-gray-500 font-semibold">Code</p>
                                                            <p className="text-lg font-bold text-gray-900 font-mono">{promo.promoCode}</p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-gray-500 font-semibold">Discount</p>
                                                            <p className="text-lg font-bold text-red-600">
                                                                {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`} OFF
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <p className="text-xs text-gray-500 font-semibold">Expires</p>
                                                            <p className="text-sm font-bold text-gray-900">{new Date(promo.expiresOn).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="text-right flex-shrink-0">
                                                    <div className="bg-red-500 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-sm">
                                                        {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `$${promo.discountValue}`}
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2 font-semibold">{promo.usageCount} used</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Services</h2>
                        <div className="space-y-4">
                            {displayServices.map((service) => (
                                <div key={service.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-brand-200 transition-colors cursor-pointer" onClick={() => { setSelectedService(service.id); setViewMode('CALENDAR'); }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900">{service.title}</h3>
                                        <div className="text-right">
                                            <span className="block font-bold text-brand-600">${service.price}</span>
                                            <span className="text-xs text-gray-500">{service.duration}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                        {service.description || "Professional service delivered with care and attention to detail."}
                                    </p>
                                    <button className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                                        Book Now <Icons.ChevronRight size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Portfolio */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Work Portfolio</h2>
                            <button className="text-brand-600 text-sm font-bold hover:underline">View All</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {EXTENDED_DATA.portfolio.map((img, i) => (
                                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group cursor-pointer">
                                    <img src={img} alt="Portfolio" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Client Reviews</h2>
                            <div className="flex items-center gap-1">
                                <span className="text-2xl font-bold text-gray-900">{provider.rating}</span>
                                <div className="flex text-yellow-400">
                                    {[1, 2, 3, 4, 5].map(s => <Icons.Star key={s} size={14} fill="currentColor" />)}
                                </div>
                                <span className="text-gray-400 text-sm ml-2">({provider.reviewCount})</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {EXTENDED_DATA.reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold text-sm">
                                                {review.user.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{review.user}</h4>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <div className="flex text-yellow-400">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Icons.Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                                        ))}
                                                    </div>
                                                    <span>• {review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed pl-[52px]">
                                        "{review.text}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Booking Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg sticky top-24">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">${provider.hourlyRate}</h3>
                                <p className="text-gray-500 text-sm">per hour</p>
                            </div>
                        </div>

                        {/* Service Selection */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Service</label>
                            <div className="space-y-2">
                                {displayServices.map(s => (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedService(s.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedService === s.id
                                            ? 'border-brand-500 bg-brand-50'
                                            : 'border-gray-200 hover:border-brand-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold text-sm ${selectedService === s.id ? 'text-brand-900' : 'text-gray-700'}`}>{s.title}</span>
                                            <span className="font-bold text-gray-900">${s.price}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{s.duration}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Date Selection Preview */}
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Availability</label>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                {selectedTimeLabel ? (
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg shadow-sm text-brand-600">
                                            <Icons.Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{selectedTimeLabel}</p>
                                            <button onClick={() => setViewMode('CALENDAR')} className="text-xs text-brand-600 font-bold hover:underline">Change</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setViewMode('CALENDAR')}
                                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Icons.Calendar size={16} /> Select Date & Time
                                    </button>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={handleBookClick}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                        >
                            {selectedTimeLabel ? 'Book Appointment' : 'Check Availability'}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
                            <Icons.Shield size={12} /> Satisfaction Guaranteed
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProviderPublicProfile;
