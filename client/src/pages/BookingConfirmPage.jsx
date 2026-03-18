import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../components/ui/Card";
import { useToast } from "../components/ui/ToastProvider";
import { useSession } from "../auth/authContext";
import useBookings from "../data/useBookings";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import { requestCheckout } from "../data/bookings";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtPrice(cents) {
  if (!cents && cents !== 0) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function fmtDuration(mins) {
  if (!mins) return null;
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

function fmtDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
    if (match) setBooking(match);
  }, [bookings, bookingId]);

  useEffect(() => {
    if (!bookingId && !bookingsLoading) refresh();
  }, [bookingId, bookingsLoading, refresh]);

  // Fetch saved payment methods
  useEffect(() => {
    if (profile?.stripeCustomerId) {
      setLoadingPaymentMethods(true);
      fetch("/api/client/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: profile.stripeCustomerId }),
      })
        .then((res) => res.json())
        .then((data) => {
          setSavedPaymentMethods(data.paymentMethods || []);
          if (data.paymentMethods?.length > 0) {
            setSelectedPaymentMethodId(data.paymentMethods[0].id);
          }
        })
        .catch(() => {
          toast.push({
            title: "Could not load saved payment methods",
            description: "You can still use a new card at checkout",
            variant: "warning",
          });
        })
        .finally(() => setLoadingPaymentMethods(false));
    }
  }, [profile?.stripeCustomerId, toast]);

  const provider = providers.find((p) => p.id === booking?.providerId);
  const service = services.find((s) => s.id === booking?.serviceId);

  const handleCheckout = async () => {
    if (!booking) return;
    setLoadingCheckout(true);
    try {
      const chargeAmount = booking.depositAmount || booking.price;
      const paymentType = booking.depositAmount ? "deposit" : "full payment";

      if (selectedPaymentMethodId && profile?.stripeCustomerId) {
        const chargeResponse = await fetch("/api/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        });

        if (!chargeResponse.ok) {
          const error = await chargeResponse.json();
          throw new Error(error.error || "Payment failed");
        }

        toast.push({
          title: "Payment successful!",
          description: booking.depositAmount
            ? `Deposit of ${fmtPrice(booking.depositAmount)} confirmed.`
            : "Your booking has been confirmed",
          variant: "success",
        });
        setTimeout(() => navigate("/app/bookings"), 2000);
      } else {
        const data = await requestCheckout(booking.id);
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
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

  // ── Derived display values ─────────────────────────────────────────────────
  const providerName =
    provider?.name || booking?.provider_name || "your provider";
  const serviceName =
    service?.name || booking?.service_name || "your service";
  const serviceDuration =
    service?.duration || booking?.duration || null;
  const totalPrice = booking?.price || null;
  const providerId = booking?.provider_id || booking?.providerId;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (bookingsLoading && !booking) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope items-center justify-center px-6">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
        <p className="font-manrope text-[14px] text-muted">Loading booking…</p>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-manrope items-center justify-center px-6 text-center gap-4">
        <p className="font-manrope text-[17px] font-semibold text-foreground">
          Booking not found
        </p>
        <p className="font-manrope text-[14px] text-muted">
          It may have been updated or cancelled.
        </p>
        <button
          onClick={() => navigate("/app")}
          className="mt-2 px-6 py-3 rounded-card font-manrope text-[15px] font-bold text-white focus:outline-none"
          style={{ background: "#0D1619" }}
        >
          Go home
        </button>
      </div>
    );
  }

  // ── Confirmed screen ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-manrope items-center justify-center px-6 text-center">

      {/* Green check circle */}
      <div
        className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-6 flex-shrink-0"
        style={{ background: "#F0FDF4" }}
      >
        <svg
          width="32" height="32" fill="none"
          stroke="#22C55E" strokeWidth="2.5" viewBox="0 0 24 24"
        >
          <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Heading */}
      <h1 className="font-manrope text-[28px] font-bold text-foreground m-0 mb-2">
        You're booked!
      </h1>

      {/* Summary sentence */}
      <p
        className="font-manrope text-[15px] text-muted m-0 mb-8"
        style={{ lineHeight: 1.6 }}
      >
        {serviceName} with {providerName}
        {booking.scheduled_at || booking.scheduledAt
          ? ` · ${fmtDateTime(booking.scheduled_at || booking.scheduledAt)}`
          : ""}
      </p>

      {/* Receipt card */}
      <Card className="w-full text-left mb-3">
        {/* Rows */}
        {[
          ["Service", serviceName],
          serviceDuration ? ["Duration", fmtDuration(serviceDuration)] : null,
          ["Provider", providerName],
        ]
          .filter(Boolean)
          .map(([label, value]) => (
            <div key={label} className="flex justify-between items-center mb-2">
              <span className="font-manrope text-[14px] text-muted">{label}</span>
              <span className="font-manrope text-[14px] font-semibold text-foreground">
                {value}
              </span>
            </div>
          ))}

        {/* Divider */}
        <div
          className="my-3"
          style={{ height: "0.5px", background: "#E5E5EA" }}
        />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-manrope text-[16px] font-bold text-foreground">
            Total
          </span>
          <span className="font-manrope text-[16px] font-bold text-foreground">
            {totalPrice ? fmtPrice(totalPrice) : "Provided after review"}
          </span>
        </div>

        {/* Deposit note */}
        {booking.depositAmount && (
          <p className="font-manrope text-[13px] text-muted m-0 mt-2">
            Deposit: {fmtPrice(booking.depositAmount)} ·{" "}
            Final {fmtPrice(booking.price - booking.depositAmount)} after service
          </p>
        )}
      </Card>

      {/* Payment method selector (if saved cards) */}
      {!loadingPaymentMethods && savedPaymentMethods.length > 0 && (
        <div className="w-full mb-3">
          <p className="font-manrope text-[13px] font-semibold text-foreground text-left mb-2">
            Pay with
          </p>
          <div className="flex flex-col gap-2">
            {savedPaymentMethods.map((method) => {
              const isSelected = selectedPaymentMethodId === method.id;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethodId(method.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-card text-left focus:outline-none transition-colors"
                  style={{
                    background: isSelected ? "#FFF0E6" : "#FFFFFF",
                    border: isSelected ? "1.5px solid #FF751F" : "1px solid #E5E5EA",
                  }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: isSelected ? "#FF751F" : "transparent",
                      border: isSelected ? "none" : "2px solid #D1D5DB",
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="font-manrope text-[14px] font-semibold text-foreground">
                    {method.brand?.toUpperCase()} ···· {method.last4}
                  </span>
                  <span className="font-manrope text-[12px] text-muted ml-auto">
                    {method.expMonth}/{method.expYear}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full flex flex-col gap-2.5 mt-1">
        {/* Primary: pay / message */}
        {totalPrice ? (
          <button
            onClick={handleCheckout}
            disabled={loadingCheckout}
            className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{
              background: loadingCheckout ? "#B0B0B0" : "#0D1619",
              cursor: loadingCheckout ? "not-allowed" : "pointer",
            }}
          >
            {loadingCheckout
              ? "Processing…"
              : booking.depositAmount
              ? `Pay deposit · ${fmtPrice(booking.depositAmount)}`
              : `Pay · ${fmtPrice(totalPrice)}`}
          </button>
        ) : (
          <button
            onClick={() =>
              navigate("/app/messages", { state: { providerId } })
            }
            className="w-full py-4 rounded-card font-manrope text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{ background: "#0D1619" }}
          >
            Message {providerName.split(" ")[0]}
          </button>
        )}

        {/* Secondary: message (if paying) or view relationship */}
        {totalPrice && (
          <button
            onClick={() =>
              navigate("/app/messages", { state: { providerId } })
            }
            className="w-full py-[14px] rounded-card font-manrope text-[16px] font-semibold text-foreground bg-card focus:outline-none active:scale-[0.98] transition-transform"
            style={{ border: "1px solid #E5E5EA" }}
          >
            Message {providerName.split(" ")[0]}
          </button>
        )}

        {/* View relationship */}
        {providerId && (
          <button
            onClick={() => navigate(`/app/relationship/${providerId}`)}
            className="w-full py-[14px] rounded-card font-manrope text-[16px] font-semibold text-foreground bg-card focus:outline-none active:scale-[0.98] transition-transform"
            style={{ border: "1px solid #E5E5EA" }}
          >
            View relationship
          </button>
        )}
      </div>
    </div>
  );
}

export default BookingConfirmPage;
