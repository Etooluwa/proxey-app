import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createCancelBookingHandler } from "../lib/cancelBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = { afterCancel: [], cancelBookingRecord: [] };
  const booking = {
    id: "booking-1",
    client_id: "client-123",
    provider_id: "provider-1",
    scheduled_at: "2026-04-07T15:00:00.000Z",
    client_name: "Uzoma",
    status: "confirmed",
  };
  const {
    fetchBooking: fetchBookingOverride,
    ...restOverrides
  } = overrides;

  const handler = createCancelBookingHandler({
    getBookingId: (req) => req.params.id,
    getUserId: () => "client-123",
    fetchBooking: async () =>
      fetchBookingOverride === undefined ? booking : fetchBookingOverride,
    fetchProviderOwnerUserId: async () => overrides.providerOwnerUserId ?? null,
    getProviderBookingRules: async () => ({
      autoAccept: false,
      minimumNoticeHours: 2,
      cancellationWindowHours: 24,
    }),
    cancelBookingRecord: async ({ bookingId }) => {
      calls.cancelBookingRecord.push(bookingId);
      return { ...booking, id: bookingId, status: "cancelled" };
    },
    afterCancel: async (payload) => {
      calls.afterCancel.push(payload);
    },
    findMemoryBooking: () => overrides.memoryBooking ?? null,
    getNowMs: () => new Date("2026-04-06T10:00:00.000Z").getTime(),
    getNowIso: () => "2026-04-06T10:00:00.000Z",
    ...restOverrides,
  });

  app.patch("/api/bookings/:id/cancel", handler);
  return { app, calls };
}

test("PATCH /api/bookings/:id/cancel rejects unauthorized users", async () => {
  const { app } = buildApp({ getUserId: () => "other-user" });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/cancel",
    body: { reason: "Need to move it" },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(response.json, { error: "Not authorized to cancel this booking." });
});

test("PATCH /api/bookings/:id/cancel enforces cancellation window for clients", async () => {
  const { app } = buildApp({
    getNowMs: () => new Date("2026-04-07T14:30:00.000Z").getTime(),
  });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/cancel",
  });
  assert.equal(response.status, 400);
  assert.match(response.json.error, /This booking can only be cancelled at least 24 hours before the appointment\./);
});

test("PATCH /api/bookings/:id/cancel allows provider owner fallback authorization", async () => {
  const { app, calls } = buildApp({
    getUserId: () => "provider-owner-1",
    providerOwnerUserId: "provider-owner-1",
  });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/cancel",
    body: { reason: "Out sick" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.booking.status, "cancelled");
  assert.equal(calls.afterCancel[0].initiatedBy, "provider");
});

test("PATCH /api/bookings/:id/cancel updates memory booking when no persisted booking exists", async () => {
  const memoryBooking = { id: "booking-1", userId: "client-123", status: "confirmed" };
  const { app } = buildApp({
    fetchBooking: null,
    memoryBooking,
  });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/cancel",
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.booking.status, "cancelled");
});
