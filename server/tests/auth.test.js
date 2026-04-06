import test from "node:test";
import assert from "node:assert/strict";

import {
  extractBearerToken,
  getVerifiedProviderId,
  getVerifiedUserId,
  isAdminUser,
  resolveVerifiedUser,
} from "../lib/auth.js";

test("extractBearerToken returns null for invalid headers", () => {
  assert.equal(extractBearerToken(), null);
  assert.equal(extractBearerToken("Basic abc123"), null);
  assert.equal(extractBearerToken("Bearer   "), null);
});

test("extractBearerToken returns the bearer token when present", () => {
  assert.equal(extractBearerToken("Bearer token-123"), "token-123");
  assert.equal(extractBearerToken("Bearer   token-456  "), "token-456");
});

test("resolveVerifiedUser returns the verified user identity from Supabase", async () => {
  const supabase = {
    auth: {
      async getUser(token) {
        assert.equal(token, "valid-token");
        return {
          data: {
            user: {
              id: "user-123",
              email: "person@example.com",
            },
          },
          error: null,
        };
      },
    },
  };

  const result = await resolveVerifiedUser({
    authHeader: "Bearer valid-token",
    supabase,
  });

  assert.deepEqual(result, {
    userId: "user-123",
    email: "person@example.com",
  });
});

test("resolveVerifiedUser fails closed for missing token, Supabase error, or thrown error", async () => {
  assert.equal(
    await resolveVerifiedUser({
      authHeader: null,
      supabase: { auth: { getUser: async () => ({}) } },
    }),
    null
  );

  assert.equal(
    await resolveVerifiedUser({
      authHeader: "Bearer bad-token",
      supabase: {
        auth: {
          async getUser() {
            return {
              data: { user: null },
              error: new Error("invalid token"),
            };
          },
        },
      },
    }),
    null
  );

  assert.equal(
    await resolveVerifiedUser({
      authHeader: "Bearer throw-token",
      supabase: {
        auth: {
          async getUser() {
            throw new Error("network");
          },
        },
      },
    }),
    null
  );
});

test("verified request identity helpers only read the verified user id", () => {
  const req = {
    verifiedUserId: "provider-123",
    headers: {
      "x-user-id": "forged-user",
      "x-provider-id": "forged-provider",
    },
  };

  assert.equal(getVerifiedUserId(req), "provider-123");
  assert.equal(getVerifiedProviderId(req), "provider-123");
  assert.equal(getVerifiedUserId({}), null);
});

test("isAdminUser only allows explicit matches", () => {
  const adminIds = ["admin-1", "admin-2"];

  assert.equal(isAdminUser("admin-1", adminIds), true);
  assert.equal(isAdminUser("user-1", adminIds), false);
  assert.equal(isAdminUser(null, adminIds), false);
});
