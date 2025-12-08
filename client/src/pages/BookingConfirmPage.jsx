import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/ToastProvider";
import { useSession } from "../auth/authContext";
import useBookings from "../data/useBookings";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import { requestCheckout } from "../data/bookings";
import "../styles/bookingConfirm.css";

function BookingConfirmPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile } = useSession();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const { bookings, loading: bookingsLoading, refresh } = useBookings();
  const { providers } = useProviders();
  const { services } = useServices();
  const [booking, setBooking] = useState(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

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

  // Fetch saved payment methods when component loads
  useEffect(() => {
    if (profile?.stripeCustomerId) {
      setLoadingPaymentMethods(true);
      fetch("http://localhost:3001/api/client/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: profile.stripeCustomerId,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setSavedPaymentMethods(data.paymentMethods || []);
          // Auto-select first payment method if available
          if (data.paymentMethods && data.paymentMethods.length > 0) {
            setSelectedPaymentMethodId(data.paymentMethods[0].id);
          }
        })
        .catch((err) => {
          console.error("Error fetching payment methods:", err);
          toast.push({
            title: "Could not load saved payment methods",
            description: "You can still use a new card at checkout",
            variant: "warning",
          });
        })
        .finally(() => setLoadingPaymentMethods(false));
    }
  }, [profile?.stripeCustomerId, toast]);

  const provider = providers.find((item) => item.id === booking?.providerId);
  const service = services.find((item) => item.id === booking?.serviceId);

  const handleCheckout = async () => {
    if (!booking) return;
    setLoadingCheckout(true);
    try {
      // Determine amount to charge: deposit if required, otherwise full price
      const chargeAmount = booking.depositAmount || booking.price;
      const paymentType = booking.depositAmount ? "deposit" : "full payment";

      // If user has a saved payment method selected, use it
      if (selectedPaymentMethodId && profile?.stripeCustomerId) {
        const chargeResponse = await fetch(
          "http://localhost:3001/api/charge",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: chargeAmount,
              paymentMethodId: selectedPaymentMethodId,
              customerId: profile.stripeCustomerId,
              bookingId: booking.id,
              providerId: booking.providerId,
              paymentType,
              depositAmount: booking.depositAmount,
              finalAmount: booking.finalAmount,
            }),
          }
        );

        if (!chargeResponse.ok) {
          const error = await chargeResponse.json();
          throw new Error(error.error || "Payment failed");
        }

        const chargeData = await chargeResponse.json();

        toast.push({
          title: "Payment successful!",
          description: booking.depositAmount
            ? `Deposit of $${(booking.depositAmount / 100).toFixed(2)} confirmed. Final payment due after service.`
            : "Your booking has been confirmed",
          variant: "success",
        });

        // Navigate to bookings page after a short delay
        setTimeout(() => {
          navigate("/app/bookings");
        }, 2000);
      } else {
        // Fall back to Stripe Checkout (new card)
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
                {booking.price ? (
                  <div>
                    <p style={{ margin: 0 }}>Total: ${(booking.price / 100).toFixed(2)}</p>
                    {booking.depositAmount && booking.depositPercentage && (
                      <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#666" }}>
                        <p style={{ margin: "0.25rem 0" }}>
                          Deposit ({booking.depositPercentage}%): ${(booking.depositAmount / 100).toFixed(2)}
                        </p>
                        <p style={{ margin: "0.25rem 0" }}>
                          Final payment: ${((booking.price - booking.depositAmount) / 100).toFixed(2)} after service
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  "Provided after provider review"
                )}
              </dd>
            </div>
          </dl>

          {/* Payment Method Selector */}
          {!loadingPaymentMethods && savedPaymentMethods.length > 0 && (
            <div
              style={{
                marginTop: "2rem",
                paddingTop: "2rem",
                borderTop: "1px solid #e0e0e0",
              }}
            >
              <h3 style={{ marginBottom: "1rem", fontSize: "16px", fontWeight: "600" }}>
                Select Payment Method
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {savedPaymentMethods.map((method) => (
                  <label
                    key={method.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "0.75rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "6px",
                      cursor: "pointer",
                      backgroundColor:
                        selectedPaymentMethodId === method.id
                          ? "#f5f5f5"
                          : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={method.id}
                      checked={selectedPaymentMethodId === method.id}
                      onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ flex: 1 }}>
                      <strong>{method.brand.toUpperCase()}</strong> ending in{" "}
                      {method.last4}
                      <br />
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        Expires {method.expMonth}/{method.expYear}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <p style={{ marginTop: "0.75rem", fontSize: "12px", color: "#999" }}>
                Or proceed to checkout to use a new card
              </p>
            </div>
          )}

          <div className="booking-confirm__actions">
            <Button variant="secondary" onClick={() => navigate("/app/bookings")}>
              Go to my bookings
            </Button>
            <Button onClick={handleCheckout} loading={loadingCheckout}>
              {booking?.depositAmount
                ? `Pay deposit: $${(booking.depositAmount / 100).toFixed(2)}`
                : "Proceed to checkout"}
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
