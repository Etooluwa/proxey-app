import { useState } from "react";
import "../../styles/ui/reviewModal.css";
import Button from "./Button";

function ReviewModal({
  open,
  onClose,
  onSubmit,
  booking,
  loading = false,
}) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (rating === 0) return;
    onSubmit({ rating, comment });
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    onClose();
  };

  const displayRating = hoverRating || rating;

  const getRatingLabel = (value) => {
    switch (value) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  return (
    <div className="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
      <div className="review-modal__backdrop" onClick={handleClose} aria-hidden="true" />
      <div className="review-modal__content">
        <div className="review-modal__header">
          <h2 id="review-modal-title" className="review-modal__title">
            Leave a Review
          </h2>
          <button
            className="review-modal__close"
            onClick={handleClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {booking && (
          <div className="review-modal__booking-info">
            <p className="review-modal__service">{booking.service_name || "Service"}</p>
            <p className="review-modal__provider">with {booking.provider_name || "Provider"}</p>
          </div>
        )}

        <div className="review-modal__body">
          <div className="review-modal__rating-section">
            <label className="review-modal__label">How was your experience?</label>
            <div className="review-modal__stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`review-modal__star ${
                    star <= displayRating ? "review-modal__star--filled" : ""
                  }`}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <svg viewBox="0 0 24 24" className="review-modal__star-icon">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="review-modal__rating-label">{getRatingLabel(displayRating)}</p>
          </div>

          <div className="review-modal__comment-section">
            <label htmlFor="review-comment" className="review-modal__label">
              Share your experience (optional)
            </label>
            <textarea
              id="review-comment"
              className="review-modal__textarea"
              placeholder="Tell others about your experience with this provider..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="review-modal__char-count">{comment.length}/500</p>
          </div>
        </div>

        <div className="review-modal__actions">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={rating === 0}
          >
            Submit Review
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;
