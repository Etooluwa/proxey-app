import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createBookingHandler } from "../lib/createBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const memoryBookings = [];
  const createPersistedBookingCalls = [];
  const {
    createPersistedBooking: createPersistedBookingOverride,
    ...restOverrides
  } = overrides;

  const handler = createBookingHandler({
    getUserId: () => "client-123",
    getProviderBookingRules: async () => ({
      autoAccept: false,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
    createPersistedBooking: async (payload) => {
      createPersistedBookingCalls.push(payload);
      if (createPersistedBookingOverride) {
        return createPersistedBookingOverride(payload);
      }
      return null;
    },
    appendMemoryBooking: (booking) => {
      memoryBookings.push(booking);
      return booking;
    },
    getNowIso: () => "2026-04-06T10:00:00.000Z",
    getNowMs: () => new Date("2026-04-06T10:00:00.000Z").getTime(),
    generateBookingId: () => "booking-test-id",
    ...restOverrides,
  });

  app.post("/api/bookings", handler);

  return {
    app,
    memoryBookings,
    createPersistedBookingCalls,
  };
}

test("POST /api/bookings returns 400 when required fields are missing", async () => {
  const { app } = buildApp();

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings",
    body: { providerId: "provider-1" },
  });

  assert.equal(response.status, 400);
  assert.deepEqual(response.json, {
    error: "serviceId, providerId, and scheduledAt are required.",
  });
});

test("POST /api/bookings returns 400 when booking violates lead time", async () => {
  const { app } = buildApp();

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T11:00:00.000Z",
    },
  });

  assert.equal(response.status, 400);
  assert.match(response.json.error, /Bookings must be made at least 2 hours ahead\./);
});

test("POST /api/bookings persists a pending booking and passes promotion metadata through", async () => {
  const { app, createPersistedBookingCalls, memoryBookings } = buildApp({
    createPersistedBooking: async ({ booking }) => ({
      ...booking,
      persisted: true,
    }),
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      status: "draft",
      price: 12500,
      promotionId: "promo-1",
      promoCode: "SAVE10",
      discountType: "percent",
      discountValue: 10,
      discountAmount: 1250,
      originalPrice: 13750,
      intakeResponses: [{ questionId: "q1", responseText: "Short hair" }],
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.booking.status, "pending");
  assert.equal(response.json.booking.persisted, true);
  assert.equal(memoryBookings.length, 0);
  assert.equal(createPersistedBookingCalls.length, 1);
  assert.deepEqual(createPersistedBookingCalls[0].metadata, {
    promotion: {
      id: "promo-1",
      promoCode: "SAVE10",
      discountType: "percent",
      discountValue: 10,
      discountAmount: 1250,
      originalPrice: 13750,
    },
  });
  assert.deepEqual(createPersistedBookingCalls[0].intakeResponses, [
    { questionId: "q1", responseText: "Short hair" },
  ]);
});

test("POST /api/bookings auto-confirms when provider rules enable auto-accept", async () => {
  const { app } = buildApp({
    getProviderBookingRules: async () => ({
      autoAccept: true,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
    createPersistedBooking: async ({ booking }) => booking,
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      status: "draft",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.booking.status, "confirmed");
});

test("POST /api/bookings falls back to memory storage when persistence is unavailable", async () => {
  const { app, memoryBookings } = buildApp({
    createPersistedBooking: async () => null,
  });

  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings",
    body: {
      serviceId: "service-1",
      providerId: "provider-1",
      scheduledAt: "2026-04-06T13:30:00.000Z",
      notes: "Please ring the bell",
    },
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.booking.id, "booking-test-id");
  assert.equal(response.json.booking.notes, "Please ring the bell");
  assert.equal(memoryBookings.length, 1);
});
