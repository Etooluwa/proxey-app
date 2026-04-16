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
// Guardrail logic (current): only block if the provider has at least one
// completed booking WITH a stripe_payment_intent_id (real money moved).
// Active services and non-completed bookings do NOT trigger the lock.
// ---------------------------------------------------------------------------

/**
 * Build a minimal Express app that exercises the currency-guardrail logic.
 * `overrides.paidBookingCount` — completed bookings with stripe_payment_intent_id (default 0)
 * `overrides.updatedProfile`   — what the profile update resolves to (default {})
 * `overrides.cascadedUpdates`  — what the service cascade update resolves to
 */
function buildGuardrailApp(overrides = {}) {
  const {
    paidBookingCount = 0,
    updatedProfile = {},
    cascadedUpdates = { data: null, error: null },
  } = overrides;

  // Track cascade calls so tests can assert it ran
  const calls = { cascade: [] };

  // Stub Supabase client — mirrors the chainable builder pattern in server.js.
  // The guardrail query is:
  //   supabase.from('bookings')
  //     .select('id', { count: 'exact', head: true })
  //     .eq('provider_id', providerId)
  //     .eq('status', 'completed')
  //     .not('stripe_payment_intent_id', 'is', null)
  const supabase = {
    from: (table) => {
      if (table === "bookings") {
        // Return a chain that eventually resolves with paidBookingCount
        const chain = {
          select: () => chain,
          eq: () => chain,
          not: () =>
            Promise.resolve({ data: null, count: paidBookingCount, error: null }),
        };
        return chain;
      }

      if (table === "services") {
        // Cascade update: services.update({ currency }).eq('provider_id', ...)
        return {
          update: (vals) => {
            calls.cascade.push(vals);
            return {
              eq: () => Promise.resolve(cascadedUpdates),
            };
          },
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

      // Fallback — should not be hit in these tests
      const fallback = {
        select: () => fallback,
        eq: () => fallback,
        not: () => Promise.resolve({ data: null, count: 0, error: null }),
        then: (res, rej) => Promise.resolve({ data: null, error: null }).then(res, rej),
      };
      return fallback;
    },
  };

  const app = express();
  app.use(express.json());

  // Simulate the authenticated provider middleware
  app.use((req, _res, next) => {
    req.providerId = "provider-123";
    next();
  });

  // Minimal replica of the guardrail logic from server.js (current version)
  app.patch("/api/provider/me", async (req, res) => {
    const providerId = req.providerId;
    const updates = req.body;

    if (updates.currency) {
      // Only block if real money has moved (completed + stripe_payment_intent_id)
      const { count: paidCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", providerId)
        .eq("status", "completed")
        .not("stripe_payment_intent_id", "is", null);

      if ((paidCount || 0) > 0) {
        return res.status(400).json({
          error:
            "Currency cannot be changed after you have completed paid bookings. Contact support if you need to change your currency.",
        });
      }

      // Cascade currency to ALL services (not just active)
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

test("PATCH /api/provider/me returns 400 when provider has completed paid bookings", async () => {
  const { app } = buildGuardrailApp({ paidBookingCount: 2 });
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

test("PATCH /api/provider/me allows currency change when provider has no paid bookings", async () => {
  const updatedProfile = { provider_id: "provider-123", currency: "usd" };
  const { app, calls } = buildGuardrailApp({
    paidBookingCount: 0,
    updatedProfile,
  });

  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { currency: "usd" },
  });

  assert.equal(response.status, 200);
});

test("PATCH /api/provider/me cascades currency to services when allowed", async () => {
  const updatedProfile = { provider_id: "provider-123", currency: "eur" };
  const { app, calls } = buildGuardrailApp({
    paidBookingCount: 0,
    updatedProfile,
  });

  await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { currency: "eur" },
  });

  assert.ok(
    calls.cascade.some((c) => c.currency === "eur"),
    "Expected cascade update with currency: eur"
  );
});

test("PATCH /api/provider/me does not trigger guardrail for non-currency updates", async () => {
  // Even with paid bookings, a non-currency update should go through
  const { app } = buildGuardrailApp({ paidBookingCount: 99 });
  const response = await invokeExpressApp(app, {
    method: "PATCH",
    url: "/api/provider/me",
    headers: { "content-type": "application/json" },
    body: { display_name: "New Name" },
  });

  // Should NOT be blocked — guardrail only fires when currency is in the payload
  assert.notEqual(response.status, 400);
});
