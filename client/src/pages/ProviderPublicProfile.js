import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useBookings } from '../contexts/BookingContext';
import { fetchProviders } from '../data/providers';
import { request } from '../data/apiClient';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const generateCalendarLinks = (serviceName, providerName, dateStr, location) => {
    const datePart = dateStr.split(',').slice(0, 2).join(',');
    const timePart = dateStr.split(',')[2]?.trim() || "10:00 AM";
    const startTime = new Date(`${datePart} ${timePart}`);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
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

const BookingSummaryView = ({ onBack, onSuccess, onBook, provider, service, timeLabel }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [showCalendarOptions, setShowCalendarOptions] = useState(false);

    const subtotal = service.price || 0;
    const bookingFee = 5.00;
    const tax = subtotal * 0.08;
    const total = subtotal + bookingFee + tax;

    const handleConfirm = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsConfirmed(true);
            onBook?.({
                serviceName: service.title,
                providerName: provider.name,
                providerAvatar: provider.avatar,
                providerId: provider.id,
                date: timeLabel.split(',')[0],
                time: timeLabel.includes(',') ? timeLabel.split(',')[2].trim() : '10:00 AM',
                price: total
            });
        }, 800);
    };

    const { googleUrl, outlookUrl, downloadIcs } = generateCalendarLinks(
        service.title,
        provider.name,
        timeLabel,
        "123 Main St"
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
                            <img src={provider.avatar} alt={provider.name} className="w-12 h-12 rounded-xl object-cover" />
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

                            {showCalendarOptions && (
                                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-100 p-2 animate-in slide-in-from-bottom-2 fade-in zoom-in-95 z-10">
                                    <a href={googleUrl} target="_blank" rel="noreferrer" className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                                        Google Calendar
                                    </a>
                                    <a href={outlookUrl} target="_blank" rel="noreferrer" className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                                        Outlook
                                    </a>
                                    <button onClick={downloadIcs} className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                                        Download .ics
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                        <Icons.ArrowLeft size={16} /> Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900 mt-4">Review and Confirm</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4">
                        <img src={provider.avatar} alt={provider.name} className="w-16 h-16 rounded-2xl object-cover" />
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{service.title}</h3>
                            <p className="text-sm text-gray-500">with {provider.name}</p>
                            <p className="text-sm text-gray-500 mt-2">{timeLabel}</p>
                            <p className="text-sm text-gray-500">{provider.location || "Toronto, ON"}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Service</span>
                            <span className="font-semibold text-gray-900">${service.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Booking Fee</span>
                            <span className="font-semibold text-gray-900">${bookingFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleConfirm}
                            disabled={isProcessing}
                            className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg disabled:opacity-60"
                        >
                            {isProcessing ? "Processing..." : "Confirm Booking"}
                        </button>
                        <button
                            onClick={onBack}
                            className="px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProviderPublicProfile = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { addBooking } = useBookings();
    const [provider, setProvider] = useState(null);
    const [services, setServices] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [activeTab, setActiveTab] = useState('PROFILE');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const provData = await fetchProviders();
                const found = provData.find((p) => p.id === providerId) || provData[0];
                if (!found) return;
                const svcResp = await request("/services");
                const promosResp = await request("/provider/promotions");
                if (!cancelled) {
                    setProvider(found);
                    setServices(svcResp.services || []);
                    setPromotions(promosResp.promotions || []);
                    setSelectedService((svcResp.services || [])[0]);
                }
            } catch (error) {
                console.error("Failed to load provider profile", error);
            }
        }
        load();
        return () => { cancelled = true; };
    }, [providerId]);

    if (!provider) {
        return <div className="p-6 text-center text-gray-500">Loading provider...</div>;
    }

    const availableTimeSlots = [
        "Mon, Oct 30, 2023, 10:00 AM",
        "Mon, Oct 30, 2023, 2:00 PM",
        "Tue, Oct 31, 2023, 11:30 AM",
        "Wed, Nov 1, 2023, 9:00 AM",
    ];

    const bookService = async () => {
        if (!selectedService || !selectedTime) return;
        const booking = await addBooking({
            serviceId: selectedService.id,
            providerId: provider.id,
            scheduledAt: new Date(selectedTime).toISOString(),
            location: provider.location || "",
            notes: "",
            status: "upcoming",
            price: selectedService.price || 0,
        });
        navigate("/app/bookings");
        return booking;
    };

    const renderPromos = () => {
        const activePromos = promotions.filter((p) => p.is_active);
        if (activePromos.length === 0) return null;
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900">Active promotions</h3>
                {activePromos.map((promo) => (
                    <div key={promo.id} className="flex items-center justify-between bg-brand-50 border border-brand-100 rounded-xl p-3">
                        <div>
                            <p className="font-bold text-brand-700">{promo.promo_code}</p>
                            <p className="text-sm text-gray-600">
                                {promo.discount_type === 'percentage'
                                    ? `${promo.discount_value}% off`
                                    : `$${promo.discount_value} off`}
                            </p>
                        </div>
                        <div className="text-xs text-gray-500">
                            {promo.start_at ? new Date(promo.start_at).toLocaleDateString() : ''} - {promo.end_at ? new Date(promo.end_at).toLocaleDateString() : 'Open'}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-4">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex flex-col md:flex-row gap-6">
                <img src={provider.avatar || provider.avatar_url || provider.avatarUrl} alt={provider.name} className="w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-4 border-white shadow-lg" />
                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                            Verified
                        </span>
                    </div>
                    <p className="text-gray-600">{provider.headline || "Trusted local provider"}</p>
                    <div className="flex items-center gap-3 text-gray-600">
                        <span className="flex items-center gap-1"><Icons.Star size={16} className="text-yellow-400 fill-current" /> {provider.rating || '4.8'} ({provider.review_count || 0} reviews)</span>
                        <span className="flex items-center gap-1"><Icons.MapPin size={16} /> {provider.location || "Toronto, ON"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(provider.categories || []).map((cat) => (
                            <span key={cat} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex gap-3 mb-6">
                    {["PROFILE", "SERVICES", "PORTFOLIO"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border ${activeTab === tab ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-white text-gray-600 border-gray-200'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {activeTab === "PROFILE" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Experience</p>
                                <p className="text-sm text-gray-800 mt-1">5+ years</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Rate</p>
                                <p className="text-sm text-gray-800 mt-1">${provider.hourly_rate || provider.hourlyRate || 0}/hr</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <p className="text-xs font-semibold text-gray-500 uppercase">Location</p>
                                <p className="text-sm text-gray-800 mt-1">{provider.location || "Toronto, ON"}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
                            <p className="text-gray-600">
                                {provider.bio || "Professional provider ready to help with your next project."}
                            </p>
                        </div>

                        {renderPromos()}
                    </div>
                )}

                {activeTab === "SERVICES" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {services.map((service) => (
                            <div key={service.id} className={`p-5 rounded-2xl border ${selectedService?.id === service.id ? 'border-brand-200 bg-brand-50/40' : 'border-gray-100 bg-white'} shadow-sm`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900">{service.name || service.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                                    </div>
                                    <span className="text-lg font-bold text-gray-900">
                                        ${service.base_price || service.price}<span className="text-sm text-gray-500">/{service.unit || 'visit'}</span>
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Icons.Clock size={14} /> {service.duration || 60} mins
                                    </div>
                                    <button
                                        onClick={() => setSelectedService(service)}
                                        className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                                    >
                                        Select
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "PORTFOLIO" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-gray-100 rounded-2xl h-40 flex items-center justify-center text-gray-400 text-sm">
                            Portfolio not set up yet.
                        </div>
                    </div>
                )}
            </div>

            {selectedService && (
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-500">Selected service</p>
                            <h3 className="text-lg font-bold text-gray-900">{selectedService.name || selectedService.title}</h3>
                            <p className="text-gray-500 text-sm">${selectedService.base_price || selectedService.price}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {["Mon, Oct 30, 2023, 10:00 AM", "Mon, Oct 30, 2023, 2:00 PM", "Tue, Oct 31, 2023, 11:30 AM"].map((slot) => (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className={`px-3 py-2 rounded-xl text-sm font-bold border ${selectedTime === slot ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-gray-700 border-gray-200'}`}
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setSelectedTime(availableTimeSlots[0])}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                        >
                            Pick another time
                        </button>
                    </div>

                    {selectedTime && (
                        <div className="mt-6">
                            <BookingSummaryView
                                onBack={() => setSelectedTime('')}
                                onSuccess={() => setSelectedTime('')}
                                onBook={bookService}
                                provider={provider}
                                service={selectedService}
                                timeLabel={selectedTime}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProviderPublicProfile;
