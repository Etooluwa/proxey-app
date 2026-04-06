import test from "node:test";
import assert from "node:assert/strict";

import {
  assertBookingLeadTime,
  extractLeadingHours,
  normalizeProviderBookingRules,
} from "../lib/bookingRules.js";

test("extractLeadingHours parses numbers from strings and falls back safely", () => {
  assert.equal(extractLeadingHours(6, 2), 6);
  assert.equal(extractLeadingHours("4 hours", 2), 4);
  assert.equal(extractLeadingHours("12.5 hrs", 2), 12.5);
  assert.equal(extractLeadingHours("none", 2), 2);
  assert.equal(extractLeadingHours(null, 2), 2);
});

test("normalizeProviderBookingRules returns predictable defaults", () => {
  assert.deepEqual(normalizeProviderBookingRules(), {
    autoAccept: false,
    minimumNoticeHours: 2,
    cancellationWindowHours: 24,
  });
});

test("normalizeProviderBookingRules maps provider settings into booking rules", () => {
  assert.deepEqual(
    normalizeProviderBookingRules({
      auto_accept: true,
      minimum_notice: "6 hours",
      cancellation_policy: "48 hours before",
    }),
    {
      autoAccept: true,
      minimumNoticeHours: 6,
      cancellationWindowHours: 48,
    }
  );
});

test("assertBookingLeadTime allows bookings outside the notice window", () => {
  const now = new Date("2026-04-06T10:00:00.000Z").getTime();

  assert.doesNotThrow(() =>
    assertBookingLeadTime({
      scheduledAt: "2026-04-06T12:30:00.000Z",
      minimumNoticeHours: 2,
      now,
    })
  );
});

test("assertBookingLeadTime rejects bookings inside the notice window", () => {
  const now = new Date("2026-04-06T10:00:00.000Z").getTime();

  assert.throws(
    () =>
      assertBookingLeadTime({
        scheduledAt: "2026-04-06T11:30:00.000Z",
        minimumNoticeHours: 2,
        now,
      }),
    /Bookings must be made at least 2 hours ahead\./
  );
});

test("assertBookingLeadTime ignores invalid timestamps instead of failing open incorrectly", () => {
  assert.doesNotThrow(() =>
    assertBookingLeadTime({
      scheduledAt: "not-a-date",
      minimumNoticeHours: 2,
      now: Date.now(),
    })
  );
});
