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
import "./PaymentMethodPlain.css";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const elementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#111827",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      backgroundColor: "white",
      "::placeholder": { color: "#9ca3af" },
    },
    invalid: { color: "#dc2626" },
  },
};

function InnerForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [cardError, setCardError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
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
        onSuccess?.({
          paymentMethodId: setupIntent.payment_method,
          setAsDefault,
        });
      }
    } catch (err) {
      setCardError("An error occurred");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form className="plain-payment-form" onSubmit={submit}>
      <label className="plain-label">Card Number</label>
      <div className="plain-field">
        <CardNumberElement options={elementOptions} />
      </div>

      <div className="plain-row">
        <div className="plain-col">
          <label className="plain-label">Expiry Date</label>
          <div className="plain-field">
            <CardExpiryElement options={elementOptions} />
          </div>
        </div>
        <div className="plain-col">
          <label className="plain-label">CVC</label>
          <div className="plain-field">
            <CardCvcElement options={elementOptions} />
          </div>
        </div>
      </div>

      <label className="plain-label" htmlFor="name">Cardholder Name</label>
      <input
        id="name"
        className="plain-input"
        placeholder="Enter name on card"
        value={cardholderName}
        onChange={(e) => setCardholderName(e.target.value)}
        required
      />

      <label className="plain-label" htmlFor="address">Billing Address</label>
      <input
        id="address"
        className="plain-input"
        placeholder="Enter your billing address"
        value={billingAddress}
        onChange={(e) => setBillingAddress(e.target.value)}
        required
      />

      <label className="plain-checkbox">
        <input
          type="checkbox"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
        />
        Set as default payment method
      </label>

      {cardError && <div className="plain-error">{cardError}</div>}

      <div className="plain-secure">🔒 Your payment info is stored securely</div>

      <Button
        type="submit"
        disabled={!stripe || processing}
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
