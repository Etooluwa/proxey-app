# Payment Implementation - Code Ready to Copy & Paste

This file contains all the code you need. Just copy and paste into your files!

---

## 1. Server Setup - Add to `server/server.js`

### Client Payment Methods Endpoints

```javascript
// POST /api/client/setup-intent
// Creates a SetupIntent for client to save their card
app.post("/api/client/setup-intent", async (req, res) => {
  const { userId, email } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      limit: 100,
    });

    let customerId;
    const existingCustomer = customers.data.find(
      (c) => c.metadata?.userId === userId
    );

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const customer = await stripe.customers.create({
        email: email,
        metadata: {
          userId: userId,
          userType: "client",
        },
      });
      customerId = customer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "on_session",
    });

    res.json({
      clientSecret: setupIntent.client_secret,
      customerId: customerId,
    });
  } catch (error) {
    console.error("Setup intent error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/client/payment-methods
app.post("/api/client/payment-methods", async (req, res) => {
  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: "customerId required" });
  }

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      })),
    });
  } catch (error) {
    console.error("Payment methods error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/client/payment-methods/:paymentMethodId
app.delete("/api/client/payment-methods/:paymentMethodId", async (req, res) => {
  const { paymentMethodId } = req.params;

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.json({ success: true });
  } catch (error) {
    console.error("Payment method deletion error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/charge
// Charge an existing payment method
app.post("/api/charge", async (req, res) => {
  const { amount, paymentMethodId, customerId, bookingId, providerId } = req.body;

  if (!amount || !paymentMethodId || !customerId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const charge = await stripe.charges.create({
      amount: Math.round(amount), // Convert to cents
      currency: "cad",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        bookingId: bookingId || "unknown",
        providerId: providerId || "unknown",
      },
    });

    res.json({
      chargeId: charge.id,
      status: charge.status,
      amount: charge.amount,
    });
  } catch (error) {
    console.error("Charge error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### Provider Stripe Connect Endpoints

```javascript
// POST /api/provider/connected-account
// Create a Connected Account for provider
app.post("/api/provider/connected-account", async (req, res) => {
  const { userId, email, businessName } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "userId and email required" });
  }

  try {
    const account = await stripe.accounts.create({
      type: "express",
      country: "CA",
      email: email,
      business_type: "individual",
      individual: {
        email: email,
      },
      business_profile: {
        name: businessName || email,
        support_email: email,
        url: "https://proxey.app",
      },
      metadata: {
        userId: userId,
        userType: "provider",
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    res.json({
      accountId: account.id,
    });
  } catch (error) {
    console.error("Connected account error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/provider/onboarding-link
app.post("/api/provider/onboarding-link", async (req, res) => {
  const { accountId, refreshUrl, returnUrl } = req.body;

  if (!accountId) {
    return res.status(400).json({ error: "accountId required" });
  }

  try {
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: refreshUrl,
      return_url: returnUrl,
    });

    res.json({
      onboardingLink: link.url,
    });
  } catch (error) {
    console.error("Onboarding link error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/provider/account/:accountId
app.get("/api/provider/account/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements || {},
    });
  } catch (error) {
    console.error("Account retrieval error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

### Update Webhook for Transfers

```javascript
// Update your existing /webhook endpoint to handle transfers
// Find the "charge.succeeded" section and add this:

if (event.type === "charge.succeeded") {
  const charge = event.data.object;
  const bookingId = charge.metadata?.bookingId;
  const providerId = charge.metadata?.providerId;

  // Get provider's Stripe account ID from your database
  // This is an example - adjust to your setup
  let stripeAccountId = null;
  if (providerId) {
    try {
      // Example: fetch from Supabase
      if (supabase) {
        const { data, error } = await supabase
          .from("users") // Your users table
          .select("stripe_account_id")
          .eq("id", providerId)
          .single();

        if (!error && data) {
          stripeAccountId = data.stripe_account_id;
        }
      }
    } catch (err) {
      console.error("Error fetching provider account:", err);
    }
  }

  // Create transfer to provider (80% of charge)
  if (stripeAccountId && charge.amount > 0) {
    const transferAmount = Math.round(charge.amount * 0.8);

    try {
      await stripe.transfers.create({
        amount: transferAmount,
        currency: charge.currency,
        destination: stripeAccountId,
        source_transaction: charge.id,
        metadata: {
          bookingId: bookingId,
          providerId: providerId,
        },
      });

      console.log(
        `Transfer of ${transferAmount} (${charge.currency}) created for provider ${providerId}`
      );
    } catch (error) {
      console.error("Transfer error:", error);
    }
  }
}
```

---

## 2. Create PaymentMethodForm Component

Create file: `client/src/components/payment/PaymentMethodForm.jsx`

```javascript
import { useState } from "react";
import { loadStripe } from "@stripe/js";
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
```

Create file: `client/src/components/payment/PaymentMethodForm.css`

```css
.payment-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payment-form__card {
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  font-size: 14px;
}

.alert--error {
  background-color: #fee;
  color: #c00;
  border: 1px solid #fcc;
}
```

---

## 3. Update Client Onboarding - Step 3

In `client/src/pages/OnboardingPage.jsx`, find the Step 3 section and update it:

```javascript
import { PaymentMethodFormWrapper } from "../components/payment/PaymentMethodForm";

// In your state, add:
const [paymentStep, setPaymentStep] = useState(0); // 0: not started, 1: form shown, 2: complete

// In your step handlers (around line 80-100), find the step 3 handler:
case 3: {
  if (paymentStep === 0) {
    // Initialize payment method setup
    setPaymentStep(1); // Show form

    try {
      const response = await fetch(
        "http://localhost:3001/api/client/setup-intent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to create setup intent");

      const { clientSecret, customerId } = await response.json();

      setForm((prev) => ({
        ...prev,
        stripeClientSecret: clientSecret,
        stripeCustomerId: customerId,
      }));
    } catch (error) {
      console.error("Payment setup error:", error);
      toast.push({
        title: "Payment setup failed",
        description: error.message,
        variant: "error",
      });
      setPaymentStep(0);
    }
  } else if (paymentStep === 2) {
    // Payment method saved, proceed
    try {
      await updateProfile({
        stripeCustomerId: form.stripeCustomerId,
        paymentMethodSetupComplete: true,
      });

      setCurrentStep(4); // Go to next step
    } catch (error) {
      console.error("Profile update error:", error);
    }
  }
  break;
}

// In your JSX, update the Step 3 content:
{currentStep === 3 && (
  <div className="onboarding-step">
    <h2>Save a Payment Method</h2>
    <p>Add a card to make bookings faster in the future.</p>

    {paymentStep === 1 && form.stripeClientSecret && (
      <PaymentMethodFormWrapper
        clientSecret={form.stripeClientSecret}
        onSuccess={async (result) => {
          toast.push({
            title: "Card saved",
            description: "Your payment method is ready to use",
            variant: "success",
          });
          setPaymentStep(2);
          // Auto-continue after 2 seconds
          setTimeout(() => setCurrentStep(4), 2000);
        }}
        onError={(error) => {
          console.error("Payment error:", error);
          toast.push({
            title: "Payment error",
            description: error?.message || "Failed to save card",
            variant: "error",
          });
        }}
      />
    )}

    {paymentStep === 0 && (
      <Button onClick={() => handleNext()} className="button--full">
        Add Payment Method
      </Button>
    )}
  </div>
)}
```

---

## 4. Update Provider Onboarding - Step 5

In `client/src/pages/ProviderOnboardingPage.jsx`, update Step 5:

```javascript
// In your step handlers, find or create the step 5 handler:
case 5: {
  // Step 5: Connect Stripe Account
  setSubmitting(true);
  try {
    // Create connected account
    const accountResponse = await fetch(
      "http://localhost:3001/api/provider/connected-account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          businessName: profile?.name,
        }),
      }
    );

    if (!accountResponse.ok) {
      throw new Error("Failed to create Stripe account");
    }

    const { accountId } = await accountResponse.json();

    // Get onboarding link
    const linkResponse = await fetch(
      "http://localhost:3001/api/provider/onboarding-link",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          refreshUrl: `${window.location.origin}/provider/onboarding?step=5`,
          returnUrl: `${window.location.origin}/provider/onboarding?completed=true`,
        }),
      }
    );

    const { onboardingLink } = await linkResponse.json();

    // Save account ID
    await updateProfile({
      stripeAccountId: accountId,
    });

    // Open Stripe onboarding
    window.location.href = onboardingLink;
  } catch (error) {
    console.error("Bank setup error:", error);
    toast.push({
      title: "Setup failed",
      description: error.message,
      variant: "error",
    });
  } finally {
    setSubmitting(false);
  }
  break;
}

// In your JSX for Step 5:
{currentStep === 5 && (
  <div className="onboarding-step">
    <h2>Connect Your Bank Account</h2>
    <p>We'll deposit your earnings here. Stripe handles your account securely.</p>

    <Button
      onClick={() => handleNext()}
      className="button--full"
      loading={submitting}
    >
      Connect Bank Account
    </Button>

    <p className="text-muted" style={{ marginTop: "1rem", fontSize: "14px" }}>
      You'll be redirected to Stripe to complete your profile securely.
    </p>
  </div>
)}
```

---

## 5. Update Checkout to Use Saved Cards

In `client/src/pages/BookingConfirmPage.jsx`, add this:

```javascript
const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState(null);

// Fetch saved payment methods when component loads
useEffect(() => {
  if (profile?.stripeCustomerId) {
    fetch("http://localhost:3001/api/client/payment-methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: profile.stripeCustomerId,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSavedPaymentMethods(data.paymentMethods || []);
      })
      .catch((err) => console.error("Error fetching payment methods:", err));
  }
}, [profile?.stripeCustomerId]);

// Update your payment handler:
const handlePayment = async () => {
  if (selectedPaymentMethodId) {
    // Use saved payment method
    try {
      const response = await fetch("http://localhost:3001/api/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice * 100, // Convert to cents
          paymentMethodId: selectedPaymentMethodId,
          customerId: profile.stripeCustomerId,
          bookingId: bookingId,
          providerId: selectedProvider?.id,
        }),
      });

      if (!response.ok) throw new Error("Payment failed");

      const { chargeId } = await response.json();

      toast.push({
        title: "Payment successful",
        description: "Your booking is confirmed",
        variant: "success",
      });

      navigate("/app/bookings");
    } catch (error) {
      toast.push({
        title: "Payment failed",
        description: error.message,
        variant: "error",
      });
    }
  } else {
    // Use Stripe Checkout (new card) - existing code
    // ... your existing checkout code
  }
};

// Add to your JSX (before the pay button):
{savedPaymentMethods.length > 0 && (
  <div className="card" style={{ marginBottom: "2rem" }}>
    <h3>Saved Payment Methods</h3>
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {savedPaymentMethods.map((method) => (
        <label key={method.id} style={{ display: "flex", gap: "1rem" }}>
          <input
            type="radio"
            name="payment-method"
            value={method.id}
            checked={selectedPaymentMethodId === method.id}
            onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
          />
          <span>
            {method.brand.toUpperCase()} ending in {method.last4}
            {method.expMonth}/{method.expYear}
          </span>
        </label>
      ))}
    </div>
  </div>
)}
```

---

## 6. Environment Variables

Add to `server/.env`:
```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
SUPABASE_URL=YOUR_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

Add to `client/.env`:
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

---

## Installation Requirements

Make sure you have these packages installed:

```bash
# Server
npm install stripe

# Client
npm install @stripe/stripe-js @stripe/react-stripe-js
```

---

## Testing Flow

1. **Client Payment Method**
   - Go to onboarding Step 3
   - Use test card: `4242 4242 4242 4242`
   - Any future date, any CVC
   - Click "Save Payment Method"
   - Check your Stripe dashboard - card should appear

2. **Provider Bank Account**
   - Go to onboarding Step 5
   - Click "Connect Bank Account"
   - You'll go to Stripe form
   - Use test bank account (Stripe will show it)
   - Complete the form
   - Come back to your app

3. **Make a Payment**
   - Create a booking
   - At checkout, select saved card
   - Complete payment
   - Check Stripe dashboard - transfer should appear
