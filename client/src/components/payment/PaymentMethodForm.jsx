import { useMemo, useRef, useState } from "react";
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

const SvgIcon = ({ name }) => {
  const paths = useMemo(
    () => ({
      card: (
        <>
          <rect x="3" y="6" width="18" height="12" rx="2" ry="2" />
          <rect x="3" y="9" width="18" height="2" />
          <rect x="6" y="13" width="5" height="2" rx="0.5" />
        </>
      ),
      calendar: (
        <>
          <rect x="4" y="6" width="16" height="14" rx="2" />
          <path d="M9 3v3M15 3v3M4 11h16" />
        </>
      ),
      lock: (
        <>
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V8a4 4 0 1 1 8 0v2" />
          <circle cx="12" cy="15" r="1.25" />
        </>
      ),
      info: (
        <>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="7.5" r="0.8" />
          <path d="M12 11.5V17" />
        </>
      ),
      user: (
        <>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </>
      ),
      home: (
        <>
          <path d="M4 12.5 12 5l8 7.5" />
          <path d="M6 11.5V19h12v-7.5" />
        </>
      ),
      shield: (
        <>
          <path d="M12 3 5 6v6c0 4.225 2.95 8.175 7 9 4.05-.825 7-4.775 7-9V6l-7-3z" />
          <path d="M10.5 12.5 12 14l3-3" />
        </>
      ),
    }),
    []
  );

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="payment-form__svg-icon"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
};

// Inner component that uses Stripe hooks
function PaymentForm({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const cardNumberRef = useRef(null);
  const cardExpiryRef = useRef(null);
  const cardCvcRef = useRef(null);
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

  const focusStripeElement = (ref) => {
    // Defer to ensure the iframe is ready to receive focus
    requestAnimationFrame(() => ref?.current?.focus());
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
        <div className="payment-form__label-row">
          <SvgIcon name="card" />
          <span className="payment-form__label">Card Number</span>
        </div>
        <div
          className="payment-form__card payment-form__card--with-icon"
          role="group"
          aria-label="Card number"
          onClick={() => focusStripeElement(cardNumberRef)}
          onFocus={() => focusStripeElement(cardNumberRef)}
          style={{ cursor: "text" }}
        >
          <div className="payment-form__stripe-field">
            <CardNumberElement
              options={elementOptions}
              onReady={(el) => {
                cardNumberRef.current = el;
              }}
            />
          </div>
          <span className="payment-form__input-icon" aria-hidden="true">
            <SvgIcon name="card" />
          </span>
        </div>
      </div>

      {/* Expiry and CVC Row */}
      <div className="payment-form__row">
        <div className="payment-form__field payment-form__field--half">
          <div className="payment-form__label-row">
            <SvgIcon name="calendar" />
            <span className="payment-form__label">Expiry Date</span>
          </div>
          <div
            className="payment-form__card payment-form__card--with-icon"
            role="group"
            aria-label="Expiry date"
            onClick={() => focusStripeElement(cardExpiryRef)}
            onFocus={() => focusStripeElement(cardExpiryRef)}
            style={{ cursor: "text" }}
          >
            <div className="payment-form__stripe-field">
              <CardExpiryElement
                options={elementOptions}
                onReady={(el) => {
                  cardExpiryRef.current = el;
                }}
              />
            </div>
            <span className="payment-form__input-icon" aria-hidden="true">
              <SvgIcon name="calendar" />
            </span>
          </div>
        </div>
        <div className="payment-form__field payment-form__field--half">
          <div className="payment-form__label-row">
            <SvgIcon name="lock" />
            <span className="payment-form__label">CVV</span>
          </div>
          <div
            className="payment-form__card payment-form__card--with-icon"
            role="group"
            aria-label="CVC"
            onClick={() => focusStripeElement(cardCvcRef)}
            onFocus={() => focusStripeElement(cardCvcRef)}
            style={{ cursor: "text" }}
          >
            <div className="payment-form__stripe-field">
              <CardCvcElement
                options={elementOptions}
                onReady={(el) => {
                  cardCvcRef.current = el;
                }}
              />
            </div>
            <span className="payment-form__input-icon" aria-hidden="true">
              <SvgIcon name="info" />
            </span>
          </div>
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="payment-form__field">
        <div className="payment-form__label-row">
          <SvgIcon name="user" />
          <label className="payment-form__label" htmlFor="cardholder-name">
            Cardholder Name
          </label>
        </div>
        <div className="payment-form__input-wrapper">
          <input
            id="cardholder-name"
            type="text"
            className="payment-form__input"
            placeholder="Enter name on card"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Billing Address */}
      <div className="payment-form__field">
        <div className="payment-form__label-row">
          <SvgIcon name="home" />
          <label className="payment-form__label" htmlFor="billing-address">
            Billing Address
          </label>
        </div>
        <div className="payment-form__input-wrapper">
          <input
            id="billing-address"
            type="text"
            className="payment-form__input"
            placeholder="Enter your billing address"
            value={billingAddress}
            onChange={(e) => setBillingAddress(e.target.value)}
            required
          />
        </div>
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
          <SvgIcon name="shield" />
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
