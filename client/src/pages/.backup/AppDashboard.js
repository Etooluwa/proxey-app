import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { useClientData } from '../hooks/useClientData';

const AppDashboard = () => {
    // Use the robust data hook instead of raw useSession/fetchProviders
    const {
        profile,
        providers,
        loadProviders,
        isProvidersLoading,
        notifications,
        unreadCount
    } = useClientData();

    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Initial Load
    useEffect(() => {
        loadProviders();
    }, [loadProviders]);

    // Categories
    const categories = [
        { name: 'All', icon: Icons.Grid },
        { name: 'Cleaning', icon: Icons.Star },
        { name: 'Plumbing', icon: Icons.Tool }, // Changed from Wrench to Tool if Wrench is missing, or just keep Tool
        { name: 'Electrical', icon: Icons.Zap },
        { name: 'Moving', icon: Icons.Truck },
        { name: 'Painting', icon: Icons.Edit }, // Using Edit as a placeholder for Brush/Roller
        { name: 'Landscaping', icon: Icons.Sun },
    ];

    // Filter Providers
    const filteredProviders = providers.filter(provider => {
        // Safe access because normalizeProvider guarantees these are strings/arrays
        const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            provider.headline.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'All' ||
            provider.categories.map(c => c.toLowerCase()).includes(selectedCategory.toLowerCase());

        return matchesSearch && matchesCategory;
    });

    // Helper to render stars safely
    const renderStars = (rating) => {
        // Rating is guaranteed to be a number by normalizeProvider
        return (
            <div className="flex items-center text-yellow-400">
                <Icons.Star size={14} fill="currentColor" />
                <span className="ml-1 text-xs font-bold text-gray-700">
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Welcome back, <span className="text-brand-600">{profile.name.split(' ')[0]}</span>!
                    </h1>
                    <p className="text-gray-500 mt-1">What service do you need today?</p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96 group focus-within:w-full md:focus-within:w-[500px] transition-all duration-300 ease-in-out z-20">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icons.Search className="text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for cleaners, plumbers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-brand-100 focus:border-brand-300 outline-none transition-all placeholder-gray-400 text-gray-700"
                    />
                </div>
            </div>

            {/* Quick Stats / Notifications Banner */}
            {unreadCount > 0 && (
                <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-200/50 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold">You have new updates!</h2>
                        <p className="text-brand-100 text-sm mt-1 mb-4 max-w-md">
                            {notifications[0]?.message || "Check your notifications for the latest updates."}
                        </p>
                        <button
                            onClick={() => navigate('/app/notifications')}
                            className="bg-white text-brand-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-brand-50 transition-colors"
                        >
                            View Notifications
                        </button>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 transform translate-x-10 -skew-x-12 bg-white"></div>
                    <Icons.Bell size={120} className="absolute -right-6 -bottom-6 text-white opacity-20 transform rotate-12" />
                </div>
            )}

            {/* Categories Carousel */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4 px-1">Categories</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setSelectedCategory(cat.name)}
                            className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-2xl border transition-all snap-start ${selectedCategory === cat.name
                                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-200 scale-105 border-transparent'
                                    : 'bg-white text-gray-500 border-gray-100 hover:border-brand-200 hover:bg-brand-50/50'
                                }`}
                        >
                            <cat.icon size={28} className={`mb-2 ${selectedCategory === cat.name ? 'text-white' : 'text-gray-400'}`} />
                            <span className="text-sm font-bold">{cat.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Popular Providers Grid */}
            <div>
                <div className="flex justify-between items-center mb-6 px-1">
                    <h3 className="text-lg font-bold text-gray-900">Top Rated Pros</h3>
                    <button className="text-brand-600 text-sm font-bold hover:underline">See all</button>
                </div>

                {isProvidersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 animate-pulse h-64"></div>
                        ))}
                    </div>
                ) : filteredProviders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredProviders.map(provider => (
                            <div
                                key={provider.id}
                                className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-brand-100/50 hover:border-brand-200 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                            >
                                {/* Provider Image & Badge */}
                                <div className="relative mb-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden mx-auto shadow-sm group-hover:scale-105 transition-transform">
                                        <img
                                            src={provider.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name)}&background=random`}
                                            alt={provider.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute top-0 right-0 bg-white shadow-sm border border-gray-100 rounded-full px-2 py-1 flex items-center gap-1">
                                        {renderStars(provider.rating)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="text-center flex-1">
                                    <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-brand-600 transition-colors">
                                        {provider.name}
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3 line-clamp-1">
                                        {provider.categories.join(', ')}
                                    </p>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                                        {provider.headline || "Experienced professional ready to help."}
                                    </p>
                                </div>

                                {/* Footer: Price & Action */}
                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                    <div className="text-left">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Starting at</p>
                                        <p className="text-brand-600 font-bold text-lg">
                                            ${provider.hourly_rate}<span className="text-xs text-gray-400 font-normal">/hr</span>
                                        </p>
                                    </div>
                                    <button className="bg-gray-900 text-white p-2.5 rounded-xl group-hover:bg-brand-600 transition-colors shadow-lg shadow-gray-200">
                                        <Icons.ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icons.Search className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg">No professionals found</h3>
                        <p className="text-gray-500">Try adjusting your mood or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppDashboard;
