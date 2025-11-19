import { useState, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Button from "../ui/Button";
import "./PaymentMethodPlain.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#0f172a",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      backgroundColor: "transparent",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
  hidePostalCode: true,
};

function InnerForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const cardNumberRef = useRef(null);
  const cardExpiryRef = useRef(null);
  const cardCvcRef = useRef(null);

  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [cardError, setCardError] = useState(null);

  const focusStripeElement = (ref) => {
    requestAnimationFrame(() => ref?.current?.focus?.());
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    // Validate inputs
    if (!cardholderName.trim()) {
      setCardError("Please enter cardholder name");
      return;
    }

    if (!billingAddress.trim()) {
      setCardError("Please enter billing address");
      return;
    }

    setProcessing(true);
    setCardError(null);

    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement),
          billing_details: {
            name: cardholderName,
            address: { line1: billingAddress },
          },
        },
      });

      if (error) {
        setCardError(error.message || "Failed to save card. Please try again.");
        onError?.(error);
        return;
      }

      if (setupIntent?.status === "succeeded") {
        onSuccess?.({
          paymentMethodId: setupIntent.payment_method,
          setAsDefault,
        });
      }
    } catch (err) {
      console.error("Payment setup error:", err);
      setCardError("An error occurred. Please try again.");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form className="plain-payment-form" onSubmit={submit}>
      {/* Card Number */}
      <div>
        <label className="plain-label">Card Number</label>
        <div
          className="plain-field"
          onClick={() => focusStripeElement(cardNumberRef)}
          role="group"
          aria-label="Card number input"
        >
          <CardNumberElement
            options={elementOptions}
            onReady={(el) => {
              cardNumberRef.current = el;
            }}
          />
          <svg className="plain-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
            <rect x="3" y="9" width="18" height="2" />
            <rect x="6" y="13" width="5" height="2" rx="0.5" />
          </svg>
        </div>
      </div>

      {/* Expiry and CVV Row */}
      <div className="plain-row">
        <div className="plain-col">
          <label className="plain-label">Expiry Date</label>
          <div
            className="plain-field"
            onClick={() => focusStripeElement(cardExpiryRef)}
            role="group"
            aria-label="Expiry date input"
          >
            <CardExpiryElement
              options={elementOptions}
              onReady={(el) => {
                cardExpiryRef.current = el;
              }}
            />
            <svg className="plain-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="4" y="6" width="16" height="14" rx="2" />
              <path d="M9 3v3M15 3v3M4 11h16" />
            </svg>
          </div>
        </div>
        <div className="plain-col">
          <label className="plain-label">CVV</label>
          <div
            className="plain-field"
            onClick={() => focusStripeElement(cardCvcRef)}
            role="group"
            aria-label="CVV input"
          >
            <CardCvcElement
              options={elementOptions}
              onReady={(el) => {
                cardCvcRef.current = el;
              }}
            />
            <svg className="plain-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="7.5" r="0.8" />
              <path d="M12 11.5V17" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cardholder Name */}
      <div>
        <label className="plain-label" htmlFor="name">Cardholder Name</label>
        <input
          id="name"
          className="plain-input"
          placeholder="Enter name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      {/* Billing Address */}
      <div>
        <label className="plain-label" htmlFor="address">Billing Address</label>
        <input
          id="address"
          className="plain-input"
          placeholder="Enter your billing address"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          required
        />
      </div>

      {/* Set as Default Checkbox */}
      <label className="plain-checkbox">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
        />
        Set as default payment method
      </label>

      {/* Error Message */}
      {cardError && (
        <div className="plain-error">
          <svg viewBox="0 0 24 24" fill="currentColor" className="plain-error-icon">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          {cardError}
        </div>
      )}

      {/* Security Badge */}
      <div className="plain-secure">
        <svg viewBox="0 0 24 24" fill="currentColor" className="plain-secure-icon">
          <path d="M12 3 5 6v6c0 4.225 2.95 8.175 7 9 4.05-.825 7-4.775 7-9V6l-7-3z" />
          <path d="M10.5 12.5 12 14l3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Your payment info is stored securely
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing || !cardholderName.trim() || !billingAddress.trim()}
        loading={processing}
        className="plain-submit"
      >
        {processing ? "Saving card..." : "Save Payment Method"}
      </Button>
    </form>
  );
}

export default function PaymentMethodPlain({ clientSecret, onSuccess, onError }) {
  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise}>
      <InnerForm clientSecret={clientSecret} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
