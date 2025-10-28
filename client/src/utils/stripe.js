import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export async function initiateCheckout({
  serviceName,
  amount,
  currency = "usd",
  bookingId,
  providerId,
  customerEmail,
  successUrl,
  cancelUrl,
}) {
  if (!serviceName || !amount) {
    throw new Error("serviceName and amount are required.");
  }

  const normalizedAmount = Number.isInteger(amount)
    ? amount
    : Math.round(Number(amount));

  if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
    throw new Error("Amount must be provided in the currency's smallest unit.");
  }

  const stripe = await stripePromise;
  if (!stripe) {
    throw new Error("Stripe failed to initialize. Check your publishable key.");
  }

  const payload = {
    serviceName,
    amount: normalizedAmount,
    currency,
    bookingId,
    providerId,
    customerEmail,
    successUrl,
    cancelUrl,
  };

  sessionStorage.setItem(
    "latestBookingSummary",
    JSON.stringify({
      serviceName,
      amount: normalizedAmount,
      currency,
      bookingId,
      providerId,
      customerEmail,
    })
  );

  const response = await fetch(
    `${process.env.REACT_APP_API_URL}/api/create-checkout-session`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create checkout session.");
  }

  const { sessionId } = await response.json();
  const { error } = await stripe.redirectToCheckout({ sessionId });

  if (error) {
    throw error;
  }
}
