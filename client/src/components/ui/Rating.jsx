import "../../styles/ui/rating.css";

function Rating({ value = 0, count = 0, size = "md" }) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={`ui-rating ui-rating--${size}`} aria-label={`Rating ${value} out of 5`}>
      {Array.from({ length: fullStars }).map((_, index) => (
        <Star key={`full-${index}`} filled />
      ))}
      {hasHalf ? <Star key="half" half /> : null}
      {Array.from({ length: emptyStars }).map((_, index) => (
        <Star key={`empty-${index}`} />
      ))}
      <span className="ui-rating__count">({count})</span>
    </div>
  );
}

function Star({ filled, half }) {
  if (half) {
    return (
      <svg viewBox="0 0 24 24" className="ui-rating__icon ui-rating__icon--half">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="50%" stopColor="rgba(34,197,94,0.2)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#half)"
          d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="ui-rating__icon">
      <path
        fill={filled ? "#22c55e" : "rgba(34,197,94,0.2)"}
        d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z"
      />
    </svg>
  );
}

export default Rating;
