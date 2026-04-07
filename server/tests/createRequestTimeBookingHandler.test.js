import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createRequestTimeBookingHandler } from "../lib/createRequestTimeBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = {
    hasConflict: [],
    ensureProviderPaymentReady: [],
    createBookingRecord: [],
    afterBookingCreated: [],
  };
  const {
    hasConflict: hasConflictOverride,
    ensureProviderPaymentReady: ensureProviderPaymentReadyOverride,
    createBookingRecord: createBookingRecordOverride,
    afterBookingCreated: afterBookingCreatedOverride,
    ...restOverrides
  } = overrides;

  const handler = createRequestTimeBookingHandler({
    getUserId: () => "client-123",
    getProviderBookingRules: async () => ({
      autoAccept: false,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
    getServiceInfo: async () => ({
      serviceName: "Fade",
      servicePrice: 8500,
      serviceDuration: 60,
      servicePreAppointmentInfo: "Wash first",
      pricingType: "fixed",
      minHours: null,
      maxHours: null,
    }),
    hasConflict: async (payload) => {
      calls.hasConflict.push(payload);
      return hasConflictOverride ? hasConflictOverride(payload) : false;
    },
    ensureProviderPaymentReady: async (providerId) => {
      calls.ensureProviderPaymentReady.push(providerId);
      if (ensureProviderPaymentReadyOverride) {
        return ensureProviderPaymentReadyOverride(providerId);
      }
    },
    getProviderName: async () => "Great Cutz",
    getClientName: async () => "Uzoma",
    createBookingRecord: async (payload) => {
      calls.createBookingRecord.push(payload);
      return createBookingRecordOverride
        ? createBookingRecordOverride(payload)
        : {
            id: "booking-request-1",
            provider_id: payload.providerId,
            client_id: payload.clientId,
            scheduled_at: payload.scheduledAt,
            status: payload.autoAccept ? "confirmed" : "pending",
            payment_status: payload.paymentStatus,
            service_name: payload.serviceName,
          };
    },
    afterBookingCreated: async (payload) => {
      calls.afterBookingCreated.push(payload);
      if (afterBookingCreatedOverride) {
        return afterBookingCreatedOverride(payload);
      }
    },
    getNowMs: () => new Date("2026-04-06T10:00:00.000Z").getTime(),
    getNowIso: () => "2026-04-06T10:00:00.000Z",
    ...restOverrides,
  });

  app.post("/api/bookings/request-time", handler);
  return { app, calls };
}

test("POST /api/bookings/request-time rejects missing required fields", async () => {
  const { app } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: { provider_id: "provider-1" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.json, {
    error: "provider_id, requested_date, and requested_time are required.",
  });
});

test("POST /api/bookings/request-time rejects conflicting time slots", async () => {
  const { app, calls } = buildApp({
    hasConflict: async () => true,
  });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: {
      provider_id: "provider-1",
      service_id: "service-1",
      requested_date: "2026-04-06",
      requested_time: "13:30",
    },
  });

  assert.equal(response.status, 409);
  assert.deepEqual(response.json, {
    error: "That time slot is no longer available.",
  });
  assert.deepEqual(calls.hasConflict[0], {
    providerId: "provider-1",
    scheduledAt: "2026-04-06T13:30:00",
    durationMinutes: 60,
  });
});

test("POST /api/bookings/request-time rejects when provider payment setup is required but unavailable", async () => {
  const { app, calls } = buildApp({
    ensureProviderPaymentReady: async () => {
      const err = new Error("Provider has not connected Stripe yet.");
      err.statusCode = 422;
      throw err;
    },
  });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: {
      provider_id: "provider-1",
      service_id: "service-1",
      requested_date: "2026-04-06",
      requested_time: "13:30",
      payment_type: "deposit",
    },
  });

  assert.equal(response.status, 422);
  assert.equal(response.json.error, "Provider has not connected Stripe yet.");
  assert.deepEqual(calls.ensureProviderPaymentReady, ["provider-1"]);
  assert.equal(calls.createBookingRecord.length, 0);
});

test("POST /api/bookings/request-time creates a pending booking with derived payment status", async () => {
  const { app, calls } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: {
      provider_id: "provider-1",
      service_id: "service-1",
      requested_date: "2026-04-06",
      requested_time: "13:30",
      message: "Can you line up the beard too?",
      payment_type: "save_card",
      stripe_payment_method_id: "pm_123",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.booking.status, "pending");
  assert.equal(response.json.booking.payment_status, "card_saved");
  assert.equal(calls.createBookingRecord.length, 1);
  assert.equal(calls.afterBookingCreated.length, 1);
  assert.equal(calls.afterBookingCreated[0].clientName, "Uzoma");
  assert.equal(calls.afterBookingCreated[0].providerName, "Great Cutz");
});

test("POST /api/bookings/request-time auto-confirms when provider rules enable auto-accept", async () => {
  const { app } = buildApp({
    getProviderBookingRules: async () => ({
      autoAccept: true,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
  });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: {
      provider_id: "provider-1",
      service_id: "service-1",
      requested_date: "2026-04-06",
      requested_time: "13:30",
      payment_type: "full",
      stripe_payment_intent_id: "pi_123",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.booking.status, "confirmed");
  assert.equal(response.json.booking.payment_status, "paid");
});

test("POST /api/bookings/request-time honors hourly duration and price overrides", async () => {
  const { app, calls } = buildApp({
    getServiceInfo: async () => ({
      serviceName: "Vocal Coaching",
      servicePrice: 2000,
      serviceDuration: 60,
      servicePreAppointmentInfo: null,
      pricingType: "per_hour",
      minHours: 1,
      maxHours: 4,
    }),
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/request-time",
    body: {
      provider_id: "provider-1",
      service_id: "service-1",
      requested_date: "2026-04-06",
      requested_time: "13:30",
      requested_duration_minutes: 180,
      requested_price_cents: 6000,
      payment_type: "full",
      stripe_payment_intent_id: "pi_123",
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(calls.hasConflict[0], {
    providerId: "provider-1",
    scheduledAt: "2026-04-06T13:30:00",
    durationMinutes: 180,
  });
  assert.equal(calls.createBookingRecord[0].serviceDuration, 180);
  assert.equal(calls.createBookingRecord[0].servicePrice, 6000);
});
