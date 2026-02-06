import React, { useEffect, useState } from 'react';
import { Icons } from '../../components/Icons';
import { fetchAdminReviews, updateAdminReview } from '../../data/admin';

const AdminReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState('');
    const [visibility, setVisibility] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadReviews = async () => {
        setLoading(true);
        try {
            const data = await fetchAdminReviews({
                rating: rating || undefined,
                is_visible: visibility === '' ? undefined : visibility === 'true',
                page,
                limit: 20
            });
            setReviews(data.reviews || []);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error("Failed to load reviews", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReviews();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleFilter = () => {
        setPage(1);
        loadReviews();
    };

    const handleToggleVisibility = async (reviewId, currentVisibility) => {
        try {
            await updateAdminReview(reviewId, { is_visible: !currentVisibility });
            loadReviews();
        } catch (error) {
            console.error("Failed to update review", error);
        }
    };

    const handleToggleFeatured = async (reviewId, currentFeatured) => {
        try {
            await updateAdminReview(reviewId, { is_featured: !currentFeatured });
            loadReviews();
        } catch (error) {
            console.error("Failed to update review", error);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icons.Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
                <p className="text-gray-500 mt-1">Moderate platform reviews</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
                        <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Visibility</label>
                        <select
                            value={visibility}
                            onChange={(e) => setVisibility(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-100"
                        >
                            <option value="">All</option>
                            <option value="true">Visible</option>
                            <option value="false">Hidden</option>
                        </select>
                    </div>
                    <button
                        onClick={handleFilter}
                        className="px-6 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-100">
                        <Icons.Loader className="w-8 h-8 animate-spin text-brand-500" />
                    </div>
                ) : reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <img
                                            src={review.client_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.client_name || 'C')}&background=random`}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="font-bold text-gray-900">{review.client_name || 'Anonymous'}</p>
                                            <p className="text-xs text-gray-500">
                                                Review for <span className="font-medium">{review.provider_name || 'Provider'}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-3">
                                        {renderStars(review.rating)}
                                        <span className="text-sm text-gray-500">
                                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 text-sm">{review.comment || 'No comment'}</p>

                                    <div className="flex gap-2 mt-3">
                                        {review.is_featured && (
                                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                                Featured
                                            </span>
                                        )}
                                        {review.is_visible === false && (
                                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                Hidden
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex md:flex-col gap-2">
                                    <button
                                        onClick={() => handleToggleVisibility(review.id, review.is_visible !== false)}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            review.is_visible !== false
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                    >
                                        {review.is_visible !== false ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                        onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            review.is_featured
                                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                        }`}
                                    >
                                        {review.is_featured ? 'Unfeature' : 'Feature'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 text-gray-500">
                        <Icons.Star size={32} className="text-gray-300 mb-2" />
                        <p>No reviews found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminReviews;
