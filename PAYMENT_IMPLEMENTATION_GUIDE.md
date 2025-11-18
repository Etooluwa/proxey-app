# Payment Implementation Guide

This guide walks you through implementing payments for Proxey:
- **Clients**: Save credit/debit cards during onboarding → use them for bookings
- **Providers**: Connect bank accounts during onboarding → receive payouts automatically

---

## Part 1: Client Payments (Save Cards)

### Overview
Clients will save their payment method during onboarding (Step 3) using Stripe Payment Methods API, then use it to pay for bookings without entering card details again.

### Step 1: Update Server to Create Payment Methods

In `server/server.js`, add these endpoints:

```javascript
// POST /api/client/setup-intent
// Creates a SetupIntent for client to save their card
app.post("/api/client/setup-intent", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId required" });
  }

  try {
    // Create or retrieve Stripe customer for this user
    const customers = await stripe.customers.list({
      email: req.body.email, // Include email if available
      limit: 1,
    });

    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
          userType: "client",
        },
      });
      customerId = customer.id;

      // Store customer ID in Supabase
      if (supabase) {
        await supabase.auth.updateUser({
          data: {
            stripe_customer_id: customerId,
          },
        }, {
          headers: {
            Authorization: `Bearer ${req.headers.authorization}`,
          },
        });
      }
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "on_session", // Allow future payments
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
// Retrieve all payment methods for a customer
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
// Remove a saved payment method
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
```

### Step 2: Create Client Payment Methods Component

Create `client/src/components/provider/PaymentMethodForm.jsx`:

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

function PaymentMethodForm({ clientSecret, onSuccess, onError }) {
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [saveCard, setSaveCard] = useState(true);

  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);
    setCardError(null);

    try {
      // Confirm setup intent with card details
      const { error, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              // Add billing details if available
            },
          },
        }
      );

      if (error) {
        setCardError(error.message);
        onError?.(error);
      } else if (setupIntent && setupIntent.status === "succeeded") {
        // Card saved successfully
        onSuccess?.({
          paymentMethodId: setupIntent.payment_method,
          setupIntentId: setupIntent.id,
        });
      }
    } catch (err) {
      setCardError("An unexpected error occurred");
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-form__card-element">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#fa755a",
              },
            },
          }}
        />
      </div>

      {cardError && (
        <div className="alert alert--error" role="alert">
          {cardError}
        </div>
      )}

      <label className="checkbox">
        <input
          type="checkbox"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
        />
        <span>Save this card for future bookings</span>
      </label>

      <Button
        type="submit"
        disabled={!stripe || processing}
        loading={processing}
        className="button--full"
      >
        {processing ? "Saving card..." : "Add Payment Method"}
      </Button>
    </form>
  );
}

