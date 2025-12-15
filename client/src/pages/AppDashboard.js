import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useSession } from '../auth/authContext';

const CATEGORIES = [
    { id: '1', name: 'Cleaning', color: 'bg-blue-100 text-blue-600', icon: 'Sparkles' },
    { id: '2', name: 'Repair', color: 'bg-orange-100 text-orange-600', icon: 'Wrench' },
    { id: '3', name: 'Beauty', color: 'bg-pink-100 text-pink-600', icon: 'Scissors' },
    { id: '4', name: 'Moving', color: 'bg-green-100 text-green-600', icon: 'Truck' },
    { id: '5', name: 'Painting', color: 'bg-purple-100 text-purple-600', icon: 'Paintbrush' },
    { id: '6', name: 'Plumbing', color: 'bg-cyan-100 text-cyan-600', icon: 'Droplets' },
    { id: '7', name: 'Electrical', color: 'bg-yellow-100 text-yellow-600', icon: 'Zap' },
    { id: '8', name: 'Gardening', color: 'bg-emerald-100 text-emerald-600', icon: 'Leaf' },
    { id: '9', name: 'Pet Care', color: 'bg-rose-100 text-rose-600', icon: 'PawPrint' },
    { id: '10', name: 'Photography', color: 'bg-indigo-100 text-indigo-600', icon: 'Camera' },
];

const AppDashboard = () => {
    const navigate = useNavigate();
    const { profile } = useSession();
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/providers');
            const data = await response.json();
            setProviders(data.providers || []);
        } catch (error) {
            console.error('Failed to load providers:', error);
            setProviders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryClick = (category) => {
        navigate(`/app/browse?category=${encodeURIComponent(category.name)}`);
    };

    const handleProviderClick = (providerId) => {
        navigate(`/app/provider/${providerId}`);
    };

    const getCategoryIcon = (iconName) => {
        return Icons[iconName] || Icons.Sparkles;
    };

    const filteredProviders = providers.filter(provider => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return (
            provider.name?.toLowerCase().includes(query) ||
            provider.headline?.toLowerCase().includes(query) ||
            provider.categories?.some(cat => cat.toLowerCase().includes(query))
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 text-white px-4 md:px-10 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-3">
                        Welcome back, {profile?.name || 'there'}! 👋
                    </h1>
                    <p className="text-brand-100 text-lg mb-6">
                        Find trusted service providers in your area
                    </p>

                    {/* Search Bar */}
                    <div className="bg-white rounded-xl p-2 flex items-center gap-3 shadow-lg max-w-2xl">
                        <Icons.Search size={20} className="text-gray-400 ml-2" />
                        <input
                            type="text"
                            placeholder="Search for services or providers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 outline-none text-gray-800 placeholder-gray-400"
                        />
                        <Button size="sm" className="!bg-brand-600 hover:!bg-brand-700">
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div className="px-4 md:px-10 py-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Browse Categories</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                    {CATEGORIES.map((category) => {
                        const IconComponent = getCategoryIcon(category.icon);
                        return (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryClick(category)}
                                className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-brand-200 group"
                            >
                                <div className={`w-14 h-14 rounded-xl ${category.color} flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform`}>
                                    <IconComponent size={28} />
                                </div>
                                <p className="font-semibold text-gray-800 text-center">
                                    {category.name}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Top Providers Section */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {searchQuery ? 'Search Results' : 'Available Providers'}
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Icons.Loader size={32} className="text-brand-600 animate-spin" />
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Icons.AlertCircle size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                {searchQuery ? 'No providers found' : 'No providers available yet'}
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Service providers will appear here once they register'}
                            </p>
                            {searchQuery && (
                                <Button onClick={() => setSearchQuery('')} variant="secondary">
                                    Clear Search
                                </Button>
                            )}
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProviders.map((provider) => (
                                <Card
                                    key={provider.id}
                                    className="hover:shadow-xl transition-shadow duration-200 cursor-pointer group"
                                    onClick={() => handleProviderClick(provider.id)}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <img
                                            src={provider.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.name || 'Provider')}&background=random`}
                                            alt={provider.name}
                                            className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900 group-hover:text-brand-600 transition-colors">
                                                {provider.name || 'Unknown Provider'}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-1">
                                                {provider.headline || 'Service Provider'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1">
                                            <Icons.Star size={16} className="text-yellow-400 fill-yellow-400" />
                                            <span className="font-semibold text-gray-900">
                                                {provider.rating?.toFixed(1) || '5.0'}
                                            </span>
                                            <span className="text-gray-500 text-sm">
                                                ({provider.review_count || 0})
                                            </span>
                                        </div>
                                        {provider.hourly_rate && (
                                            <div className="text-brand-600 font-semibold">
                                                ${(provider.hourly_rate / 100).toFixed(0)}/hr
                                            </div>
                                        )}
                                    </div>

                                    {provider.categories && provider.categories.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {provider.categories.slice(0, 3).map((cat, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {provider.location && (
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Icons.MapPin size={14} />
                                            <span>{provider.location}</span>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppDashboard;
