import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createChargedBookingHandler } from "../lib/createChargedBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = {
    createBookingRecord: [],
    getOrCreateCustomerId: [],
    createPaymentIntent: [],
    afterBookingCreated: [],
    hasConflict: [],
  };
  const {
    hasConflict: hasConflictOverride,
    createBookingRecord: createBookingRecordOverride,
    getOrCreateCustomerId: getOrCreateCustomerIdOverride,
    createPaymentIntent: createPaymentIntentOverride,
    afterBookingCreated: afterBookingCreatedOverride,
    ...restOverrides
  } = overrides;

  const handler = createChargedBookingHandler({
    getUserId: () => "client-123",
    getProviderBookingRules: async () => ({
      autoAccept: false,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
    getServiceDuration: async () => 90,
    getProviderStripe: async () => ({ accountId: "acct_123" }),
    hasConflict: async (payload) => {
      calls.hasConflict.push(payload);
      return hasConflictOverride ? hasConflictOverride(payload) : false;
    },
    createBookingRecord: async (payload) => {
      calls.createBookingRecord.push(payload);
      return createBookingRecordOverride
        ? createBookingRecordOverride(payload)
        : payload.bookingId;
    },
    getOrCreateCustomerId: async (userId) => {
      calls.getOrCreateCustomerId.push(userId);
      return getOrCreateCustomerIdOverride
        ? getOrCreateCustomerIdOverride(userId)
        : "cus_123";
    },
    createPaymentIntent: async (payload) => {
      calls.createPaymentIntent.push(payload);
      return createPaymentIntentOverride
        ? createPaymentIntentOverride(payload)
        : { id: "pi_123" };
    },
    afterBookingCreated: async (payload) => {
      calls.afterBookingCreated.push(payload);
      if (afterBookingCreatedOverride) {
        return afterBookingCreatedOverride(payload);
      }
    },
    generateBookingId: () => "booking-charged-1",
    getNowMs: () => new Date("2026-04-06T10:00:00.000Z").getTime(),
    ...restOverrides,
  });

  app.post("/api/bookings/create", handler);

  return { app, calls };
}

test("POST /api/bookings/create rejects missing required fields", async () => {
  const { app } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/create",
    body: { providerId: "provider-1" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.json, {
    error: "serviceId, providerId, and scheduledAt are required.",
  });
});

test("POST /api/bookings/create rejects provider Stripe readiness errors", async () => {
  const { app, calls } = buildApp({
    getProviderStripe: async () => {
      const err = new Error("Provider payout account is not ready yet.");
      err.statusCode = 422;
      throw err;
    },
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/create",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      price: 120,
      paymentMethodId: "pm_123",
    },
  });

  assert.equal(response.status, 422);
  assert.equal(response.json.error, "Provider payout account is not ready yet.");
  assert.equal(calls.createBookingRecord.length, 0);
});

test("POST /api/bookings/create rejects conflicting time slots", async () => {
  const { app, calls } = buildApp({
    hasConflict: async () => true,
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/create",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      price: 0,
    },
  });

  assert.equal(response.status, 409);
  assert.deepEqual(response.json, {
    error: "That time slot is no longer available.",
  });
  assert.deepEqual(calls.hasConflict[0], {
    providerId: "provider-1",
    scheduledAt: "2026-04-06T13:30:00.000Z",
    durationMinutes: 90,
  });
  assert.equal(calls.createBookingRecord.length, 0);
});

test("POST /api/bookings/create creates a booking and payment intent for paid bookings", async () => {
  const { app, calls } = buildApp();

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/create",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      notes: "Please buzz unit 4",
      price: 120,
      depositAmount: 40,
      paymentMethodId: "pm_123",
      saveCard: true,
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.json, {
    ok: true,
    bookingId: "booking-charged-1",
    paymentIntentId: "pi_123",
  });
  assert.equal(calls.createBookingRecord.length, 1);
  assert.equal(calls.getOrCreateCustomerId[0], "client-123");
  assert.deepEqual(calls.createPaymentIntent[0], {
    amountCents: 4000,
    customerId: "cus_123",
    paymentMethodId: "pm_123",
    bookingId: "booking-charged-1",
    providerId: "provider-1",
    userId: "client-123",
    saveCard: true,
    providerStripe: { accountId: "acct_123" },
    platformCurrency: "cad",
  });
});

test("POST /api/bookings/create skips Stripe for free bookings and still creates the booking", async () => {
  const { app, calls } = buildApp();

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/create",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      price: 0,
    },
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.json, {
    ok: true,
    bookingId: "booking-charged-1",
    paymentIntentId: null,
  });
  assert.equal(calls.createBookingRecord.length, 1);
  assert.equal(calls.getOrCreateCustomerId.length, 0);
  assert.equal(calls.createPaymentIntent.length, 0);
});
