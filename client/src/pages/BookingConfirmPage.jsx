import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import useBookings from "../data/useBookings";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import { requestCheckout } from "../data/bookings";
import "../styles/bookingConfirm.css";

function BookingConfirmPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { bookings, loading: bookingsLoading, refresh } = useBookings();
  const { providers } = useProviders();
  const { services } = useServices();
  const [booking, setBooking] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    const match = bookings.find((item) => item.id === bookingId);
    if (match) {
      setBooking(match);
    }
  }, [bookings, bookingId]);

  useEffect(() => {
    if (!bookingId && !bookingsLoading) {
      refresh();
    }
  }, [bookingId, bookingsLoading, refresh]);

  const provider = providers.find((item) => item.id === booking?.providerId);
  const service = services.find((item) => item.id === booking?.serviceId);

  const handleCheckout = async () => {
    if (!booking) return;
    setLoadingCheckout(true);
    try {
      const data = await requestCheckout(booking.id);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.sessionId) {
        toast.push({
          title: "Checkout session ready",
          description: "Redirecting to Stripe…",
          variant: "info",
        });
      } else {
        throw new Error("Checkout session not available.");
      }
    } catch (error) {
      toast.push({
        title: "Unable to start payment",
        description: error.message,
        variant: "error",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <div className="booking-confirm">
      <header className="booking-confirm__header">
        <h1 className="booking-confirm__title">Booking confirmed</h1>
        <p className="booking-confirm__subtitle">
          We’ve emailed a copy of your booking details and notified your provider.
        </p>
      </header>

      {bookingsLoading && !booking ? (
        <Card>
          <Skeleton height={24} width="50%" />
          <Skeleton height={16} width="80%" />
          <Skeleton height={14} width="65%" />
        </Card>
      ) : booking ? (
        <Card className="booking-confirm__card">
          <dl className="booking-confirm__details">
            <div>
              <dt>Service</dt>
              <dd>{service?.name || "Service"}</dd>
            </div>
            <div>
              <dt>Provider</dt>
              <dd>{provider?.name || booking.providerId}</dd>
            </div>
            <div>
              <dt>Date & time</dt>
              <dd>{new Date(booking.scheduledAt).toLocaleString()}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{booking.location}</dd>
            </div>
            <div>
              <dt>Notes</dt>
              <dd>{booking.notes || "—"}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd>
                {booking.price
                  ? `$${(booking.price / 100).toFixed(2)}`
                  : "Provided after provider review"}
              </dd>
            </div>
          </dl>
          <div className="booking-confirm__actions">
            <Button variant="secondary" onClick={() => navigate("/app/bookings")}>
              Go to my bookings
            </Button>
            <Button onClick={handleCheckout} loading={loadingCheckout}>
              Proceed to checkout
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <h3 className="card__title">We couldn’t find that booking</h3>
          <p className="card__support">
            It may have been updated or cancelled. Check your bookings list or start again.
          </p>
          <Button onClick={() => navigate("/app/book")}>Start new booking</Button>
        </Card>
      )}
    </div>
  );
}

export default BookingConfirmPage;
