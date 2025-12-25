import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useSession } from '../auth/authContext';

const CATEGORIES = [
    { id: '1', name: 'Cleaning', bgColor: 'bg-blue-100', textColor: 'text-blue-600', icon: 'Sparkles' },
    { id: '2', name: 'Repair', bgColor: 'bg-orange-100', textColor: 'text-orange-600', icon: 'Wrench' },
    { id: '3', name: 'Beauty', bgColor: 'bg-pink-100', textColor: 'text-pink-600', icon: 'Scissors' },
    { id: '4', name: 'Moving', bgColor: 'bg-green-100', textColor: 'text-green-600', icon: 'Truck' },
    { id: '5', name: 'Painting', bgColor: 'bg-purple-100', textColor: 'text-purple-600', icon: 'Paintbrush' },
    { id: '6', name: 'Plumbing', bgColor: 'bg-cyan-100', textColor: 'text-cyan-600', icon: 'Droplets' },
];

const AppDashboard = () => {
    const navigate = useNavigate();
    const { profile, session } = useSession();
    const [providers, setProviders] = useState([]);
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProviders();
        loadUpcomingBookings();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/providers');
            const data = await response.json();
            setProviders(data.providers || []);
        } catch (error) {
            console.error('Failed to load providers:', error);
            setProviders([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUpcomingBookings = async () => {
        setBookingsLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/bookings/me', {
                headers: {
                    'Authorization': `Bearer ${session?.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const bookings = Array.isArray(data.bookings) ? data.bookings : [];

                // Filter for upcoming bookings only
                const upcoming = bookings.filter(b => {
                    const scheduledDate = new Date(b.scheduled_at);
                    const now = new Date();
                    return scheduledDate >= now && b.status !== 'cancelled' && b.status !== 'completed';
                });

                // Sort by date (earliest first) and take first 3
                upcoming.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
                setUpcomingBookings(upcoming.slice(0, 3));
            }
        } catch (error) {
            console.error('Failed to load bookings:', error);
            setUpcomingBookings([]);
        } finally {
            setBookingsLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        navigate(`/app/browse?category=${encodeURIComponent(category.name)}`);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/app/browse?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const getCategoryIcon = (iconName) => {
        return Icons[iconName] || Icons.Sparkles;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section with Orange Gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 px-6 md:px-12 py-16 md:py-24">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        Find the perfect professional for<br />your home & lifestyle.
                    </h1>
                    <p className="text-white/90 text-lg md:text-xl mb-8">
                        From cleaning to repairs, book trusted local services in minutes.
                    </p>

                    {/* Large Search Bar */}
                    <form onSubmit={handleSearch} className="relative max-w-4xl">
                        <div className="bg-white rounded-2xl shadow-2xl flex items-center overflow-hidden">
                            <div className="flex-1 flex items-center px-6 py-5">
                                <Icons.Search size={24} className="text-gray-400 mr-4" />
                                <input
                                    type="text"
                                    placeholder="What service do you need?"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 outline-none text-lg text-gray-700 placeholder-gray-400"
                                />
                            </div>
                            <button
                                type="submit"
                                className="bg-gray-900 text-white px-10 py-5 font-semibold text-lg hover:bg-gray-800 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Browse Categories Section */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
                    <button
                        onClick={() => navigate('/app/browse')}
                        className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
                    >
                        View all
                        <Icons.ChevronRight size={20} />
                    </button>
                </div>

                {/* Category Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {CATEGORIES.map((category) => {
                        const IconComponent = getCategoryIcon(category.icon);
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-orange-200 group flex flex-col items-center"
                            >
                                <div className={`w-16 h-16 rounded-full ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <IconComponent size={28} className={category.textColor} />
                                </div>
                                <p className="font-semibold text-gray-900 text-center">
                                    {category.name}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Upcoming Bookings Section */}
                <div className="mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-gray-900">Upcoming Bookings</h2>
                        <button
                            onClick={() => navigate('/app/bookings')}
                            className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
                        >
                            View all
                            <Icons.ChevronRight size={20} />
                        </button>
                    </div>

                    {bookingsLoading ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                            <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading bookings...</p>
                        </div>
                    ) : upcomingBookings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    onClick={() => navigate('/app/bookings')}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 hover:border-orange-200 cursor-pointer"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <Icons.Calendar size={24} className="text-orange-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">
                                                {booking.service_name || 'Service'}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                {booking.provider_name || 'Professional'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Icons.Calendar size={14} className="text-gray-400" />
                                            <span>
                                                {booking.scheduled_at
                                                    ? new Date(booking.scheduled_at).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })
                                                    : 'TBD'
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Icons.Clock size={14} className="text-gray-400" />
                                            <span>
                                                {booking.scheduled_at
                                                    ? new Date(booking.scheduled_at).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })
                                                    : 'TBD'
                                                }
                                            </span>
                                        </div>
                                        {booking.location && (
                                            <div className="flex items-center gap-2">
                                                <Icons.MapPin size={14} className="text-gray-400" />
                                                <span className="truncate">{booking.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    {booking.total_price && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-orange-600 font-bold">
                                                ${(booking.total_price / 100).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icons.Calendar size={32} className="text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                No upcoming bookings
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                                You don't have any upcoming appointments. Browse services and book your first appointment!
                            </p>
                        </div>
                    )}
                </div>

                {/* Popular Providers Section */}
                {providers.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Popular Professionals</h2>
                            <button
                                onClick={() => navigate('/app/browse')}
                                className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
                            >
                                See all
                                <Icons.ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {providers.slice(0, 8).map((provider) => (
                                <div
                                    key={provider.id}
                                    onClick={() => navigate(`/app/provider/${provider.id}`)}
                                    className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-200 border border-gray-100 hover:border-orange-200 cursor-pointer"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <img
                                            src={provider.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || 'Provider')}&background=random`}
                                            alt={provider.name}
                                            className="w-14 h-14 rounded-full object-cover"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 mb-1">
                                                {provider.name || 'Professional'}
                                            </h3>
                                            <div className="flex items-center gap-1">
                                                <Icons.Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                <span className="text-sm font-semibold text-gray-700">
                                                    {provider.rating?.toFixed(1) || '5.0'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    ({provider.review_count || 0})
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                        {provider.headline || 'Experienced professional'}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/app/provider/${provider.id}`);
                                        }}
                                        className="w-full bg-orange-600 text-white py-2.5 px-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        Book Now
                                        <Icons.ArrowRight size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && providers.length === 0 && (
                    <div className="mt-16 bg-white rounded-2xl p-16 text-center border border-gray-100">
                        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Search size={32} className="text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No professionals available yet
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Service providers will appear here once they register. Check back soon!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppDashboard;
