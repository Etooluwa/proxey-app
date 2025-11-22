import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { CATEGORIES, TOP_PROVIDERS, CLIENT_BOOKINGS } from '../constants';

const AppDashboard = () => {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState('HOME');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [bookings] = useState(CLIENT_BOOKINGS); // Using mock data for now

    const getCategoryIcon = (name) => {
        switch (name) {
            case 'Cleaning': return Icons.Sparkles;
            case 'Repair': return Icons.Wrench;
            case 'Beauty': return Icons.Scissors;
            case 'Moving': return Icons.Truck;
            case 'Painting': return Icons.Paintbrush;
            case 'Plumbing': return Icons.Droplets;
            case 'Electrical': return Icons.Zap;
            case 'Gardening': return Icons.Leaf;
            case 'Pet Care': return Icons.PawPrint;
            case 'Photography': return Icons.Camera;
            default: return Icons.Sparkles;
        }
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setViewState('CATEGORY_DETAIL');
    };

    const handleViewAllCategories = () => {
        setViewState('ALL_CATEGORIES');
    };

    const handleBackToHome = () => {
        setViewState('HOME');
        setSelectedCategory(null);
    };

    const handleProviderClick = (providerId) => {
        navigate(`/app/provider/${providerId}`);
    };

    // --- SUB-VIEWS ---

    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;
        const Icon = getCategoryIcon(selectedCategory.name);

        const categoryProviders = TOP_PROVIDERS.filter(p =>
            p.categories.some(c => c.includes(selectedCategory.name) || selectedCategory.name.includes(c))
        );

        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={handleBackToHome}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <Icons.ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div className={`w-12 h-12 rounded-xl ${selectedCategory.color} flex items-center justify-center`}>
                        <Icon size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedCategory.name} Services</h1>
                        <p className="text-gray-500 text-sm">Find the best local {selectedCategory.name.toLowerCase()} professionals</p>
                    </div>
                </div>

                {/* Provider List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProviders.length > 0 ? (
                        categoryProviders.map((provider) => (
                            <div
                                key={provider.id}
                                onClick={() => handleProviderClick(provider.id)}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <img src={provider.avatarUrl} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{provider.name}</h3>
                                        <p className="text-sm text-brand-600 font-medium">{provider.title}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Icons.Star size={14} className="text-yellow-400 fill-current" />
                                            <span className="text-sm font-bold text-gray-800">{provider.rating}</span>
                                            <span className="text-xs text-gray-400">({provider.reviewCount} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {provider.categories.map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="text-lg font-bold text-gray-900">
                                        ${provider.hourlyRate}<span className="text-sm font-normal text-gray-500">/hr</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProviderClick(provider.id);
                                        }}
                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className={`w-16 h-16 mx-auto rounded-full ${selectedCategory.color} bg-opacity-20 flex items-center justify-center mb-4`}>
                                <Icon size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">No providers found</h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                We currently don't have any {selectedCategory.name.toLowerCase()} providers available in your area. Please check back later!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAllCategories = () => {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={handleBackToHome}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <Icons.ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Categories</h1>
                        <p className="text-gray-500 text-sm">Explore all services available on Kliques</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {CATEGORIES.map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 hover:-translate-y-1 transition-all group text-center flex flex-col items-center justify-center aspect-square"
                            >
                                <div className={`w-16 h-16 rounded-full ${cat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon size={28} />
                                </div>
                                <span className="font-bold text-gray-700 text-lg group-hover:text-brand-600">{cat.name}</span>
                                <span className="text-xs text-gray-400 mt-2 font-medium">View Providers</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- MAIN HOME RENDER ---

    if (viewState === 'CATEGORY_DETAIL') return renderCategoryDetail();
    if (viewState === 'ALL_CATEGORIES') return renderAllCategories();

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
            {/* Hero / Search Section */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-3xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10 max-w-3xl">
                    <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                        Find the perfect professional for your home & lifestyle.
                    </h1>
                    <p className="text-brand-100 mb-10 text-lg max-w-xl">From cleaning to repairs, book trusted local services in minutes.</p>

                    {/* Enhanced Search Bar */}
                    <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-brand-900/20 flex flex-col md:flex-row gap-2">

                        {/* Search Input */}
                        <div className="flex-1 flex items-center px-4 py-3 relative group">
                            <Icons.Search className="text-gray-400 group-focus-within:text-brand-500 transition-colors flex-shrink-0" size={24} />
                            <input
                                type="text"
                                placeholder="What service do you need?"
                                className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 px-4 text-base md:text-lg font-medium w-full"
                            />
                        </div>

                        {/* Search Button */}
                        <button className="bg-gray-900 text-white px-8 py-3 md:py-4 rounded-2xl font-bold text-lg hover:bg-brand-600 transition-all shadow-lg shadow-gray-900/10 hover:shadow-brand-500/25 flex items-center justify-center gap-2 md:ml-2">
                            Search
                        </button>
                    </div>

                </div>

                {/* Abstract Decoration */}
                <div className="absolute right-0 bottom-0 opacity-20 transform translate-y-1/4 translate-x-1/4 pointer-events-none">
                    <Icons.Sparkles size={400} />
                </div>
            </div>

            {/* Categories Preview (Top 6) */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Browse Categories</h2>
                    <button
                        onClick={handleViewAllCategories}
                        className="text-brand-600 font-medium text-sm hover:underline flex items-center gap-1"
                    >
                        View all <Icons.ChevronRight size={14} />
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {CATEGORIES.slice(0, 6).map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group text-center flex flex-col items-center justify-center"
                            >
                                <div className={`w-14 h-14 rounded-full ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} />
                                </div>
                                <span className="font-semibold text-gray-700 group-hover:text-brand-600">{cat.name}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Grid: Popular Providers & Upcoming Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Popular Providers - Span 2 cols */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900">Popular Providers</h2>
                        {TOP_PROVIDERS.length > 0 && (
                            <button className="text-gray-400 hover:text-gray-600">
                                <Icons.ChevronRight />
                            </button>
                        )}
                    </div>

                    {TOP_PROVIDERS.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {TOP_PROVIDERS.slice(0, 4).map((provider) => (
                                <div
                                    key={provider.id}
                                    onClick={() => handleProviderClick(provider.id)}
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <img src={provider.avatarUrl} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{provider.name}</h3>
                                            <p className="text-sm text-brand-600 font-medium">{provider.title}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Icons.Star size={14} className="text-yellow-400 fill-current" />
                                                <span className="text-sm font-bold text-gray-800">{provider.rating}</span>
                                                <span className="text-xs text-gray-400">({provider.reviewCount} reviews)</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {provider.categories.map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <div className="text-lg font-bold text-gray-900">
                                            ${provider.hourlyRate}<span className="text-sm font-normal text-gray-500">/hr</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleProviderClick(provider.id);
                                            }}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors"
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gradient-to-b from-white to-gray-50 rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center h-96 shadow-sm">
                            {/* Empty state content */}
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                                <Icons.Search className="text-brand-400" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">We are launching in your area!</h3>
                        </div>
                    )}
                </div>

                {/* Upcoming Bookings - Span 1 col */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
                    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${bookings.length > 0 ? 'p-6' : 'p-8 text-center flex flex-col items-center justify-center min-h-[300px]'}`}>
                        {bookings.length > 0 ? (
                            <>
                                <div className="space-y-6">
                                    {bookings.slice(0, 3).map((booking) => (
                                        <div key={booking.id} className="relative pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                                <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                    <Icons.Clock size={12} /> {booking.time}
                                                </span>
                                            </div>

                                            <div className="flex gap-4 items-center">
                                                <div className="bg-brand-50 rounded-xl p-3 flex-shrink-0 text-brand-600">
                                                    <Icons.Calendar size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{booking.serviceName}</h4>
                                                    <p className="text-sm text-gray-500">{booking.providerName}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{booking.date}</p>
                                                </div>
                                            </div>

                                            {booking.status === 'confirmed' && (
                                                <div className="mt-4 flex gap-2">
                                                    <button onClick={() => navigate('/app/messages')} className="flex-1 py-2 text-xs font-semibold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors">
                                                        Message
                                                    </button>
                                                    <button onClick={() => navigate('/app/bookings')} className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                        Reschedule
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => navigate('/app/bookings')}
                                    className="w-full py-3 mt-6 text-sm text-center text-brand-600 font-semibold hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-colors"
                                >
                                    View Full History
                                </button>
                            </>
                        ) : (
                            <div className="py-8">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Icons.Calendar className="text-gray-300" size={32} />
                                </div>
                                <h4 className="text-gray-900 font-bold mb-2">No upcoming bookings</h4>
                                <p className="text-gray-400 text-sm mb-6 max-w-[200px] mx-auto">
                                    You haven't booked any services yet. Your schedule will appear here.
                                </p>
                                <button
                                    onClick={() => navigate('/app/browse')}
                                    className="text-sm font-semibold text-brand-600 bg-brand-50 px-6 py-2 rounded-xl hover:bg-brand-100 transition-colors"
                                >
                                    Find a Service
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AppDashboard;
