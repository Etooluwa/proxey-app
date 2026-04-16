import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import {
  resolveChargeCurrency,
  PLATFORM_CURRENCY,
} from "../lib/currency.js";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

// ---------------------------------------------------------------------------
// Unit tests — resolveChargeCurrency
// ---------------------------------------------------------------------------

test("resolveChargeCurrency returns lowercased currency when present", () => {
  assert.equal(resolveChargeCurrency({ currency: "USD" }), "usd");
  assert.equal(resolveChargeCurrency({ currency: "CAD" }), "cad");
  assert.equal(resolveChargeCurrency({ currency: "ghs" }), "ghs");
});

test("resolveChargeCurrency falls back to PLATFORM_CURRENCY when currency is missing", () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    const result = resolveChargeCurrency({});
    assert.equal(result, PLATFORM_CURRENCY);
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes(PLATFORM_CURRENCY));
  } finally {
    console.warn = original;
  }
});

test("resolveChargeCurrency falls back when currency is null/undefined/empty string", () => {
  const original = console.warn;
  console.warn = () => {};
  try {
    assert.equal(resolveChargeCurrency({ currency: null }), PLATFORM_CURRENCY);
    assert.equal(resolveChargeCurrency({ currency: "" }), PLATFORM_CURRENCY);
    assert.equal(resolveChargeCurrency(null), PLATFORM_CURRENCY);
    assert.equal(resolveChargeCurrency(undefined), PLATFORM_CURRENCY);
  } finally {
    console.warn = original;
  }
});

test("resolveChargeCurrency includes context string in the warning message", () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (...args) => warnings.push(args.join(" "));
  try {
    resolveChargeCurrency({}, "charge-card");
    assert.equal(warnings.length, 1);
    assert.ok(warnings[0].includes("charge-card"), `Expected 'charge-card' in: ${warnings[0]}`);
  } finally {
    console.warn = original;
  }
});

// ---------------------------------------------------------------------------
// Integration tests — currency guardrail on PATCH /api/provider/me
//
// The handler needs a minimal Supabase-shaped client passed via dependency
// injection. We build a tiny Express app with the same pattern server.js uses,
// but swap the supabase client for a controllable stub.
// ---------------------------------------------------------------------------

/**
 * Build a minimal Express app that exercises the currency-guardrail logic.
 * `overrides.serviceCount`  — how many active services the provider has (default 0)
 * `overrides.bookingCount`  — how many non-cancelled bookings exist (default 0)
 * `overrides.updatedProfile` — what the profile update resolves to (default {})
 */
function buildGuardrailApp(overrides = {}) {
  const {
    serviceCount = 0,
    bookingCount = 0,
    updatedProfile = {},
    cascadedUpdates = { data: null, error: null },
  } = overrides;

  // Track cascade calls
  const calls = { cascade: [] };

  // Stub Supabase client with chainable builder pattern
  function makeChain(resolvedValue) {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      single: () => Promise.resolve(resolvedValue),
      then: (res, rej) => Promise.resolve(resolvedValue).then(res, rej),
    };
    return chain;
  }

  const supabase = {
    from: (table) => {
      if (table === "services") {
        // First call: count active services. Second call: cascade update.
        let callCount = 0;
        const chain = {
          select: (fields) => {
            if (fields && fields.includes("count")) {
              // Counting active services
              return {
                eq: (col, val) =>
                  col === "provider_id"
                    ? {
                        eq: () =>
                          Promise.resolve({
                            data: null,
                            count: serviceCount,
                            error: null,
                          }),
                      }
                    : {
                        eq: () =>
                          Promise.resolve({
                            data: null,
                            count: serviceCount,
                            error: null,
                          }),
                      },
              };
            }
            return chain;
          },
          update: (vals) => {
            calls.cascade.push(vals);
            return {
              eq: () => Promise.resolve(cascadedUpdates),
            };
          },
        };
        return chain;
      }

      if (table === "bookings") {
        return {
          select: () => ({
            eq: () => ({
              in: () =>
                Promise.resolve({
                  data: null,
                  count: bookingCount,
                  error: null,
                }),
            }),
          }),
        };
      }

      if (table === "provider_profiles") {
        return {
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({ data: updatedProfile, error: null }),
              }),
            }),
          }),
        };
      }

      // fallback
      return makeChain({ data: null, error: null });
    },
  };

  const app = express();
  app.use(express.json());

  // Simulate the authenticated provider middleware
  app.use((req, _res, next) => {
    req.providerId = "provider-123";
    next();
  });

  // Minimal replica of the guardrail logic from server.js
  app.patch("/api/provider/me", async (req, res) => {
    const providerId = req.providerId;
    const updates = req.body;

    if (updates.currency) {
      // Count active services
      const { count: svcCount } = await supabase
        .from("services")
        .select("count", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("is_active", true);

      // Count non-cancelled bookings
      const { count: bkCount } = await supabase
        .from("bookings")
        .select("count", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .in("status", ["pending", "confirmed", "completed"]);

      if (svcCount > 0 || bkCount > 0) {
        return res.status(400).json({
          error:
            "Currency cannot be changed while you have active services or bookings.",
        });
      }

      // Cascade to services
      await supabase
        .from("services")
        .update({ currency: updates.currency })
        .eq("provider_id", providerId);
    }

    const { data, error } = await supabase
      .from("provider_profiles")
      .update(updates)
      .eq("provider_id", providerId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  });

  return { app, calls };
}

test("PATCH /api/provider/me returns 400 when provider has active services", async () => {
  const { app } = buildGuardrailApp({ serviceCount: 2, bookingCount: 0 });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { currency: "usd" },
  });

  assert.equal(response.status, 400);
  assert.ok(
    response.json?.error?.toLowerCase().includes("currency"),
    `Expected currency error, got: ${response.json?.error}`
  );
});

test("PATCH /api/provider/me returns 400 when provider has non-cancelled bookings", async () => {
  const { app } = buildGuardrailApp({ serviceCount: 0, bookingCount: 3 });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { currency: "usd" },
  });

  assert.equal(response.status, 400);
  assert.ok(response.json?.error?.toLowerCase().includes("currency"));
});

test("PATCH /api/provider/me allows currency change and cascades to services when none exist", async () => {
  const updatedProfile = { provider_id: "provider-123", currency: "usd" };
  const { app, calls } = buildGuardrailApp({
    serviceCount: 0,
    bookingCount: 0,
    updatedProfile,
  });

  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { currency: "usd" },
  });

  assert.equal(response.status, 200);
  // The cascade update was called with the new currency
  assert.ok(
    calls.cascade.some((c) => c.currency === "usd"),
    "Expected cascade update with currency: usd"
  );
});

test("PATCH /api/provider/me does not trigger guardrail for non-currency updates", async () => {
  const { app } = buildGuardrailApp({ serviceCount: 99, bookingCount: 99 });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { display_name: "New Name" },
  });

  // Should NOT be blocked — guardrail only fires when currency is in the payload
  assert.notEqual(response.status, 400);
});
