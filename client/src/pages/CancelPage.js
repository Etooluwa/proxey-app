import { Link, useSearchParams } from "react-router-dom";

function CancelPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div className="page page--centered">
      <div className="card card--warning">
        <span className="eyebrow eyebrow--warning">Payment canceled</span>
        <h1 className="card__title">Checkout was canceled</h1>
        <p className="card__support">
          The client returned from Stripe without completing payment. You can
          let them try again, or release the slot for someone else.
        </p>

        {bookingId && (
          <p className="card__meta">
            Booking ID: <code>{bookingId}</code>
          </p>
        )}

        <Link className="button" to="/checkout">
          Try again
        </Link>
      </div>
    </div>
  );
}

export default CancelPage;
