import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import Button from "../ui/Button";
import { useSession } from "../../auth/authContext";
import { useToast } from "../ui/ToastProvider";
import "./SimpleCardForm.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Form content component
function CardFormContent({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system not ready");
      return;
    }

    // Basic validation
    if (!cardholderName.trim()) {
      setError("Cardholder name is required");
      return;
    }

    if (!billingAddress.trim()) {
      setError("Billing address is required");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);

      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
              address: {
                line1: billingAddress,
              },
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError);
      } else if (setupIntent?.status === "succeeded") {
        onSuccess?.({
          paymentMethodId: setupIntent.payment_method,
        });
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An error occurred while processing your card");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="simple-card-form">
      <div className="simple-card-form__header">
        <h2>Add Your Card</h2>
        <p>Your payment information is secure and encrypted</p>
      </div>

      <div className="simple-card-form__body">
        {/* Card Element */}
        <div className="simple-card-form__field">
          <label className="simple-card-form__label">Card Details</label>
          <div className="simple-card-form__card-element">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#0f172a",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    "::placeholder": {
                      color: "#9ca3af",
                    },
                  },
                  invalid: {
                    color: "#dc2626",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Cardholder Name */}
        <div className="simple-card-form__field">
          <label htmlFor="name" className="simple-card-form__label">
            Cardholder Name
          </label>
          <input
            id="name"
            type="text"
            className="simple-card-form__input"
            placeholder="John Doe"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
          />
        </div>

        {/* Billing Address */}
        <div className="simple-card-form__field">
          <label htmlFor="address" className="simple-card-form__label">
            Billing Address
          </label>
          <input
            id="address"
            type="text"
            className="simple-card-form__input"
            placeholder="123 Main Street, City, State 12345"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="simple-card-form__error">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {error}
          </div>
        )}
      </div>

      <div className="simple-card-form__footer">
        <Button
          type="submit"
          disabled={!stripe || processing || !cardholderName.trim() || !billingAddress.trim()}
          loading={processing}
          className="simple-card-form__submit"
        >
          {processing ? "Saving..." : "Save Card"}
        </Button>
        <p className="simple-card-form__secure-note">
          🔒 Your card is secure and encrypted by Stripe
        </p>
      </div>
    </form>
  );
}

// Wrapper component with Stripe Elements provider
function SimpleCardForm({ clientSecret, onSuccess, onError }) {
  if (!clientSecret) {
    return <div className="simple-card-form__loading">Loading payment form...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CardFormContent
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default SimpleCardForm;
