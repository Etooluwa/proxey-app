import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
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
            card: elements.getElement(CardElement),
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

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-form__card">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
              },
            },
          }}
        />
      </div>

      {cardError && (
        <div className="alert alert--error" style={{ marginTop: "1rem" }}>
          {cardError}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || processing}
        loading={processing}
        className="button--full"
        style={{ marginTop: "1rem" }}
      >
        {processing ? "Saving card..." : "Save Payment Method"}
      </Button>
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
