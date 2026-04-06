import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createCompleteBookingHandler } from "../lib/completeBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = {
    markPaymentFailed: [],
    notifyProviderChargeResult: [],
    notifyClientPaymentFailed: [],
    chargeCompletion: [],
    markCompleted: [],
    createEarningsRecord: [],
    createInvoice: [],
    notifyClientCompletion: [],
  };
  const booking = {
    id: "booking-1",
    provider_id: "provider-1",
    client_id: "client-1",
    service_id: "service-1",
    service_name: "Fade",
    client_name: "Uzoma",
    price: 10000,
    payment_type: "save_card",
    payment_status: "unpaid",
    stripe_payment_method_id: "pm_123",
    deposit_paid_cents: 0,
    status: "confirmed",
  };
  const {
    fetchBooking: fetchBookingOverride,
    chargeCompletion: chargeCompletionOverride,
    ...restOverrides
  } = overrides;

  const handler = createCompleteBookingHandler({
    getBookingId: (req) => req.params.id,
    getUserId: () => "provider-1",
    fetchBooking: async () =>
      fetchBookingOverride === undefined ? booking : fetchBookingOverride,
    getServiceInfo: async () => ({ name: "Fade" }),
    markPaymentFailed: async (payload) => calls.markPaymentFailed.push(payload),
    notifyProviderChargeResult: async (payload) =>
      calls.notifyProviderChargeResult.push(payload),
    notifyClientPaymentFailed: async (payload) =>
      calls.notifyClientPaymentFailed.push(payload),
    getProviderStripeAccountId: async () => "acct_123",
    getClientStripeCustomerId: async () => "cus_123",
    chargeCompletion: async (payload) => {
      calls.chargeCompletion.push(payload);
      if (chargeCompletionOverride) return chargeCompletionOverride(payload);
      return { id: "pi_complete_1" };
    },
    markCompleted: async (payload) => calls.markCompleted.push(payload),
    createEarningsRecord: async (payload) =>
      calls.createEarningsRecord.push(payload),
    createInvoice: async (payload) => {
      calls.createInvoice.push(payload);
      return { invoiceNumber: "INV-001", invoiceId: "inv_1" };
    },
    notifyClientCompletion: async (payload) =>
      calls.notifyClientCompletion.push(payload),
    ...restOverrides,
  });
  app.post("/api/bookings/:id/complete", handler);
  return { app, calls };
}

test("POST /api/bookings/:id/complete rejects unauthorized providers", async () => {
  const { app } = buildApp({ getUserId: () => "other-provider" });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/complete",
  });
  assert.equal(response.status, 403);
});

test("POST /api/bookings/:id/complete rejects already completed bookings", async () => {
  const { app } = buildApp({ fetchBooking: { id: "booking-1", provider_id: "provider-1", status: "completed" } });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/complete",
  });
  assert.equal(response.status, 409);
});

test("POST /api/bookings/:id/complete fails when required completion charge has no saved payment method", async () => {
  const { app, calls } = buildApp({
    fetchBooking: {
      id: "booking-1",
      provider_id: "provider-1",
      client_id: "client-1",
      service_name: "Fade",
      client_name: "Uzoma",
      price: 10000,
      payment_type: "save_card",
      payment_status: "unpaid",
      stripe_payment_method_id: null,
      deposit_paid_cents: 0,
      status: "confirmed",
    },
  });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/complete",
  });
  assert.equal(response.status, 400);
  assert.equal(calls.markPaymentFailed.length, 1);
});

test("POST /api/bookings/:id/complete surfaces Stripe card failures", async () => {
  const { app, calls } = buildApp({
    chargeCompletion: async () => {
      const err = new Error("Card declined");
      err.type = "StripeCardError";
      throw err;
    },
  });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/complete",
  });
  assert.equal(response.status, 402);
  assert.equal(calls.markPaymentFailed.length, 1);
  assert.equal(calls.notifyClientPaymentFailed.length, 1);
});

test("POST /api/bookings/:id/complete completes and returns payout summary", async () => {
  const { app, calls } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/complete",
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.ok, true);
  assert.equal(response.json.payout.paymentIntentId, "pi_complete_1");
  assert.equal(response.json.invoice_number, "INV-001");
  assert.equal(calls.markCompleted.length, 1);
  assert.equal(calls.createEarningsRecord.length, 1);
});
