import test from "node:test";
import assert from "node:assert/strict";
import { invokeExpressApp } from "./helpers/invokeExpressApp.js";

process.env.STRIPE_SECRET_KEY ||= "sk_test_dummy";
process.env.ADMIN_USER_IDS ||= "admin-test-user";

const { app } = await import("../server.js");

test("GET /api/health returns ok with helmet headers", async () => {
  const response = await invokeExpressApp(app, {
    method: "GET",
    url: "/api/health",
    ip: "10.0.0.1",
  });

  assert.equal(response.status, 200);
  assert.deepEqual(response.json, { ok: true });
  assert.equal(response.headers["x-content-type-options"], "nosniff");
  assert.equal(response.headers["x-frame-options"], "SAMEORIGIN");
});

test("GET /api/admin/stats rejects unauthenticated access", async () => {
  const response = await invokeExpressApp(app, {
    method: "GET",
    url: "/api/admin/stats",
    ip: "10.0.0.2",
  });

  assert.equal(response.status, 403);
  assert.deepEqual(response.json, { error: "Admin access required." });
});

test("GET /api/health is rate limited after repeated requests from the same IP", async () => {
  let response = null;

  for (let index = 0; index < 101; index += 1) {
    response = await invokeExpressApp(app, {
      method: "GET",
      url: "/api/health",
      ip: "10.0.0.3",
    });
  }

  assert.ok(response);
  assert.equal(response.status, 429);
  assert.deepEqual(response.json, {
    error: "Too many requests, please try again later.",
  });
});
