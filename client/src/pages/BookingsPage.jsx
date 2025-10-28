import { useState } from "react";
import BookingCard from "../components/shared/BookingCard";
import EmptyState from "../components/shared/EmptyState";
import Modal from "../components/ui/Modal";
import useBookings from "../data/useBookings";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import { useToast } from "../components/ui/ToastProvider";
import "../styles/bookings.css";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
];

function BookingsPage() {
  const { upcoming, past, loading, error, empty, cancel, refresh } = useBookings();
  const { providers } = useProviders();
  const { services } = useServices();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [loadingCancel, setLoadingCancel] = useState(false);

  const list = activeTab === "upcoming" ? upcoming : past;

  const mapBooking = (booking) => ({
    provider: providers.find((provider) => provider.id === booking.providerId),
    service: services.find((service) => service.id === booking.serviceId),
  });

  const handleCancel = async () => {
    if (!bookingToCancel) return;
    setLoadingCancel(true);
    try {
      await cancel(bookingToCancel.id);
      setBookingToCancel(null);
      refresh();
    } catch (error) {
      toast.push({
        title: "Cancellation failed",
        description: error.message,
        variant: "error",
      });
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleReview = (booking) => {
    toast.push({
      title: "Reviews coming soon",
      description: "Leaving reviews will be available after the next release.",
      variant: "info",
    });
  };

  return (
    <div className="bookings">
      <header className="bookings__header">
        <h1 className="bookings__title">My bookings</h1>
        <p className="bookings__subtitle">
          Keep track of upcoming and past services. Cancel or reschedule when plans change.
        </p>
      </header>

      <div className="tabbed-section">
        <div className="tabbed-section__tabs" role="tablist" aria-label="Booking filters">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tabbed-section__button ${
                activeTab === tab.id ? "tabbed-section__button--active" : ""
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <section aria-live="polite">
          {loading ? (
            <div className="bookings__list">
              {Array.from({ length: 2 }).map((_, index) => (
                <BookingCard key={index} loading />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              title="Unable to load bookings"
              description="We couldn’t reach the bookings service. Try again in a moment."
              actionLabel="Retry"
              onAction={refresh}
            />
          ) : empty ? (
            <EmptyState
              title="No bookings yet"
              description="Once you confirm a booking you’ll see it here. Start with a new request."
              actionLabel="Book a service"
              onAction={() => window.location.assign("/app/book")}
            />
          ) : (
            <div className="bookings__list">
              {list.map((booking) => {
                const { provider, service } = mapBooking(booking);
                return (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    provider={provider}
                    service={service}
                    onCancel={(item) => setBookingToCancel(item)}
                    onReview={handleReview}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>

      <Modal
        title="Cancel booking?"
        description="We’ll notify your provider and release the time slot. A cancellation policy may apply."
        open={Boolean(bookingToCancel)}
        onClose={() => setBookingToCancel(null)}
        confirmLabel="Yes, cancel"
        confirmVariant="danger"
        loading={loadingCancel}
        onConfirm={handleCancel}
      />
    </div>
  );
}

export default BookingsPage;
