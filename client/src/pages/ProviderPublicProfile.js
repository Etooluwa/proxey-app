import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { fetchProviders } from '../data/providers';
import { useSession } from '../auth/authContext';

// Mock data for reviews
const MOCK_REVIEWS = [
    {
        id: 1,
        clientName: 'Sarah Johnson',
        clientAvatar: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=f97316&color=fff',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Exceptional service! Very thorough and professional. My home has never looked better. Highly recommend!',
        verified: true
    },
    {
        id: 2,
        clientName: 'Michael Chen',
        clientAvatar: 'https://ui-avatars.com/api/?name=Michael+Chen&background=3b82f6&color=fff',
        rating: 5,
        date: '1 month ago',
        comment: 'Always on time and does an amazing job. I have been using this service for 6 months now.',
        verified: true
    },
    {
        id: 3,
        clientName: 'Emily Rodriguez',
        clientAvatar: 'https://ui-avatars.com/api/?name=Emily+Rodriguez&background=ec4899&color=fff',
        rating: 4,
        date: '1 month ago',
        comment: 'Great attention to detail. Very satisfied with the quality of work.',
        verified: true
    }
];

// Mock data for portfolio images
const MOCK_PORTFOLIO = [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop'
];

const ProviderPublicProfile = () => {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { session, profile } = useSession();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    // Mock service options
    const serviceOptions = [
        { id: 1, name: 'Deep Home Cleaning', price: 60 },
        { id: 2, name: 'Move-out Clean', price: 250 },
        { id: 3, name: 'Standard Weekly Clean', price: 40 }
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
    }, [providerId]);

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
                    rating: 4.9,
                    jobs_completed: 127,
                    repeat_percentage: '89%',
                    bio: profile.bio,
                    review_count: 48
                });
                setSelectedService(serviceOptions[0]);
            } else {
                // Otherwise, fetch from API
                const providers = await fetchProviders();
                const found = providers.find((p) => p.id === providerId) || providers[0];
                if (found) {
                    setProvider(found);
                    setSelectedService(serviceOptions[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load provider:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAvailability = () => {
        navigate('/app/booking-flow', {
            state: {
                providerId: provider?.id,
                providerName: provider?.name,
                service: selectedService,
                selectedDate
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
                                                {provider.rating?.toFixed(1) || '4.9'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">Rating</p>
                                    </div>
                                    <div className="text-center border-l border-r border-gray-100">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {provider.jobs_completed || 127}
                                        </div>
                                        <p className="text-sm text-gray-600">Jobs</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {provider.repeat_percentage || '89%'}
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

                            {/* Work Portfolio */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Work Portfolio</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    {MOCK_PORTFOLIO.map((image, index) => (
                                        <div key={index} className="aspect-video rounded-xl overflow-hidden">
                                            <img
                                                src={image}
                                                alt={`Portfolio ${index + 1}`}
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Client Reviews */}
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Client Reviews</h2>
                                    <span className="text-sm text-gray-600">
                                        {provider.review_count || 48} reviews
                                    </span>
                                </div>

                                <div className="space-y-6">
                                    {MOCK_REVIEWS.map((review) => (
                                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                                            <div className="flex items-start gap-4">
                                                <img
                                                    src={review.clientAvatar}
                                                    alt={review.clientName}
                                                    className="w-12 h-12 rounded-full"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {review.clientName}
                                                                </h4>
                                                                {review.verified && (
                                                                    <Icons.CheckCircle size={16} className="text-green-600" />
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-gray-500">{review.date}</p>
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
                            </div>
                        </div>

                        {/* Right Sidebar - Booking Widget */}
                        <div className="md:w-96 flex-shrink-0">
                            <div className="sticky top-6">
                                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                                    {/* Pricing */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2 mb-2">
                                            <span className="text-3xl font-bold text-gray-900">$35</span>
                                            <span className="text-gray-600">per hour</span>
                                        </div>
                                        <p className="text-sm text-gray-500">Starting rate</p>
                                    </div>

                                    {/* Select Service */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold text-gray-900 mb-3">
                                            Select Service
                                        </label>
                                        <div className="space-y-2">
                                            {serviceOptions.map((service) => (
                                                <button
                                                    key={service.id}
                                                    onClick={() => setSelectedService(service)}
                                                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                                                        selectedService?.id === service.id
                                                            ? 'border-orange-500 bg-orange-50'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="text-left">
                                                        <p className="font-semibold text-gray-900">
                                                            {service.name}
                                                        </p>
                                                    </div>
                                                    <span className="font-bold text-gray-900">
                                                        ${service.price}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
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
                                                        className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                                                            isSelected
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
        </div>
    );
};

export default ProviderPublicProfile;
