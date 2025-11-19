// Ultra-minimal Stripe card form to avoid any CSS/pointer interference
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import Button from "../ui/Button";
import "./SimpleCardForm.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#0f172a",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

function SimpleForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [cardError, setCardError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
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
        setCardError(error.message);
        onError?.(error);
        return;
      }
      if (setupIntent?.status === "succeeded") {
        onSuccess?.({ paymentMethodId: setupIntent.payment_method });
      }
    } catch (err) {
      setCardError("An error occurred");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form className="simple-card-form" onSubmit={handleSubmit}>
      <label className="simple-label">Card Number</label>
      <div className="simple-stripe-field">
        <CardNumberElement options={elementOptions} />
      </div>

      <div className="simple-row">
        <div className="simple-col">
          <label className="simple-label">Expiry Date</label>
          <div className="simple-stripe-field">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div className="simple-col">
          <label className="simple-label">CVC</label>
          <div className="simple-stripe-field">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      <label className="simple-label" htmlFor="cardholder">Cardholder Name</label>
      <input
        id="cardholder"
        className="simple-input"
        placeholder="Enter name on card"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        required
      />

      <label className="simple-label" htmlFor="billing">Billing Address</label>
      <input
        id="billing"
        className="simple-input"
        placeholder="Enter your billing address"
        value={billingAddress}
        onChange={(e) => setBillingAddress(e.target.value)}
        required
      />

      {cardError && <div className="simple-error">{cardError}</div>}

      <div className="simple-secure">🔒 Your payment info is stored securely</div>

      <Button
        type="submit"
        disabled={!stripe || processing}
        loading={processing}
        className="simple-submit"
      >
        {processing ? "Saving card..." : "Save Payment Method"}
      </Button>
    </form>
  );
}

export default function SimpleCardForm({ clientSecret, onSuccess, onError }) {
  if (!clientSecret) return null;
  return (
    <Elements stripe={stripePromise}>
      <SimpleForm clientSecret={clientSecret} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
