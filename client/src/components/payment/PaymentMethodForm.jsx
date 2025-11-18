import { useState } from "react";
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
import "./PaymentMethodForm.css";

const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

// Inner component that uses Stripe hooks
function PaymentForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError(null);

    try {
      const { error, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardNumberElement),
            billing_details: {
              name: cardholderName,
              address: {
                line1: billingAddress,
              },
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        onError?.(error);
      } else if (setupIntent?.status === "succeeded") {
        onSuccess?.({
          paymentMethodId: setupIntent.payment_method,
        });
      }
    } catch (err) {
      setCardError("An error occurred");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  const elementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        backgroundColor: "#ffffff",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        "::placeholder": {
          color: "#9ca3af",
        },
      },
      invalid: {
        color: "#fa755a",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      {/* Card Number */}
      <div className="payment-form__field">
        <label className="payment-form__label">Card Number</label>
        <div className="payment-form__card">
          <CardNumberElement options={elementOptions} />
        </div>
      </div>

      {/* Expiry and CVC Row */}
      <div className="payment-form__row">
        <div className="payment-form__field payment-form__field--half">
          <label className="payment-form__label">Expiry Date</label>
          <div className="payment-form__card">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div className="payment-form__field payment-form__field--half">
          <label className="payment-form__label">CVV</label>
          <div className="payment-form__card">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="payment-form__field">
        <label className="payment-form__label">Cardholder Name</label>
        <input
          type="text"
          className="payment-form__input"
          placeholder="Enter name on card"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      {/* Billing Address */}
      <div className="payment-form__field">
        <label className="payment-form__label">Billing Address</label>
        <input
          type="text"
          className="payment-form__input"
          placeholder="Enter your billing address"
          value={billingAddress}
          onChange={(e) => setBillingAddress(e.target.value)}
          required
        />
      </div>

      {/* Set as Default */}
      <div className="payment-form__checkbox-field">
        <label className="payment-form__checkbox-label">
          <input
            type="checkbox"
            checked={setAsDefault}
            onChange={(e) => setSetAsDefault(e.target.checked)}
            className="payment-form__checkbox"
          />
          Set as default payment method
        </label>
      </div>

      {cardError && (
        <div className="alert alert--error" style={{ marginTop: "1rem" }}>
          {cardError}
        </div>
      )}

      <div className="payment-form__footer">
        <div className="payment-form__security-info">
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: "16px", height: "16px" }}>
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
          </svg>
          <span>Your payment info is stored securely</span>
        </div>

        <Button
          type="submit"
          disabled={!stripe || processing || !cardholderName || !billingAddress}
          loading={processing}
          className="payment-form__button"
        >
          {processing ? "Saving card..." : "Save Payment Method"}
        </Button>
      </div>
    </form>
  );
}

// Wrapper component
export function PaymentMethodFormWrapper({
  clientSecret,
  onSuccess,
  onError,
}) {
  if (!clientSecret) {
    return <div className="alert alert--error">Setup failed</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default PaymentMethodFormWrapper;
