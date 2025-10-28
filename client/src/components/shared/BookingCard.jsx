import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Skeleton from "../ui/Skeleton";
import "../../styles/ui/bookingCard.css";

function BookingCard({
  booking,
  provider,
  service,
  onCancel,
  onReview,
  loading = false,
}) {
  if (loading) {
    return (
      <Card className="booking-card">
        <Skeleton height={18} width="40%" />
        <Skeleton height={16} width="80%" />
        <Skeleton height={14} width="60%" />
      </Card>
    );
  }

  if (!booking) return null;

  const statusVariant = {
    upcoming: "success",
    completed: "default",
    cancelled: "danger",
    draft: "warning",
  }[booking.status] || "default";

  return (
    <Card className="booking-card">
      <div className="booking-card__header">
        <div>
          <h3 className="booking-card__title">{service?.name || "Service"}</h3>
          <p className="booking-card__provider">
            With {provider?.name || "Provider"} ·{" "}
            {new Date(booking.scheduledAt).toLocaleString()}
          </p>
        </div>
        <Badge variant={statusVariant}>{booking.status}</Badge>
      </div>
      <div className="booking-card__details">
        <span>{booking.location}</span>
        {booking.notes ? <span>Notes: {booking.notes}</span> : null}
        {booking.price ? (
          <span>Price: ${(booking.price / 100).toFixed(2)}</span>
        ) : null}
      </div>
      <div className="booking-card__actions">
        {booking.status === "upcoming" ? (
          <Button variant="ghost" onClick={() => onCancel?.(booking)}>
            Cancel booking
          </Button>
        ) : null}
        {booking.status === "completed" ? (
          <Button variant="secondary" onClick={() => onReview?.(booking)}>
            Leave a review
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

export default BookingCard;
