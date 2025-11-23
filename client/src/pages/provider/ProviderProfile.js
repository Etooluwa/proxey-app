import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { useSession } from '../../auth/authContext';
import { SERVICE_CATEGORIES } from '../../utils/categories';
import { useToast } from '../../components/ui/ToastProvider';

const REVIEWS = [
    {
        id: 1,
        client: 'Michael Scott',
        rating: 5,
        date: 'Oct 20, 2023',
        text: 'Jane did a fantastic job! The house has never been cleaner. Highly recommended.',
        avatar: 'https://picsum.photos/seed/michael/100/100'
    },
    {
        id: 2,
        client: 'Pam Beesly',
        rating: 5,
        date: 'Oct 15, 2023',
        text: 'Very professional and punctual. Will book again.',
        avatar: 'https://picsum.photos/seed/pam/100/100'
    },
    {
        id: 3,
        client: 'Dwight Schrute',
        rating: 4,
        date: 'Sep 28, 2023',
        text: 'Acceptable performance. Missed a spot on the beet shelf.',
        avatar: 'https://picsum.photos/seed/dwight/100/100'
    }
];

const PORTFOLIO_IMAGES = [
    'https://picsum.photos/seed/clean1/300/200',
    'https://picsum.photos/seed/clean2/300/200',
    'https://picsum.photos/seed/clean3/300/200',
    'https://picsum.photos/seed/clean4/300/200',
];

const ProviderProfile = () => {
    const { profile, session, logout, updateProfile } = useSession();
    const navigate = useNavigate();
    const toast = useToast();

    const [bio, setBio] = useState(profile?.bio || "Hi! I have over 5 years of experience. I take pride in my attention to detail and treating your home with the utmost respect.");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (profile?.bio) {
            setBio(profile.bio);
        }
    }, [profile]);

    const handleLogout = async () => {
        await logout();
        navigate('/auth/sign-in');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                bio: bio
            });
            toast.push({
                title: "Profile updated",
                description: "Your changes have been saved.",
                variant: "success"
            });
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.push({
                title: "Update failed",
                description: "Could not save changes.",
                variant: "error"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const categoryLabel = SERVICE_CATEGORIES.find(c => c.id === profile?.category)?.label || profile?.category || 'Service Provider';

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">

            {/* Header / Cover Area */}
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Cover Photo */}
                <div className="h-48 bg-gradient-to-r from-brand-400 to-brand-600 relative">
                    <button className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-sm flex items-center gap-2 transition-colors">
                        <Icons.Camera size={16} /> Edit Cover
                    </button>
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-6">
                            <div className="relative">
                                <img
                                    src={profile?.photo || "https://picsum.photos/seed/jane/200/200"}
                                    alt="Provider"
                                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-gray-100"
                                />
                                <button className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-brand-600 transition-colors">
                                    <Icons.Camera size={14} />
                                </button>
                            </div>
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {profile?.name || 'Provider Name'} <Icons.Check size={20} className="text-blue-500 fill-current" />
                                </h1>
                                <p className="text-brand-600 font-medium">{categoryLabel}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Icons.MapPin size={14} /> {profile?.city || 'Location'}</span>
                                    <span className="flex items-center gap-1"><Icons.Star size={14} className="text-yellow-400 fill-current" /> 4.9 (128 reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-4 md:mt-0">
                            <button
                                onClick={() => navigate(`/preview/provider/${session?.user?.id || 'preview'}`)}
                                className="px-6 py-2.5 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Preview Public View
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2.5 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200 disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>

                    {/* Verification Badges */}
                    <div className="flex gap-4 flex-wrap border-t border-gray-100 pt-6">
                        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl text-blue-700 text-sm font-bold border border-blue-100">
                            <Icons.Shield size={16} /> Identity Verified
                        </div>
                        <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-xl text-purple-700 text-sm font-bold border border-purple-100">
                            <Icons.Award size={16} /> Top Rated Pro
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl text-green-700 text-sm font-bold border border-green-100">
                            <Icons.Check size={16} /> Background Checked
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Info & Map */}
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-700">{session?.user?.email}</span>
                                    <Icons.Check size={14} className="text-green-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                    <span className="text-sm text-gray-700">{profile?.phone || 'Not provided'}</span>
                                    {profile?.phone && <Icons.Check size={14} className="text-green-500" />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Area */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Service Area</h3>
                            <button className="text-brand-600 text-xs font-bold hover:underline">Edit Radius</button>
                        </div>
                        <div className="h-40 bg-gray-100 rounded-xl flex items-center justify-center relative overflow-hidden border border-gray-200 group cursor-pointer">
                            <div className="absolute inset-0 bg-gray-200 opacity-50">
                                {/* Mock Map Pattern */}
                                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                            </div>
                            <div className="relative z-10 flex flex-col items-center text-gray-500 group-hover:text-brand-600 transition-colors">
                                <Icons.Map size={32} />
                                <span className="text-xs font-bold mt-2">{profile?.city || 'City'} + 10 miles</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Performance</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                <div className="text-2xl font-bold text-gray-900">142</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">Jobs Done</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl text-center">
                                <div className="text-2xl font-bold text-gray-900">98%</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold">On Time</div>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">My Services</h3>
                            <button onClick={() => navigate('/provider/services')} className="text-brand-600 text-xs font-bold hover:underline">Edit</button>
                        </div>
                        <div className="space-y-3">
                            {profile?.services && profile.services.length > 0 ? (
                                profile.services.map((service, index) => (
                                    <div key={index} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-gray-700 text-sm">{service.name}</span>
                                            <span className="font-bold text-gray-900 text-sm">${service.price}</span>
                                        </div>
                                        {service.description && (
                                            <p className="text-xs text-gray-500 line-clamp-2">{service.description}</p>
                                        )}
                                        <div className="text-xs text-gray-400 mt-1">{service.duration} min</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 italic">No services added yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Middle/Right Column: Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* About Me */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">About Me</h3>
                        </div>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 leading-relaxed focus:ring-2 focus:ring-brand-100 focus:border-brand-300 outline-none resize-none"
                            placeholder="Tell clients about yourself..."
                        />
                    </div>

                    {/* Portfolio */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Portfolio</h3>
                            <button className="flex items-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors">
                                <Icons.Camera size={16} /> Add Photos
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PORTFOLIO_IMAGES.map((img, i) => (
                                <div key={i} className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer">
                                    <img src={img} alt="Portfolio" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <Icons.Search className="text-white" size={20} />
                                    </div>
                                </div>
                            ))}
                            <div className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-all cursor-pointer">
                                <Icons.Camera size={24} />
                                <span className="text-xs font-bold mt-2">Add Photo</span>
                            </div>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
                            <button className="text-sm font-bold text-gray-400 hover:text-gray-600">View All</button>
                        </div>
                        <div className="space-y-6">
                            {REVIEWS.map((review) => (
                                <div key={review.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-3">
                                            <img src={review.avatar} alt={review.client} className="w-10 h-10 rounded-full object-cover" />
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{review.client}</h4>
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
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <Icons.Message size={16} />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed pl-[52px]">
                                        "{review.text}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account Actions - Moved to bottom */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Account</h3>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 py-3 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            <Icons.LogOut size={20} />
                            Log Out
                        </button>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default ProviderProfile;
