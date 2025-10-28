import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function SuccessPage() {
  const [searchParams] = useSearchParams();
  const [bookingSummary, setBookingSummary] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("latestBookingSummary");
    if (stored) {
      try {
        setBookingSummary(JSON.parse(stored));
      } catch (error) {
        console.warn("[success] Failed to parse booking summary", error);
      }
    }
  }, []);

  const sessionId = searchParams.get("session_id");

  return (
    <div className="page page--centered">
      <div className="card card--success">
        <span className="eyebrow eyebrow--success">Payment confirmed</span>
        <h1 className="card__title">Thanks for your payment!</h1>
        <p className="card__support">
          Stripe completed the charge and our webhook will mark the booking as
          paid inside Supabase.
        </p>

        {bookingSummary ? (
          <div className="summary">
            <div className="summary__row">
              <span className="summary__label">Service</span>
              <span className="summary__value">
                {bookingSummary.serviceName}
              </span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Amount</span>
              <span className="summary__value">
                {formatter.format(bookingSummary.amount / 100)}
              </span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Booking ID</span>
              <span className="summary__value">{bookingSummary.bookingId}</span>
            </div>
            <div className="summary__row">
              <span className="summary__label">Provider ID</span>
              <span className="summary__value">
                {bookingSummary.providerId}
              </span>
            </div>
            {bookingSummary.customerEmail && (
              <div className="summary__row">
                <span className="summary__label">Client email</span>
                <span className="summary__value">
                  {bookingSummary.customerEmail}
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="card__hint">
            Refreshing or opening this page directly will skip the local
            booking summary. Fetch details from your API if needed.
          </p>
        )}

        {sessionId && (
          <p className="card__meta">
            Checkout session: <code>{sessionId}</code>
          </p>
        )}

        <Link className="button button--ghost" to="/checkout">
          Back to bookings
        </Link>
      </div>
    </div>
  );
}

export default SuccessPage;
