import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import { CATEGORIES } from '../constants';
import { fetchProviders } from '../data/providers';
import { fetchBookings } from '../data/bookings';

const AppDashboard = () => {
    const navigate = useNavigate();
    const [viewState, setViewState] = useState('HOME');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [topSearchQuery, setTopSearchQuery] = useState('');
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const [providers, setProviders] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            try {
                const [provData, bookingData] = await Promise.all([
                    fetchProviders(),
                    fetchBookings(),
                ]);
                if (!cancelled) {
                    setProviders(provData || []);
                    setBookings(bookingData || []);
                }
            } catch (error) {
                console.error("Failed to load dashboard data", error);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

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
        setTopSearchQuery('');
    };

    const handleProviderClick = (providerId) => {
        navigate(`/app/provider/${providerId}`);
    };

    const handleTopSearch = (e) => {
        e.preventDefault();
        if (topSearchQuery.trim()) {
            setViewState('SEARCH_RESULTS');
        }
    };

    const renderCategoryDetail = () => {
        if (!selectedCategory) return null;
        const Icon = getCategoryIcon(selectedCategory.name);

        const categoryProviders = providers.filter(p =>
            (p.categories || []).some(c => c.includes(selectedCategory.name) || selectedCategory.name.includes(c))
        );

        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProviders.length > 0 ? (
                        categoryProviders.map((provider) => (
                            <div
                                key={provider.id}
                                onClick={() => handleProviderClick(provider.id)}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <img src={provider.avatar || provider.avatar_url || provider.avatarUrl} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                                    <div>
                                        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{typeof provider.name === 'string' ? provider.name : 'Provider'}</h3>
                                        <p className="text-sm text-brand-600 font-medium">{typeof provider.headline === 'string' ? provider.headline : (typeof provider.title === 'string' ? provider.title : '')}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Icons.Star size={14} className="text-yellow-400 fill-current" />
                                            <span className="text-sm font-bold text-gray-800">{provider.rating || '4.8'}</span>
                                            <span className="text-xs text-gray-400">({provider.review_count || provider.reviewCount || 0} reviews)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(provider.categories || []).map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                                            {typeof tag === 'string' ? tag : (tag?.name || '')}
                                        </span>
                                    ))}
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="text-lg font-bold text-gray-900">
                                        ${provider.hourly_rate || provider.hourlyRate || 0}<span className="text-sm font-normal text-gray-500">/hr</span>
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

    const renderSearchResults = () => {
        const query = topSearchQuery.toLowerCase();
        const matchedCategories = CATEGORIES.filter(cat =>
            cat.name.toLowerCase().includes(query)
        );
        const matchedProviders = providers.filter(p =>
            (p.name || '').toLowerCase().includes(query) ||
            (p.headline || p.title || '').toLowerCase().includes(query) ||
            (p.categories || []).some(c => c.toLowerCase().includes(query))
        );

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
                        <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
                        <p className="text-gray-500 text-sm">Showing results for "{topSearchQuery}"</p>
                    </div>
                </div>

                {matchedCategories.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">Categories</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {matchedCategories.map((cat) => {
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
                )}

                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900">Providers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matchedProviders.length > 0 ? (
                            matchedProviders.map((provider) => (
                                <div
                                    key={provider.id}
                                    onClick={() => handleProviderClick(provider.id)}
                                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <img src={provider.avatar || provider.avatar_url || provider.avatarUrl} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{typeof provider.name === 'string' ? provider.name : 'Provider'}</h3>
                                            <p className="text-sm text-brand-600 font-medium">{typeof provider.headline === 'string' ? provider.headline : (typeof provider.title === 'string' ? provider.title : '')}</p>
                                            <div className="flex items-center gap-1 mt-1">
                                                <Icons.Star size={14} className="text-yellow-400 fill-current" />
                                                <span className="text-sm font-bold text-gray-800">{provider.rating || '4.8'}</span>
                                                <span className="text-xs text-gray-400">({provider.review_count || provider.reviewCount || 0} reviews)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                                No providers match your search.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHome = () => {
        return (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
                            <Icons.Sparkles size={14} /> Welcome back
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                            Book trusted pros for anything you need done.
                        </h1>
                        <p className="text-gray-500 max-w-2xl">
                            Browse top providers, view your upcoming bookings, and stay on top of notifications—all in one place.
                        </p>
                        <form onSubmit={handleTopSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                            <div className="relative flex-1">
                                <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search for cleaning, plumbing, painting..."
                                    value={topSearchQuery}
                                    onChange={(e) => setTopSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-200"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                            >
                                Search
                            </button>
                        </form>
                    </div>
                    <div className="bg-gradient-to-br from-brand-50 to-white border border-gray-100 rounded-2xl p-5 shadow-inner">
                        <div className="text-sm text-gray-500 mb-1">Upcoming bookings</div>
                        <div className="text-4xl font-bold text-gray-900">{bookings.length}</div>
                        <p className="text-sm text-gray-500 mt-1">Keep track of your next appointments</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Popular categories</h2>
                        <button
                            onClick={handleViewAllCategories}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                        >
                            View all
                        </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {CATEGORIES.filter(cat => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())).map((cat) => {
                            const Icon = getCategoryIcon(cat.name);
                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat)}
                                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                                >
                                    <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <Icon size={22} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800 group-hover:text-brand-600">{cat.name}</span>
                                        <Icons.ArrowRight size={16} className="text-gray-300 group-hover:text-brand-500" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Recommended providers</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(providers || []).slice(0, 6).map((provider) => (
                            <div
                                key={provider.id}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col cursor-pointer"
                                onClick={() => handleProviderClick(provider.id)}
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <img src={provider.avatar || provider.avatar_url || provider.avatarUrl} alt={provider.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-50" />
                                    <div>
                                        <h3 className="font-bold text-gray-900">{typeof provider.name === 'string' ? provider.name : 'Provider'}</h3>
                                        <p className="text-sm text-brand-600 font-medium">{typeof provider.headline === 'string' ? provider.headline : (typeof provider.title === 'string' ? provider.title : '')}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Icons.Star size={14} className="text-yellow-400 fill-current" />
                                            <span className="text-sm font-bold text-gray-800">{provider.rating || '4.8'}</span>
                                            <span className="text-xs text-gray-400">({provider.review_count || provider.reviewCount || 0} reviews)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(provider.categories || []).map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                                            {typeof tag === 'string' ? tag : (tag?.name || '')}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="text-lg font-bold text-gray-900">
                                        ${provider.hourly_rate || provider.hourlyRate || 0}<span className="text-sm font-normal text-gray-500">/hr</span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleProviderClick(provider.id);
                                        }}
                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-500 transition-colors"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {!loading && providers.length === 0 && (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                            No providers available yet.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderAllCategories = () => {
        return (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-4 mb-4">
                    <button
                        onClick={handleBackToHome}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <Icons.ArrowLeft size={24} className="text-gray-700" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">All Categories</h1>
                        <p className="text-gray-500 text-sm">Browse all available service categories</p>
                    </div>
                </div>
                <div className="relative">
                    <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-200"
                    />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {CATEGORIES.filter(cat =>
                        cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
                    ).map((cat) => {
                        const Icon = getCategoryIcon(cat.name);
                        return (
                            <div
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group"
                            >
                                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                    <Icon size={22} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-gray-800 group-hover:text-brand-600">{cat.name}</span>
                                    <Icons.ArrowRight size={16} className="text-gray-300 group-hover:text-brand-500" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    if (viewState === 'CATEGORY_DETAIL') return renderCategoryDetail();
    if (viewState === 'SEARCH_RESULTS') return renderSearchResults();
    if (viewState === 'ALL_CATEGORIES') return renderAllCategories();

    return renderHome();
};

export default AppDashboard;
