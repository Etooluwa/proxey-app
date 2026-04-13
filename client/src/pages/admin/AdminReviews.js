import React, { useEffect, useState } from 'react';
import { Star } from '@phosphor-icons/react';
import { fetchAdminReviews, updateAdminReview } from '../../data/admin';

const INK = '#3D231E';
const MUTED = '#8C6A64';
const FADED = '#B0948F';
const ACCENT = '#C25E4A';
const LINE = 'rgba(140,106,100,0.2)';
const AVATAR_BG = '#F2EBE5';

const inputStyle = {
  border: `1px solid ${LINE}`,
  background: '#FBF7F2',
  color: INK,
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '13px',
  outline: 'none',
  fontFamily: 'Sora, sans-serif',
};

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={13}
        weight={star <= rating ? 'fill' : 'regular'}
        style={{ color: star <= rating ? '#eab308' : LINE }}
      />
    ))}
  </div>
);

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
        limit: 20,
      });
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilter = () => { setPage(1); loadReviews(); };

  const handleToggleVisibility = async (id, current) => {
    try {
      await updateAdminReview(id, { is_visible: !current });
      loadReviews();
    } catch (err) {
      console.error('Failed to update review', err);
    }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await updateAdminReview(id, { is_featured: !current });
      loadReviews();
    } catch (err) {
      console.error('Failed to update review', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: INK, letterSpacing: '-0.03em' }}>Reviews</h1>
        <p className="text-sm mt-1" style={{ color: MUTED }}>Moderate platform reviews</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: FADED }}>Rating</p>
          <select value={rating} onChange={(e) => setRating(e.target.value)} style={inputStyle}>
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest font-medium mb-1.5" style={{ color: FADED }}>Visibility</p>
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={inputStyle}>
            <option value="">All</option>
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="text-sm font-medium px-5 py-2 rounded-xl"
          style={{ background: INK, color: '#fff' }}
        >
          Apply
        </button>
      </div>

      {/* Reviews list */}
      <div className="space-y-0">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: LINE, borderTopColor: ACCENT }} />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review, i) => (
            <div
              key={review.id}
              className="py-5 flex flex-col md:flex-row md:items-start gap-4"
              style={{ borderBottom: `1px solid ${LINE}` }}
            >
              <div className="flex-1 min-w-0">
                {/* Reviewer */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: ACCENT }}
                  >
                    {(review.client_name || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: INK }}>{review.client_name || 'Anonymous'}</p>
                    <p className="text-xs" style={{ color: FADED }}>
                      for <span style={{ color: MUTED }}>{review.provider_name || 'Provider'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <StarRating rating={review.rating} />
                  <span className="text-xs" style={{ color: FADED }}>
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}
                  </span>
                </div>

                <p className="text-sm" style={{ color: MUTED }}>{review.comment || 'No comment'}</p>

                <div className="flex gap-2 mt-2 flex-wrap">
                  {review.is_featured && (
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#F0EBF8', color: '#7C4DA8' }}
                    >
                      Featured
                    </span>
                  )}
                  {review.is_visible === false && (
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: '#FDEDEA', color: '#A04030' }}
                    >
                      Hidden
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 flex-shrink-0">
                <button
                  onClick={() => handleToggleVisibility(review.id, review.is_visible !== false)}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                  style={{
                    background: review.is_visible !== false ? '#FDEDEA' : '#EBF2EC',
                    color: review.is_visible !== false ? '#A04030' : '#5A8A5E',
                  }}
                >
                  {review.is_visible !== false ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => handleToggleFeatured(review.id, review.is_featured)}
                  className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                  style={{
                    background: review.is_featured ? AVATAR_BG : '#F0EBF8',
                    color: review.is_featured ? MUTED : '#7C4DA8',
                  }}
                >
                  {review.is_featured ? 'Unfeature' : 'Feature'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div
            className="flex items-center justify-center py-16 rounded-xl"
            style={{ border: `1px dashed ${LINE}` }}
          >
            <p className="text-sm" style={{ color: MUTED }}>No reviews found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
            style={{ background: AVATAR_BG, color: INK }}
          >
            Previous
          </button>
          <span className="text-xs" style={{ color: MUTED }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs font-medium px-4 py-2 rounded-xl disabled:opacity-40"
            style={{ background: AVATAR_BG, color: INK }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
