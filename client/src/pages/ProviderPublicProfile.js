import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { fetchProviders } from '../data/providers';
import { useSession } from '../auth/authContext';
import { request } from '../data/apiClient';

const formatReviewDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ProviderPublicProfile = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [closestAvailability, setClosestAvailability] = useState([]);
    const [allAvailability, setAllAvailability] = useState([]);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showTimeRequestModal, setShowTimeRequestModal] = useState(false);
    const [timeRequestForm, setTimeRequestForm] = useState({
        requestedDate: '',
        requestedTime: '',
        notes: ''
    });
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [providerStats, setProviderStats] = useState(null);
    const [providerServices, setProviderServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);

    // Fallback service options (used when no real services exist)
    const fallbackServices = [
        {
            id: 'fallback-1',
            name: 'Standard Service',
            price: 5000,
            description: 'Contact the provider for service details and pricing.'
        }
    ];

    // Generate calendar dates (next 7 days)
    const generateCalendarDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const calendarDates = generateCalendarDates();

    useEffect(() => {
        loadProvider();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [providerId]);

    useEffect(() => {
        if (provider?.id) {
            loadClosestAvailability();
            loadPortfolio();
            loadPromotions();
            loadProviderServices();
            loadReviews();
            loadStats();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider]);

    const loadProviderServices = async () => {
        if (!provider?.id) return;
        setLoadingServices(true);
        try {
            const data = await request(`/provider/${provider.id}/services`);
            const services = data.services || [];
            setProviderServices(services);
            // Auto-select first service if available
            if (services.length > 0 && !selectedService) {
                setSelectedService(services[0]);
            }
        } catch (error) {
            console.error('[services] Failed to load provider services:', error);
            setProviderServices([]);
        } finally {
            setLoadingServices(false);
        }
    };

    const loadPortfolio = async () => {
        if (!provider?.id) return;
        try {
            const data = await request(`/provider/${provider.id}/portfolio`);
            setPortfolioItems(data.media || []);
        } catch (error) {
            console.error('[portfolio] Failed to load portfolio:', error);
            setPortfolioItems([]);
        }
    };

    const loadPromotions = async () => {
        if (!provider?.id) return;
        try {
            const data = await request(`/provider/${provider.id}/promotions`);
            setPromotions(data.promotions || []);
        } catch (error) {
            console.error('[promotions] Failed to load promotions:', error);
            setPromotions([]);
        }
    };

    const loadReviews = async () => {
        if (!provider?.id) return;
        try {
            const data = await request(`/provider/${provider.id}/reviews`);
            setReviews(data.reviews || []);
        } catch (error) {
            console.error('[reviews] Failed to load reviews:', error);
            setReviews([]);
        }
    };

    const loadStats = async () => {
        if (!provider?.id) return;
        try {
            const data = await request(`/provider/${provider.id}/stats`);
            setProviderStats(data.stats || null);
        } catch (error) {
            console.error('[stats] Failed to load stats:', error);
        }
    };

    const loadProvider = async () => {
        setLoading(true);
        try {
            // If viewing own profile (preview mode), use session profile data
            if (session?.user?.id === providerId && session?.user?.role === 'provider' && profile) {
                setProvider({
                    id: profile.id || session.user.id,
                    name: profile.name || profile.fullName || 'Provider',
                    avatar: profile.avatar || profile.profilePhoto,
                    headline: profile.headline || profile.bio,
                    location: profile.city || profile.location,
                    bio: profile.bio,
                });
                // Don't set selectedService here - let loadProviderServices handle it
            } else {
                // Otherwise, fetch from API
                console.log('[ProviderPublicProfile] Fetching providers, looking for ID:', providerId);
                const providers = await fetchProviders();
                console.log('[ProviderPublicProfile] Fetched providers:', providers);
                console.log('[ProviderPublicProfile] Provider IDs:', providers.map(p => p.id));
                const found = providers.find((p) => p.id === providerId);
                console.log('[ProviderPublicProfile] Found provider:', found);
                if (found) {
                    setProvider(found);
                    // Don't set selectedService here - let loadProviderServices handle it
                } else {
                    console.error('[ProviderPublicProfile] Provider not found. Looking for:', providerId);
                    setProvider(null);
                }
            }
        } catch (error) {
            console.error('Failed to load provider:', error);
            setProvider(null);
        } finally {
            setLoading(false);
        }
    };

    const loadClosestAvailability = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE || '/api'}/provider/${provider.id}/availability/closest`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setClosestAvailability(data.availability || []);
            }
        } catch (error) {
            console.error('Failed to load availability:', error);
            setClosestAvailability([]);
        }
    };

    const handleRequestTime = async () => {
        if (!timeRequestForm.requestedDate || !timeRequestForm.requestedTime) {
            alert('Please select both date and time for your request');
            return;
        }

        if (!session?.user?.id) {
            alert('Please sign in to request an appointment');
            return;
        }

        setSubmittingRequest(true);
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE || '/api'}/time-requests`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        clientId: session.user.id,
                        clientName: session.user.user_metadata?.full_name || profile?.name,
                        clientEmail: session.user.email,
                        providerId: provider.id,
                        requestedDate: timeRequestForm.requestedDate,
                        requestedTime: timeRequestForm.requestedTime,
                        serviceId: selectedService?.id,
                        serviceName: selectedService?.name,
                        notes: timeRequestForm.notes
                    })
                }
            );

            if (response.ok) {
                alert('Your time request has been sent! The provider will review and respond soon.');
                setShowTimeRequestModal(false);
                setTimeRequestForm({ requestedDate: '', requestedTime: '', notes: '' });
            } else {
                const error = await response.json();
                alert(`Failed to send request: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to submit time request:', error);
            alert('Failed to send time request. Please try again.');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const formatAvailabilityDate = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatAvailabilityTime = (datetime) => {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const loadAllAvailability = async () => {
        setLoadingAvailability(true);
        try {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30); // Next 30 days

            const response = await fetch(
                `${process.env.REACT_APP_API_BASE || '/api'}/provider/${provider.id}/availability?limit=100&endDate=${endDate.toISOString().split('T')[0]}`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setAllAvailability(data.availability || []);
            }
        } catch (error) {
            console.error('Failed to load availability:', error);
            setAllAvailability([]);
        } finally {
            setLoadingAvailability(false);
        }
    };

    const handleCheckAvailability = () => {
        if (!selectedService) {
            alert('Please select a service first');
            return;
        }
        loadAllAvailability();
        setShowCalendarModal(true);
    };

    const handleSelectAvailableSlot = (slot) => {
        // Navigate to booking flow with selected slot
        navigate('/app/booking-flow', {
            state: {
                providerId: provider?.id,
                providerName: provider?.name,
                service: selectedService,
                selectedDate: new Date(slot.datetime),
                selectedTime: slot.time_slot,
                slotId: slot.id
            }
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading provider profile...</p>
                </div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Provider not found</p>
                    <button
                        onClick={() => navigate('/app/browse')}
                        className="mt-4 text-orange-600 font-semibold hover:text-orange-700"
                    >
                        Back to Browse
                    </button>
                </div>
            </div>
        );
    }

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <Icons.Star
                key={index}
                size={16}
                className={index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
            />
        ));
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Back Button */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold"
                >
                    <Icons.ArrowLeft size={20} />
                    Back
                </button>
            </div>

            {/* Cover Photo Banner */}
            <div className="relative h-64 bg-gradient-to-br from-orange-400 to-orange-600">
                <div className="absolute inset-0 bg-black/10"></div>
            </div>

            {/* Profile Section */}
            <div className="max-w-7xl mx-auto px-6">
                <div className="relative -mt-20 mb-8">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Column - Profile Info */}
                        <div className="flex-1">
                            {/* Profile Picture */}
                            <img
                                src={provider.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || 'Provider')}&background=f97316&color=fff&size=160`}
                                alt={provider.name}
                                className="w-40 h-40 rounded-2xl object-cover border-4 border-white shadow-xl mb-6"
                            />

                            {/* Provider Info */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h1 className="text-3xl font-bold text-gray-900">{provider.name}</h1>
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">
                                                <Icons.CheckCircle size={16} />
                                                Verified
                                            </span>
                                        </div>
                                        <p className="text-lg text-gray-600 mb-3">
                                            {provider.headline || 'Professional cleaning service provider'}
                                        </p>
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Icons.MapPin size={18} className="text-orange-600" />
                                            <span>{provider.location || 'Toronto, ON'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Category Tags */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                                        Cleaning
                                    </span>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                                        Home Services
                                    </span>
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                        Professional
                                    </span>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <Icons.Star size={20} className="text-yellow-400 fill-yellow-400" />
                                            <span className="text-2xl font-bold text-gray-900">
                                                {providerStats?.rating?.toFixed(1) || provider.rating?.toFixed(1) || 'New'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">Rating</p>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-100">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {providerStats?.jobs_completed ?? provider.jobs_completed ?? 0}
                                        </div>
                                        <p className="text-sm text-gray-600">Jobs</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {providerStats ? `${providerStats.repeat_percentage}%` : (provider.repeat_percentage || '0%')}
                                        </div>
                                        <p className="text-sm text-gray-600">Repeat %</p>
                                    </div>
                                </div>
                            </div>

                            {/* About Me Section */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">About Me</h2>
                                <p className="text-gray-600 leading-relaxed mb-6">
                                    {provider.bio || 'Professional cleaning specialist with over 5 years of experience. I take pride in delivering exceptional service and ensuring every client\'s home is spotless. Eco-friendly products available upon request.'}
                                </p>

                                {/* Response Time & Reliability Badges */}
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-lg">
                                        <Icons.Zap size={18} className="text-orange-600" />
                                        <span className="text-sm font-semibold text-gray-900">Quick Response</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-lg">
                                        <Icons.Shield size={18} className="text-green-600" />
                                        <span className="text-sm font-semibold text-gray-900">Highly Reliable</span>
                                    </div>
                                </div>
                            </div>

                            {/* Active Promotions */}
                            {promotions.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Current Promotions</h2>
                                    <div className="space-y-3">
                                        {promotions.map((promo) => (
                                            <div key={promo.id} className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-white rounded-lg text-orange-600 shadow-sm">
                                                        <Icons.Tag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900">{promo.promo_code}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}% Off` : `$${promo.discount_value} Off`}
                                                            {promo.end_at ? ` · Expires ${new Date(promo.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                {promo.applicable_services && promo.applicable_services.length > 0 && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Applies to: {promo.applicable_services.join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Work Portfolio */}
                            {portfolioItems.length > 0 && (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Work Portfolio</h2>
                                    <div className="grid grid-cols-2 gap-4">
                                        {portfolioItems.map((item) => (
                                            <div key={item.id} className="aspect-video rounded-xl overflow-hidden">
                                                <img
                                                    src={item.media_url}
                                                    alt={item.title || 'Portfolio'}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Client Reviews */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Client Reviews</h2>
                                    <span className="text-sm text-gray-600">
                                        {providerStats?.review_count || reviews.length} review{(providerStats?.review_count || reviews.length) !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review) => (
                                            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                                <div className="flex items-start gap-4">
                                                    <img
                                                        src={review.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.client_name || 'Client')}&background=f97316&color=fff`}
                                                        alt={review.client_name || 'Client'}
                                                        className="w-12 h-12 rounded-full"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-semibold text-gray-900">
                                                                        {review.client_name || 'Client'}
                                                                    </h4>
                                                                    {review.is_verified && (
                                                                        <Icons.CheckCircle size={16} className="text-green-600" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">{formatReviewDate(review.created_at)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1 mb-2">
                                                            {renderStars(review.rating)}
                                                        </div>
                                                        <p className="text-gray-600 leading-relaxed">
                                                            {review.comment}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-400">
                                        <Icons.Star size={32} className="mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No reviews yet</p>
                                        <p className="text-xs mt-1">Be the first to leave a review after booking!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Sidebar - Booking Widget */}
                        <div className="md:w-96 flex-shrink-0">
                            <div className="sticky top-6">
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    {/* Pricing */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-bold text-gray-900">
                                                ${provider.hourly_rate ? Math.floor(provider.hourly_rate / 100) : (provider.hourlyRate ? Math.floor(provider.hourlyRate / 100) : 35)}
                                            </span>
                                            <span className="text-gray-600">per hour</span>
                                        </div>
                                        <p className="text-sm text-gray-500">Starting rate</p>
                                    </div>

                                    {/* Select Service */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            Select Service
                                        </label>
                                        {loadingServices ? (
                                            <div className="text-center py-4">
                                                <div className="w-6 h-6 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-2"></div>
                                                <p className="text-sm text-gray-500">Loading services...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {(providerServices.length > 0 ? providerServices : fallbackServices).map((service) => {
                                                    // Price is in cents, convert to dollars for display
                                                    const displayPrice = typeof service.price === 'number'
                                                        ? (service.price >= 100 ? (service.price / 100).toFixed(0) : service.price)
                                                        : service.price;

                                                    return (
                                                        <button
                                                            key={service.id}
                                                            onClick={() => setSelectedService(service)}
                                                            className={`w-full flex flex-col items-start p-4 rounded-xl border-2 transition-all ${selectedService?.id === service.id
                                                                ? 'border-orange-500 bg-orange-50'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            <div className="flex items-center justify-between w-full mb-2">
                                                                <p className="font-semibold text-gray-900">
                                                                    {service.name}
                                                                </p>
                                                                <span className="font-bold text-gray-900">
                                                                    ${displayPrice}
                                                                    {service.unit && <span className="text-sm font-normal text-gray-500">/{service.unit}</span>}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 text-left">
                                                                {service.description}
                                                            </p>
                                                            {service.duration && (
                                                                <p className="text-xs text-gray-400 mt-1">
                                                                    Duration: {service.duration} mins
                                                                </p>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {!loadingServices && providerServices.length === 0 && (
                                            <p className="text-xs text-gray-500 mt-2 text-center">
                                                This provider hasn't added their services yet. Contact them for details.
                                            </p>
                                        )}
                                    </div>

                                    {/* Closest Available Dates */}
                                    {closestAvailability.length > 0 && (
                                        <div className="mb-6">
                                            <label className="block text-sm font-semibold text-gray-900 mb-3">
                                                Next Available
                                            </label>
                                            <div className="space-y-2">
                                                {closestAvailability.map((slot) => (
                                                    <div
                                                        key={slot.id}
                                                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Icons.Calendar size={18} className="text-green-600" />
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-sm">
                                                                    {formatAvailabilityDate(slot.datetime)}
                                                                </p>
                                                                <p className="text-xs text-gray-600">
                                                                    {formatAvailabilityTime(slot.datetime)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Icons.CheckCircle size={18} className="text-green-600" />
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setShowCalendarModal(true)}
                                                className="w-full mt-3 py-2 text-sm text-orange-600 font-semibold border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                                            >
                                                View Full Calendar
                                            </button>
                                        </div>
                                    )}

                                    {/* Request Custom Time */}
                                    <div className="mb-6">
                                        <button
                                            onClick={() => setShowTimeRequestModal(true)}
                                            className="w-full py-3 flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                                        >
                                            <Icons.Clock size={18} />
                                            Request a Specific Time
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2 text-center">
                                            Can't find a time that works? Request your preferred time slot.
                                        </p>
                                    </div>

                                    {/* Availability Calendar */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            Select Date
                                        </label>
                                        <div className="grid grid-cols-7 gap-2">
                                            {calendarDates.map((date, index) => {
                                                const isSelected = selectedDate?.getTime() === date.getTime();
                                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                                const dayNumber = date.getDate();

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => setSelectedDate(date)}
                                                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${isSelected
                                                            ? 'border-orange-500 bg-orange-500 text-white'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
                                                            }`}
                                                    >
                                                        <span className={`text-xs mb-1 ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                                            {dayName}
                                                        </span>
                                                        <span className="font-bold">
                                                            {dayNumber}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Check Availability Button */}
                                    <button
                                        onClick={handleCheckAvailability}
                                        className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg mb-4"
                                    >
                                        Check Availability
                                    </button>

                                    {/* Satisfaction Guaranteed */}
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                        <Icons.Shield size={18} className="text-green-600" />
                                        <span className="font-semibold">Satisfaction Guaranteed</span>
                                    </div>
                                </div>

                                {/* Additional Info */}
                                <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Icons.Award size={20} className="text-orange-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1">Top Rated Professional</p>
                                            <p className="text-sm text-gray-600">
                                                This provider has maintained excellent ratings and reviews.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Modal */}
            {showCalendarModal && (
                <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                    <div className="min-h-screen px-4 py-8 flex items-start justify-center">
                        <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl mb-8">
                            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">Available Time Slots</h3>
                                        <p className="text-sm text-gray-600 mt-1">Select a time to continue booking</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCalendarModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Icons.X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6">
                                {loadingAvailability ? (
                                    <div className="text-center py-12">
                                        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-gray-600">Loading available time slots...</p>
                                    </div>
                                ) : allAvailability.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Icons.Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                                        <p className="text-gray-600 mb-2">No available slots found</p>
                                        <p className="text-sm text-gray-500 mb-6">
                                            The provider hasn't set up their availability yet.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setShowCalendarModal(false);
                                                setShowTimeRequestModal(true);
                                            }}
                                            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
                                        >
                                            Request a Specific Time
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Group slots by date */}
                                        {Object.entries(
                                            allAvailability.reduce((acc, slot) => {
                                                const date = new Date(slot.datetime).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                });
                                                if (!acc[date]) acc[date] = [];
                                                acc[date].push(slot);
                                                return acc;
                                            }, {})
                                        ).map(([date, slots]) => (
                                            <div key={date} className="mb-6 last:mb-0">
                                                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
                                                    {date}
                                                </h4>
                                                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                    {slots.map((slot) => (
                                                        <button
                                                            key={slot.id}
                                                            onClick={() => handleSelectAvailableSlot(slot)}
                                                            className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all font-semibold text-sm text-gray-900"
                                                        >
                                                            {formatAvailabilityTime(slot.datetime)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <button
                                                onClick={() => {
                                                    setShowCalendarModal(false);
                                                    setShowTimeRequestModal(true);
                                                }}
                                                className="w-full py-3 text-orange-600 font-semibold border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition-colors"
                                            >
                                                Don't see a time that works? Request a Custom Time
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Time Request Modal */}
            {showTimeRequestModal && (
                <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
                    <div className="min-h-screen px-4 py-8 flex items-start justify-center">
                        <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl mb-8">
                            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">Request a Time</h3>
                                    <button
                                        onClick={() => setShowTimeRequestModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Icons.X size={20} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 pb-8">
                                <p className="text-gray-600 mb-6">
                                    Can't find a time that works for you? Request your preferred date and time. The provider will review your request and let you know if they can accommodate it.
                                </p>

                                <div className="space-y-4">
                                    {/* Selected Service Display */}
                                    {selectedService && (
                                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                            <p className="text-sm text-gray-600 mb-1">Service</p>
                                            <p className="font-semibold text-gray-900">{selectedService.name}</p>
                                        </div>
                                    )}

                                    {/* Date Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Preferred Date
                                        </label>
                                        <input
                                            type="date"
                                            min={new Date().toISOString().split('T')[0]}
                                            value={timeRequestForm.requestedDate}
                                            onChange={(e) => setTimeRequestForm({ ...timeRequestForm, requestedDate: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Time Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Preferred Time
                                        </label>
                                        <input
                                            type="time"
                                            value={timeRequestForm.requestedTime}
                                            onChange={(e) => setTimeRequestForm({ ...timeRequestForm, requestedTime: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>

                                    {/* Notes Input */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            value={timeRequestForm.notes}
                                            onChange={(e) => setTimeRequestForm({ ...timeRequestForm, notes: e.target.value })}
                                            placeholder="Any special requests or information for the provider..."
                                            rows={3}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    {/* Info Banner */}
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <Icons.Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm text-gray-700">
                                                This is a request, not a confirmed booking. The provider will review and either accept or decline your request. Even if they have an appointment at this time, they may choose to accommodate you.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowTimeRequestModal(false)}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleRequestTime}
                                        disabled={submittingRequest}
                                        className="flex-1 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submittingRequest ? 'Sending...' : 'Send Request'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderPublicProfile;
