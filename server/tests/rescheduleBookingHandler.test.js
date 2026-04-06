import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createRescheduleBookingHandler } from "../lib/rescheduleBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = { hasConflict: [], afterReschedule: [], updateBookingSchedule: [] };
  const booking = {
    id: "booking-1",
    client_id: "client-123",
    provider_id: "provider-1",
    scheduled_at: "2026-04-07T15:00:00.000Z",
    duration: 90,
    status: "pending",
    client_name: "Uzoma",
  };
  const {
    hasConflict: hasConflictOverride,
    updateBookingSchedule: updateBookingScheduleOverride,
    afterReschedule: afterRescheduleOverride,
    ...restOverrides
  } = overrides;

  const handler = createRescheduleBookingHandler({
    getBookingId: (req) => req.params.id,
    getUserId: () => "client-123",
    fetchBooking: async () => overrides.fetchBooking === undefined ? booking : overrides.fetchBooking,
    fetchProviderOwnerUserId: async () => overrides.providerOwnerUserId ?? null,
    hasConflict: async (payload) => {
      calls.hasConflict.push(payload);
      return hasConflictOverride ? hasConflictOverride(payload) : false;
    },
    updateBookingSchedule: async ({ bookingId, scheduledAt }) => {
      calls.updateBookingSchedule.push({ bookingId, scheduledAt });
      return updateBookingScheduleOverride
        ? updateBookingScheduleOverride({ bookingId, scheduledAt })
        : { ...booking, id: bookingId, scheduled_at: scheduledAt, status: "confirmed" };
    },
    afterReschedule: async (payload) => {
      calls.afterReschedule.push(payload);
      if (afterRescheduleOverride) return afterRescheduleOverride(payload);
    },
    ...restOverrides,
  });

  app.patch("/api/bookings/:id/reschedule", handler);
  return { app, calls };
}

test("PATCH /api/bookings/:id/reschedule requires new date and time", async () => {
  const { app } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/reschedule",
    body: {},
  });
  assert.equal(response.status, 400);
  assert.deepEqual(response.json, { error: "new_date and new_time are required." });
});

test("PATCH /api/bookings/:id/reschedule rejects unauthorized users", async () => {
  const { app } = buildApp({ getUserId: () => "other-user" });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/reschedule",
    body: { new_date: "2026-04-08", new_time: "14:00" },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(response.json, { error: "Not authorized to reschedule this booking." });
});

test("PATCH /api/bookings/:id/reschedule rejects conflicting time slots", async () => {
  const { app, calls } = buildApp({ hasConflict: async () => true });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/reschedule",
    body: { new_date: "2026-04-08", new_time: "14:00" },
  });
  assert.equal(response.status, 409);
  assert.deepEqual(response.json, { error: "That time slot is no longer available." });
  assert.deepEqual(calls.hasConflict[0], {
    providerId: "provider-1",
    scheduledAt: new Date("2026-04-08T14:00").toISOString(),
    durationMinutes: 90,
    excludeBookingId: "booking-1",
  });
});

test("PATCH /api/bookings/:id/reschedule updates booking and records client-initiated reschedule", async () => {
  const { app, calls } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/reschedule",
    body: { new_date: "2026-04-08", new_time: "14:00", reason: "Running late" },
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.booking.status, "confirmed");
  assert.equal(calls.afterReschedule[0].initiatedBy, "client");
  assert.equal(calls.afterReschedule[0].reason, "Running late");
});

test("PATCH /api/bookings/:id/reschedule allows provider owner fallback authorization", async () => {
  const { app, calls } = buildApp({
    getUserId: () => "provider-owner-1",
    providerOwnerUserId: "provider-owner-1",
  });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/bookings/booking-1/reschedule",
    body: { new_date: "2026-04-08", new_time: "14:00" },
  });
  assert.equal(response.status, 200);
  assert.equal(calls.afterReschedule[0].initiatedBy, "provider");
});