export function PaymentMethodFormWrapper({ clientSecret, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodForm
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default PaymentMethodForm;
```

### Step 3: Add Payment Method Step to Client Onboarding

Update `client/src/pages/OnboardingPage.jsx` Step 3:

```javascript
// In the step 3 handler, add:
case 3: {
  // Step 3: Payment Method
  const setupIntentResponse = await fetch(
    "http://localhost:3001/api/client/setup-intent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
      }),
    }
  );

  if (!setupIntentResponse.ok) {
    throw new Error("Failed to create setup intent");
  }

  const { clientSecret, customerId } = await setupIntentResponse.json();

  // Save to profile
  await updateProfile({
    stripeCustomerId: customerId,
    paymentMethodSetupComplete: true,
  });

  setForm((prev) => ({
    ...prev,
    stripeClientSecret: clientSecret,
  }));
  break;
}
```

---

## Part 2: Provider Payouts (Bank Account Connection)

### Overview
Providers will connect their bank accounts using Stripe Connect during onboarding (Step 5), and receive automatic payouts after each booking.

### Step 1: Update Server for Stripe Connect

Add to `server/server.js`:

```javascript
// POST /api/provider/connected-account
// Create a Connected Account for provider
app.post("/api/provider/connected-account", async (req, res) => {
  const { userId, email, businessName } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: "userId and email required" });
  }

  try {
    // Create connected account
    const account = await stripe.accounts.create({
      type: "express", // Express account: Stripe handles verification
      country: "CA", // Change to your country
      email: email,
      business_type: "individual", // or "sole_proprietor"
      individual: {
        email: email,
      },
      business_profile: {
        name: businessName || email,
        support_email: email,
        url: "https://proxey.app", // Your website
      },
      metadata: {
        userId: userId,
        userType: "provider",
      },
    });

    // Store account ID in Supabase
    if (supabase) {
      await supabase.auth.updateUser({
        data: {
          stripe_account_id: account.id,
        },
      }, {
        headers: {
          Authorization: `Bearer ${req.headers.authorization}`,
        },
      });
    }

    res.json({
      accountId: account.id,
    });
  } catch (error) {
    console.error("Connected account error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/provider/onboarding-link
// Generate onboarding link for provider to complete Stripe setup
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
// Check provider's Stripe account status
app.get("/api/provider/account/:accountId", async (req, res) => {
  const { accountId } = req.params;

  try {
    const account = await stripe.accounts.retrieve(accountId);

    res.json({
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      requirements: account.requirements,
    });
  } catch (error) {
    console.error("Account retrieval error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update the webhook to handle payouts after payment
// In your /webhook endpoint, after confirming payment:

app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "charge.succeeded") {
    const charge = event.data.object;
    const bookingId = charge.metadata?.bookingId;
    const providerId = charge.metadata?.providerId;
    const stripeAccountId = charge.metadata?.stripeAccountId;

    // Transfer 80% of the amount to provider (you keep 20%)
    const transferAmount = Math.round(charge.amount * 0.8);

    if (providerId && stripeAccountId && transferAmount > 0) {
      try {
        await stripe.transfers.create({
          amount: transferAmount,
          currency: charge.currency,
          destination: stripeAccountId,
          metadata: {
            bookingId: bookingId,
            providerId: providerId,
          },
        });

        console.log(`Transfer of ${transferAmount} created for provider ${providerId}`);
      } catch (error) {
        console.error("Transfer error:", error);
      }
    }
  }

  res.json({ received: true });
});
```

### Step 2: Update Booking Checkout to Include Provider Info

Update the checkout session creation in `server/server.js`:

```javascript
// Existing /api/checkout-session endpoint - update it:
app.post("/api/checkout-session", async (req, res) => {
  const { bookingId, providerId, serviceId, amount } = req.body;

  // Retrieve provider's Stripe account ID
  let providerAccount = null;
  if (providerId) {
    // Query your database or Supabase to get provider's Stripe account ID
    // This is an example - adjust to your setup
    if (supabase) {
      const { data } = await supabase
        .from("provider_profiles") // Or your table name
        .select("stripe_account_id")
        .eq("user_id", providerId)
        .single();
      providerAccount = data?.stripe_account_id;
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.body.clientEmail,
    line_items: [
      {
        price_data: {
          currency: "cad",
          product_data: {
            name: req.body.serviceName || "Service",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: `${req.body.successUrl}?bookingId=${bookingId}`,
    cancel_url: req.body.cancelUrl,
    metadata: {
      bookingId,
      providerId,
      serviceId,
      stripeAccountId: providerAccount, // Include provider's account
    },
  });

  res.json({ sessionId: session.id });
});
```

### Step 3: Add Bank Account Connection to Provider Onboarding

Update `client/src/pages/ProviderOnboardingPage.jsx` Step 5:

```javascript
// In step 5 handler:
case 5: {
  // Step 5: Connect Stripe Account
  const accountResponse = await fetch(
    "http://localhost:3001/api/provider/connected-account",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        businessName: profile?.businessName || profile?.name,
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
        returnUrl: `${window.location.origin}/provider/onboarding?step=5&success=true`,
      }),
    }
  );

  const { onboardingLink } = await linkResponse.json();

  // Open in new window
  window.open(onboardingLink, "_blank");

  // Save account ID to profile
  await updateProfile({
    stripeAccountId: accountId,
    bankConnectionComplete: true,
  });

  break;
}
```

---

## Part 3: Update Booking Payment to Use Saved Method

### Update Checkout Page

Modify `client/src/pages/BookingConfirmPage.jsx`:

```javascript
// Add this to fetch saved payment methods:
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
        setPaymentMethods(data.paymentMethods || []);
      });
  }
}, [profile?.stripeCustomerId]);

// Update checkout creation to use saved method:
const handleConfirmBooking = async () => {
  // If using saved payment method:
  if (selectedPaymentMethodId) {
    const paymentResponse = await fetch(
      "http://localhost:3001/api/charge",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          amount: totalPrice,
          paymentMethodId: selectedPaymentMethodId,
          customerId: profile.stripeCustomerId,
          bookingId,
          providerId,
        }),
      }
    );
    // Handle response
  } else {
    // Fall back to Checkout (new card)
    // ... existing code
  }
};
```

Add the charge endpoint to `server/server.js`:

```javascript
// POST /api/charge
// Charge an existing payment method
app.post("/api/charge", async (req, res) => {
  const { amount, paymentMethodId, customerId, bookingId, providerId } = req.body;

  try {
    const charge = await stripe.charges.create({
      amount,
      currency: "cad",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true, // Charge without cardholder present
      confirm: true,
      metadata: {
        bookingId,
        providerId,
      },
    });

    res.json({
      chargeId: charge.id,
      status: charge.status,
    });
  } catch (error) {
    console.error("Charge error:", error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Environment Variables Required

Add to `server/.env`:

```env
STRIPE_SECRET_KEY=sk_test_... # From Stripe Dashboard
STRIPE_WEBHOOK_SECRET=whsec_... # From Stripe Dashboard Webhooks
SUPABASE_URL=... # Your Supabase URL
SUPABASE_SERVICE_ROLE_KEY=... # Your service role key
```

Add to `client/.env`:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_... # From Stripe Dashboard
```

---

## Testing Checklist

- [ ] Client can add payment method during onboarding Step 3
- [ ] Saved cards appear in checkout
- [ ] Charging with saved card completes booking
- [ ] Provider can connect Stripe account during Step 5
- [ ] After payment, provider receives transfer to their bank
- [ ] Payout appears in provider's bank account (1-2 days)

---

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Test with real card (Stripe test card: 4242 4242 4242 4242)
- [ ] Set payout schedule in Stripe Dashboard
- [ ] Add error handling for failed transfers
- [ ] Implement refund logic if booking cancelled
- [ ] Add KYC verification for providers (Stripe handles this)
- [ ] Set your platform fee percentage (currently 20%)
- [ ] Monitor disputes and chargebacks
