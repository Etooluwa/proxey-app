import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Card from "../components/ui/Card";
import SavedPaymentMethodList from "../components/payment/SavedPaymentMethodList";
import { useToast } from "../components/ui/ToastProvider";
import useBookings from "../data/useBookings";
import useProviders from "../data/useProviders";
import useServices from "../data/useServices";
import { requestCheckout } from "../data/bookings";
import { request } from "../data/apiClient";
import { formatMoney } from "../utils/formatMoney";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "");
const T = {
  ink: "#3D231E",
  muted: "#8C6A64",
  faded: "#B0948F",
  accent: "#C25E4A",
  line: "rgba(140,106,100,0.18)",
  card: "#FFFFFF",
  avatarBg: "#F2EBE5",
  danger: "#B04040",
};
const F = "'Sora', system-ui, sans-serif";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtPrice = (cents, currency = 'cad') => (cents == null ? "—" : formatMoney(cents, currency));

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

function normalizePaymentErrorMessage(error) {
  const rawMessage = String(error?.message || "");
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("provider payout account is not ready yet") ||
    normalized.includes("provider has not connected stripe yet")
  ) {
    return "This provider has not finished Stripe payout setup yet. Try again later or message them directly.";
  }

  return rawMessage || "Unable to start payment.";
}

function AddCardForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError(null);
    setSaving(true);

    try {
      const { clientSecret } = await request("/payments/setup-intent", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const cardElement = elements.getElement(CardElement);
      const { error: stripeErr, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (stripeErr) {
        setError(stripeErr.message);
        return;
      }

      if (setupIntent.status === "succeeded") {
        onSuccess?.(setupIntent.payment_method);
      }
    } catch (err) {
      setError(err.message || "Failed to save card.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, background: T.card, borderRadius: 16, border: `1px solid ${T.line}` }}>
      <p style={{
        fontFamily: F,
        fontSize: 11,
        fontWeight: 600,
        color: T.muted,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        margin: "0 0 12px",
      }}>
        Add a new card
      </p>

      <div style={{
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${T.line}`,
        background: T.avatarBg,
        marginBottom: 14,
      }}>
        <CardElement
          options={{
            style: {
              base: {
                fontFamily: F,
                fontSize: "14px",
                color: T.ink,
                "::placeholder": { color: T.faded },
              },
              invalid: { color: T.danger },
            },
            hidePostalCode: false,
          }}
        />
      </div>

      {error && (
        <p style={{ fontFamily: F, fontSize: 13, color: T.danger, margin: "0 0 12px" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !stripe}
          style={{
            flex: 1,
            padding: "13px 0",
            borderRadius: 12,
            border: "none",
            background: saving ? T.faded : T.ink,
            color: "#fff",
            fontFamily: F,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save and use this card"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: "13px 18px",
            borderRadius: 12,
            border: `1px solid ${T.line}`,
            background: "transparent",
            color: T.muted,
            fontFamily: F,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    const match = bookings.find((item) => item.id === bookingId);
    if (match) setBooking(match);
  }, [bookings, bookingId]);

  useEffect(() => {
    if (!bookingId && !bookingsLoading) refresh();
  }, [bookingId, bookingsLoading, refresh]);

  const loadPaymentMethods = useCallback(() => {
    setLoadingPaymentMethods(true);
    request('/payments/methods')
      .then((data) => {
        const methods = data?.paymentMethods || [];
        setSavedPaymentMethods(methods);
        setSelectedPaymentMethodId((currentSelection) => {
          if (methods.some((method) => method.id === currentSelection)) return currentSelection;
          const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
          return defaultMethod?.id || null;
        });
      })
      .catch(() => {})
      .finally(() => setLoadingPaymentMethods(false));
  }, []);

  useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const provider = providers.find((p) => p.id === booking?.providerId);
  const service = services.find((s) => s.id === booking?.serviceId);

  const handleCheckout = async () => {
    if (!booking) return;
    setLoadingCheckout(true);
    try {
      const chargeAmount = booking.depositAmount || booking.price;

      if (selectedPaymentMethodId) {
        await request('/charge', {
          method: 'POST',
          body: JSON.stringify({
            amount: chargeAmount,
            paymentMethodId: selectedPaymentMethodId,
            bookingId: booking.id,
            providerId: booking.providerId,
          }),
        });

        toast.push({
          title: "Payment successful!",
          description: booking.depositAmount
            ? `Deposit of ${fmtPrice(booking.depositAmount, booking?.currency)} confirmed.`
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
        description: normalizePaymentErrorMessage(error),
        variant: "error",
      });
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleCardAdded = async (paymentMethodId) => {
    setShowAddCard(false);
    setSelectedPaymentMethodId(paymentMethodId);
    await loadPaymentMethods();
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
      <div className="flex flex-col min-h-screen bg-background font-sora items-center justify-center px-6">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
        <p className="font-sora text-[14px] text-muted">Loading booking…</p>
      </div>
    );
  }

  // ── Not found state ────────────────────────────────────────────────────────
  if (!booking) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-sora items-center justify-center px-6 text-center gap-4">
        <p className="font-sora text-[17px] font-semibold text-foreground">
          Booking not found
        </p>
        <p className="font-sora text-[14px] text-muted">
          It may have been updated or cancelled.
        </p>
        <button
          onClick={() => navigate("/app")}
          className="mt-2 px-6 py-3 rounded-card font-sora text-[15px] font-bold text-white focus:outline-none"
          style={{ background: "#3D231E" }}
        >
          Go home
        </button>
      </div>
    );
  }

  // ── Confirmed screen ───────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-background font-sora items-center justify-center px-6 text-center">

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
      <h1 className="font-sora text-[28px] font-bold text-foreground m-0 mb-2">
        You're booked!
      </h1>

      {/* Summary sentence */}
      <p
        className="font-sora text-[15px] text-muted m-0 mb-8"
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
              <span className="font-sora text-[14px] text-muted">{label}</span>
              <span className="font-sora text-[14px] font-semibold text-foreground">
                {value}
              </span>
            </div>
          ))}

        {/* Divider */}
        <div
          className="my-3"
          style={{ height: "0.5px", background: "rgba(140,106,100,0.2)" }}
        />

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="font-sora text-[16px] font-bold text-foreground">
            Total
          </span>
          <span className="font-sora text-[16px] font-bold text-foreground">
            {totalPrice ? fmtPrice(totalPrice, booking?.currency) : "Provided after review"}
          </span>
        </div>

        {/* Deposit note */}
        {booking.depositAmount && (
          <p className="font-sora text-[13px] text-muted m-0 mt-2">
            Deposit: {fmtPrice(booking.depositAmount, booking?.currency)} ·{" "}
            Final {fmtPrice(booking.price - booking.depositAmount, booking?.currency)} after service
          </p>
        )}
      </Card>

      {!loadingPaymentMethods && savedPaymentMethods.length > 0 && (
        <SavedPaymentMethodList
          paymentMethods={savedPaymentMethods}
          selectedPaymentMethodId={selectedPaymentMethodId}
          onSelect={setSelectedPaymentMethodId}
          title="Pay with"
        />
      )}

      {!showAddCard ? (
        <button
          type="button"
          onClick={() => setShowAddCard(true)}
          className="w-full mb-3"
          style={{
            padding: "15px 16px",
            borderRadius: 16,
            border: `1px dashed ${T.line}`,
            background: "transparent",
            color: T.accent,
            fontFamily: F,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add a new card
        </button>
      ) : (
        <div className="w-full mb-3">
          <Elements stripe={stripePromise}>
            <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowAddCard(false)} />
          </Elements>
        </div>
      )}

      {/* Action buttons */}
      <div className="w-full flex flex-col gap-2.5 mt-1">
        {/* Primary: pay / message */}
        {totalPrice ? (
          <button
            onClick={handleCheckout}
            disabled={loadingCheckout}
            className="w-full py-4 rounded-card font-sora text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{
              background: loadingCheckout ? "#B0B0B0" : "#3D231E",
              cursor: loadingCheckout ? "not-allowed" : "pointer",
            }}
          >
            {loadingCheckout
              ? "Processing…"
              : booking.depositAmount
              ? `Pay deposit · ${fmtPrice(booking.depositAmount, booking?.currency)}`
              : `Pay · ${fmtPrice(totalPrice, booking?.currency)}`}
          </button>
        ) : (
          <button
            onClick={() =>
              navigate("/app/messages", { state: { providerId } })
            }
            className="w-full py-4 rounded-card font-sora text-[16px] font-bold text-white focus:outline-none active:scale-[0.98] transition-transform"
            style={{ background: "#3D231E" }}
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
            className="w-full py-[14px] rounded-card font-sora text-[16px] font-semibold text-foreground bg-card focus:outline-none active:scale-[0.98] transition-transform"
            style={{ border: "1px solid rgba(140,106,100,0.2)" }}
          >
            Message {providerName.split(" ")[0]}
          </button>
        )}

        {/* View relationship */}
        {providerId && (
          <button
            onClick={() => navigate(`/app/relationship/${providerId}`)}
            className="w-full py-[14px] rounded-card font-sora text-[16px] font-semibold text-foreground bg-card focus:outline-none active:scale-[0.98] transition-transform"
            style={{ border: "1px solid rgba(140,106,100,0.2)" }}
          >
            View relationship
          </button>
        )}
      </div>
    </div>
  );
}

export default BookingConfirmPage;
