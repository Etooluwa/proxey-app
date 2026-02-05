import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../../components/Icons';
import { useSession } from '../../auth/authContext';
import { SERVICE_CATEGORIES } from '../../utils/categories';
import { useToast } from '../../components/ui/ToastProvider';
import { supabase } from '../../utils/supabase';
import { uploadPortfolioImage, deletePortfolioImage } from '../../utils/portfolioUpload';
import { uploadProfilePhoto } from '../../utils/photoUpload';
import { request } from '../../data/apiClient';

const formatReviewDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const ProviderProfile = () => {
    const { profile, session, logout, updateProfile } = useSession();
    const navigate = useNavigate();
    const toast = useToast();

    const [bio, setBio] = useState(profile?.bio || '');
    const [phone, setPhone] = useState(profile?.phone || '');
    const [profilePhoto, setProfilePhoto] = useState(profile?.photo || null);
    const [coverPhoto, setCoverPhoto] = useState(profile?.coverPhoto || null);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [activePromotions, setActivePromotions] = useState([]);
    const [providerReviews, setProviderReviews] = useState([]);
    const [providerStats, setProviderStats] = useState(null);

    useEffect(() => {
        if (profile?.bio) setBio(profile.bio);
        if (profile?.phone) setPhone(profile.phone);
        if (profile?.photo) setProfilePhoto(profile.photo);
        if (profile?.coverPhoto) setCoverPhoto(profile.coverPhoto);
    }, [profile]);

    // Load portfolio items from API
    const loadPortfolio = useCallback(async () => {
        try {
            const data = await request('/provider/portfolio');
            setPortfolioItems(data.media || []);
        } catch (error) {
            console.error('[portfolio] Failed to load portfolio:', error);
        }
    }, []);

    // Load active promotions
    const loadPromotions = useCallback(async () => {
        try {
            const data = await request('/provider/promotions');
            const active = (data.promotions || []).filter(p => p.is_active);
            setActivePromotions(active);
        } catch (error) {
            console.error('[promotions] Failed to load promotions:', error);
        }
    }, []);

    // Load reviews for this provider
    const loadReviews = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const data = await request(`/provider/${session.user.id}/reviews`);
            setProviderReviews(data.reviews || []);
        } catch (error) {
            console.error('[reviews] Failed to load reviews:', error);
        }
    }, [session?.user?.id]);

    // Load provider stats
    const loadStats = useCallback(async () => {
        if (!session?.user?.id) return;
        try {
            const data = await request(`/provider/${session.user.id}/stats`);
            setProviderStats(data.stats || null);
        } catch (error) {
            console.error('[stats] Failed to load stats:', error);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (session?.user?.id) {
            loadPortfolio();
            loadPromotions();
            loadReviews();
            loadStats();
        }
    }, [session?.user?.id, loadPortfolio, loadPromotions, loadReviews, loadStats]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleProfilePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.id) return;
        try {
            const url = await uploadProfilePhoto(file, session.user.id);
            setProfilePhoto(url);
        } catch (error) {
            console.error('[profile] Photo upload failed:', error);
            toast.push({ title: "Upload failed", description: "Could not upload photo.", variant: "error" });
        }
    };

    const handleCoverPhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.id) return;
        setIsUploadingCover(true);
        try {
            const url = await uploadPortfolioImage(file, session.user.id);
            setCoverPhoto(url);
        } catch (error) {
            console.error('[profile] Cover photo upload failed:', error);
            toast.push({ title: "Upload failed", description: "Could not upload cover photo.", variant: "error" });
        } finally {
            setIsUploadingCover(false);
        }
    };

    const handlePortfolioAdd = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user?.id) return;
        setIsUploadingPortfolio(true);
        try {
            // Upload image to Supabase Storage
            const imageUrl = await uploadPortfolioImage(file, session.user.id);

            // Save to portfolio_media table via API
            const data = await request('/provider/portfolio', {
                method: 'POST',
                body: JSON.stringify({
                    mediaUrl: imageUrl,
                    mediaType: 'image',
                }),
            });

            setPortfolioItems((prev) => [data.media, ...prev]);
            toast.push({ title: "Photo added", description: "Portfolio image uploaded.", variant: "success" });
        } catch (error) {
            console.error('[portfolio] Upload failed:', error);
            toast.push({ title: "Upload failed", description: "Could not upload portfolio image.", variant: "error" });
        } finally {
            setIsUploadingPortfolio(false);
            // Reset file input
            e.target.value = '';
        }
    };

    const handlePortfolioRemove = async (item) => {
        try {
            // Delete from API
            await request(`/provider/portfolio/${item.id}`, { method: 'DELETE' });

            // Delete from storage
            if (item.media_url) {
                await deletePortfolioImage(item.media_url);
            }

            setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
            toast.push({ title: "Photo removed", description: "Portfolio image deleted.", variant: "success" });
        } catch (error) {
            console.error('[portfolio] Delete failed:', error);
            toast.push({ title: "Delete failed", description: "Could not remove image.", variant: "error" });
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateProfile({
                bio,
                phone,
                photo: profilePhoto,
                coverPhoto,
            });

            if (supabase && session?.user?.id) {
                const providerData = {
                    user_id: session.user.id,
                    name: profile?.name,
                    email: session?.user?.email,
                    phone,
                    bio,
                    photo: profilePhoto,
                    avatar: profilePhoto,
                    cover_photo: coverPhoto,
                    category: profile?.category,
                    city: profile?.city,
                    location: profile?.city,
                    services: profile?.services || [],
                    availability: profile?.availability || {},
                    is_profile_complete: profile?.isProfileComplete ?? true,
                    is_active: true
                };

                const { error } = await supabase
                    .from('providers')
                    .upsert(providerData, {
                        onConflict: 'user_id'
                    });

                if (error) {
                    console.error('[profile] Failed to sync provider profile to database:', error);
                }
            }

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
                <div
                    className="h-48 relative"
                    style={{
                        backgroundImage: coverPhoto
                            ? `url(${coverPhoto})`
                            : 'linear-gradient(to right, rgb(251 146 60), rgb(249 115 22))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        id="cover-photo-input"
                        className="hidden"
                        onChange={handleCoverPhotoChange}
                    />
                    <label
                        htmlFor="cover-photo-input"
                        className={`absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-sm flex items-center gap-2 transition-colors cursor-pointer ${isUploadingCover ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isUploadingCover ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Icons.Camera size={16} /> Edit Cover
                            </>
                        )}
                    </label>
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end gap-6">
                            <div className="relative">
                                <img
                                    src={profilePhoto || profile?.photo || "https://picsum.photos/seed/jane/200/200"}
                                    alt="Provider"
                                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover bg-gray-100"
                                />
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="profile-photo-input"
                                    className="hidden"
                                    onChange={handleProfilePhotoChange}
                                />
                                <label
                                    htmlFor="profile-photo-input"
                                    className="absolute bottom-2 right-2 p-2 bg-white rounded-lg shadow-md text-gray-600 hover:text-brand-600 transition-colors cursor-pointer"
                                >
                                    <Icons.Camera size={14} />
                                </label>
                            </div>
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    {profile?.name || 'Provider Name'} <Icons.Check size={20} className="text-blue-500 fill-current" />
                                </h1>
                                <p className="text-brand-600 font-medium">{categoryLabel}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Icons.MapPin size={14} /> {profile?.city || 'Location'}</span>
                                    <span className="flex items-center gap-1"><Icons.Star size={14} className="text-yellow-400 fill-current" /> {providerStats?.rating?.toFixed(1) || 'New'} ({providerStats?.review_count || 0} reviews)</span>
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
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter phone number"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-brand-100 focus:border-brand-300 outline-none"
                                />
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

                    {/* Promotions */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">Promotions</h3>
                            <button onClick={() => navigate('/provider/promotions')} className="text-brand-600 text-xs font-bold hover:underline">Manage</button>
                        </div>
                        {activePromotions.length > 0 ? (
                            <div className="space-y-3">
                                {activePromotions.map((promo) => (
                                    <div key={promo.id} className="p-4 bg-gradient-to-br from-brand-50 to-orange-50 rounded-xl border border-brand-100">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-white rounded-lg text-brand-600 shadow-sm">
                                                <Icons.Tag size={18} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-brand-800 uppercase tracking-wide">Active Deal</p>
                                                <p className="font-bold text-gray-900">{promo.promo_code}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-600 mb-3">
                                            {promo.discount_type === 'percentage' ? `${promo.discount_value}% Off` : `$${promo.discount_value} Off`}
                                            {promo.end_at ? ` • Expires ${new Date(promo.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                                        </p>
                                        <button onClick={() => navigate('/provider/promotions')} className="w-full py-2 bg-white text-brand-600 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-400 text-sm">
                                <p>No active promotions</p>
                                <button onClick={() => navigate('/provider/promotions')} className="text-brand-600 text-xs font-bold mt-2 hover:underline">
                                    Create one
                                </button>
                            </div>
                        )}
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
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                id="portfolio-input"
                                className="hidden"
                                onChange={handlePortfolioAdd}
                                disabled={isUploadingPortfolio}
                            />
                            <label
                                htmlFor="portfolio-input"
                                className={`flex items-center gap-2 text-sm font-bold text-brand-600 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100 transition-colors cursor-pointer ${isUploadingPortfolio ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                {isUploadingPortfolio ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Icons.Camera size={16} /> Add Photos
                                    </>
                                )}
                            </label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {portfolioItems.map((item) => (
                                <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden">
                                    <img src={item.media_url} alt={item.title || 'Portfolio'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <button
                                            onClick={() => handlePortfolioRemove(item)}
                                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            <Icons.Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <label
                                htmlFor="portfolio-input"
                                className={`aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50 transition-all cursor-pointer ${isUploadingPortfolio ? 'opacity-50 pointer-events-none' : ''}`}
                            >
                                <Icons.Camera size={24} />
                                <span className="text-xs font-bold mt-2">Add Photo</span>
                            </label>
                        </div>
                    </div>

                    {/* Reviews */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Recent Reviews</h3>
                            <span className="text-sm text-gray-400">{providerReviews.length} review{providerReviews.length !== 1 ? 's' : ''}</span>
                        </div>
                        {providerReviews.length > 0 ? (
                            <div className="space-y-6">
                                {providerReviews.map((review) => (
                                    <div key={review.id} className="border-b border-gray-50 last:border-0 pb-6 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={review.client_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.client_name || 'Client')}&background=f97316&color=fff`}
                                                    alt={review.client_name || 'Client'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm">{review.client_name || 'Client'}</h4>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <div className="flex text-yellow-400">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Icons.Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300"} />
                                                            ))}
                                                        </div>
                                                        <span>• {formatReviewDate(review.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed pl-[52px]">
                                            "{review.comment}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <Icons.Star size={28} className="mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">No reviews yet</p>
                            </div>
                        )}
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
