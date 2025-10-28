import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey || !webhookSecret) {
  console.error(
    "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET. Set them in your environment before running test:webhook."
  );
  process.exit(1);
}

const bookingId = process.env.TEST_BOOKING_ID || "test-booking-cli";
const providerId = process.env.TEST_PROVIDER_ID || "test-provider-cli";
const currency = (process.env.TEST_BOOKING_CURRENCY || "usd").toLowerCase();
const amount =
  Number.parseInt(process.env.TEST_BOOKING_AMOUNT ?? "12900", 10) || 12900;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-09-30.acacia",
});

const eventPayload = {
  id: `evt_${Date.now()}`,
  object: "event",
  type: "checkout.session.completed",
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      payment_status: "paid",
      payment_intent: `pi_test_${Date.now()}`,
      amount_total: amount,
      currency,
      metadata: {
        bookingId,
        providerId,
      },
    },
  },
};

const payload = JSON.stringify(eventPayload);
const signatureHeader = stripe.webhooks.generateTestHeaderString({
  payload,
  secret: webhookSecret,
});

const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:5000/webhook";

console.log(`[test:webhook] POST ${webhookUrl}`);
console.log(
  `[test:webhook] Session metadata -> bookingId: ${bookingId}, providerId: ${providerId}`
);

const fetchFn =
  typeof fetch === "function" ? fetch : (await import("node-fetch")).default;

const response = await fetchFn(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "stripe-signature": signatureHeader,
  },
  body: payload,
});

if (!response.ok) {
  const text = await response.text();
  console.error(
    `[test:webhook] Webhook responded with ${response.status}: ${text}`
  );
  process.exit(1);
}

console.log("[test:webhook] Webhook accepted.");
