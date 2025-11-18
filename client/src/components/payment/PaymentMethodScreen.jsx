import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaymentMethodFormWrapper from "./PaymentMethodForm";
import { useSession } from "../../auth/authContext";
import { useToast } from "../ui/ToastProvider";
import Button from "../ui/Button";
import "../../styles/paymentMethodPage.css";

function PaymentMethodScreen({ onBack, onSuccess }) {
  const { session, updateProfile } = useSession();
  const toast = useToast();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSetupIntent() {
      if (!session?.user?.id || !session?.user?.email) {
        setError("You need to be signed in to add a payment method.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";
        const response = await fetch(`${apiUrl}/api/client/setup-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create setup intent");
        }

        const { clientSecret: secret } = await response.json();
        setClientSecret(secret);
      } catch (err) {
        console.error("Payment setup error:", err);
        setError(err.message || "Unable to start payment setup");
        toast.push({
          title: "Payment setup failed",
          description: err.message || "Please try again",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSetupIntent();
  }, [session?.user?.email, session?.user?.id, toast]);

  const handleSuccess = async ({ paymentMethodId }) => {
    try {
      await updateProfile({
        stripePaymentMethodId: paymentMethodId,
        paymentMethodSetupComplete: true,
      });
      toast.push({
        title: "Card saved",
        description: "Your payment method is stored securely.",
        variant: "success",
      });
      onSuccess?.();
      navigate(-1);
    } catch (error) {
      console.error("Error saving payment method to profile:", error);
      toast.push({
        title: "Error saving card",
        description: error?.message || "Card saved to Stripe but could not update your profile.",
        variant: "error",
      });
    }
  };

  return (
    <div className="payment-page">
      <header className="payment-page__header">
        <button
          type="button"
          className="payment-page__back"
          aria-label="Back"
          onClick={onBack || (() => navigate(-1))}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M15 18l-6-6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="payment-page__title">Add Payment Method</h1>
      </header>

      <main className="payment-page__body">
        <div className="payment-page__card">
          {loading && <div className="payment-page__loading">Preparing secure form…</div>}
          {!loading && error && (
            <div className="payment-page__error">
              <p>{error}</p>
              <Button onClick={onBack || (() => navigate(-1))} className="payment-page__retry">
                Go Back
              </Button>
            </div>
          )}
          {!loading && !error && clientSecret && (
            <PaymentMethodFormWrapper
              clientSecret={clientSecret}
              onSuccess={handleSuccess}
              onError={(err) =>
                toast.push({
                  title: "Payment error",
                  description: err?.message || "Could not save your card.",
                  variant: "error",
                })
              }
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default PaymentMethodScreen;
