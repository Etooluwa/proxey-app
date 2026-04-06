import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { createAcceptBookingHandler } from "../lib/acceptBookingHandler.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

function buildApp(overrides = {}) {
  const app = express();
  const calls = { afterAccept: [], updateAcceptedBooking: [] };
  const booking = {
    id: "booking-1",
    provider_id: "provider-1",
    client_id: "client-1",
    status: "pending",
  };
  const {
    fetchBooking: fetchBookingOverride,
    ...restOverrides
  } = overrides;
  const handler = createAcceptBookingHandler({
    getBookingId: (req) => req.params.id,
    getUserId: () => "provider-1",
    fetchBooking: async () =>
      fetchBookingOverride === undefined ? booking : fetchBookingOverride,
    updateAcceptedBooking: async ({ bookingId }) => {
      calls.updateAcceptedBooking.push(bookingId);
      return { ...booking, id: bookingId, status: "confirmed" };
    },
    afterAccept: async (payload) => {
      calls.afterAccept.push(payload);
    },
    ...restOverrides,
  });
  app.post("/api/bookings/:id/accept", handler);
  return { app, calls };
}

test("POST /api/bookings/:id/accept rejects unauthorized providers", async () => {
  const { app } = buildApp({ getUserId: () => "other-provider" });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/accept",
  });
  assert.equal(response.status, 403);
});

test("POST /api/bookings/:id/accept rejects already confirmed bookings", async () => {
  const { app } = buildApp({ fetchBooking: { id: "booking-1", provider_id: "provider-1", status: "confirmed" } });
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/accept",
  });
  assert.equal(response.status, 409);
  assert.deepEqual(response.json, { error: "Already accepted." });
});

test("POST /api/bookings/:id/accept confirms the booking", async () => {
  const { app, calls } = buildApp();
  const response = await invokeExpressApp(app, {
    method: "POST",
    url: "/api/bookings/booking-1/accept",
  });
  assert.equal(response.status, 200);
  assert.equal(response.json.booking.status, "confirmed");
  assert.equal(calls.afterAccept.length, 1);
});
