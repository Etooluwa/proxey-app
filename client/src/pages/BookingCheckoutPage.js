import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { initiateCheckout } from "../utils/stripe";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function BookingCheckoutPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);

  useEffect(() => {
    const prefillId = process.env.REACT_APP_DEMO_BOOKING_ID;
    if (prefillId) {
      setBookingId(prefillId);
    }
  }, []);

  const handleLoadBooking = async () => {
    const trimmedId = bookingId.trim();
    if (!trimmedId) {
      setFetchError("Enter a booking ID to load details.");
      return;
    }

    setFetchError("");
    setActiveBooking(null);
    setIsLoadingBooking(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${trimmedId}`
      );

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "Failed to load booking.");
      }

      const { booking } = await response.json();
      setActiveBooking(booking);
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setIsLoadingBooking(false);
    }
  };

  const handleCheckout = async () => {
    if (!activeBooking) {
      setCheckoutError("Load a booking before starting checkout.");
      return;
    }

    const {
      serviceName,
      amount,
      currency,
      bookingId: normalizedBookingId,
      providerId,
      customerEmail,
    } = activeBooking;

    setCheckoutError("");
    setIsProcessing(true);
    try {
      await initiateCheckout({
        serviceName,
        amount,
        currency,
        bookingId: normalizedBookingId,
        providerId,
        customerEmail,
      });
    } catch (err) {
      setCheckoutError(err.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="page page--centered">
      <div className="card">
        <div className="card__header">
          <Link className="link link--muted" to="/auth/sign-in">
            ← Back to login
          </Link>
        </div>
        <span className="eyebrow">Collect payment</span>
        <h1 className="card__title">Start Stripe Checkout</h1>
        <p className="card__support">
          Load a booking from Supabase, review the price, then redirect the
          client to Stripe Checkout for payment.
        </p>

        <div className="form">
          <form
            className="form__body"
            onSubmit={(event) => {
              event.preventDefault();
              handleLoadBooking();
            }}
          >
            <label className="form__label" htmlFor="booking-id">
              Booking ID
            </label>
            <div className="form__row">
              <input
                id="booking-id"
                className="input"
                placeholder="e.g. booking-123"
                value={bookingId}
                disabled={isLoadingBooking || isProcessing}
                onChange={(event) => setBookingId(event.target.value)}
              />
              <button
                type="submit"
                className="button button--ghost"
                disabled={isLoadingBooking || isProcessing}
              >
                {isLoadingBooking ? "Loading..." : "Load"}
              </button>
            </div>
          </form>
        </div>

        {fetchError && <div className="alert alert--error">{fetchError}</div>}

        {activeBooking && (
          <div className="summary">
            <div className="summary__row">
              <span className="summary__label">Service</span>
              <span className="summary__value">{activeBooking.serviceName}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Amount due</span>
              <span className="summary__value">
                {formatter.format((activeBooking.amount || 0) / 100)}
              </span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Booking</span>
              <span className="summary__value">{activeBooking.bookingId}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Provider</span>
              <span className="summary__value">
                {activeBooking.providerId || "—"}
              </span>
            </div>
            {activeBooking.customerEmail && (
              <div className="summary__row">
                <span className="summary__label">Client email</span>
                <span className="summary__value">
                  {activeBooking.customerEmail}
                </span>
              </div>
            )}
            <div className="summary__row">
              <span className="summary__label">Status</span>
              <span className="summary__badge">{activeBooking.status}</span>
            </div>
          </div>
        )}

        {checkoutError && (
          <div className="alert alert--error">{checkoutError}</div>
        )}

        <div className="callout">
          <p className="callout__text">
            Need a booking ID? Trigger your booking flow to create a row in
            Supabase first.
          </p>
        </div>

        <button
          className="button"
          onClick={handleCheckout}
          disabled={isProcessing || !activeBooking}
        >
          {isProcessing ? "Redirecting to Checkout..." : "Pay with Stripe"}
        </button>

        <p className="card__hint">
          Checkout metadata now uses the booking and provider IDs fetched from
          Supabase. Swap the layout for your dashboard or booking page UI.
        </p>
      </div>
    </div>
  );
}

export default BookingCheckoutPage;
