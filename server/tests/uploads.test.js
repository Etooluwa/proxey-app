import test from "node:test";
import assert from "node:assert/strict";

import {
  isAllowedImageContentType,
  sanitizeFilename,
} from "../lib/uploads.js";

test("isAllowedImageContentType accepts only supported image MIME types", () => {
  assert.equal(isAllowedImageContentType("image/jpeg"), true);
  assert.equal(isAllowedImageContentType("image/PNG"), true);
  assert.equal(isAllowedImageContentType("image/heic"), true);
  assert.equal(isAllowedImageContentType("application/pdf"), false);
  assert.equal(isAllowedImageContentType("text/plain"), false);
  assert.equal(isAllowedImageContentType(), false);
});

test("sanitizeFilename strips unsafe characters and dot traversal patterns", () => {
  assert.equal(sanitizeFilename("../../avatar?.png"), "____avatar_.png");
  assert.equal(sanitizeFilename("client photo (final).jpg"), "client_photo__final_.jpg");
  assert.equal(sanitizeFilename("safe-file.webp"), "safe-file.webp");
});

test("sanitizeFilename caps file names at 100 characters", () => {
  const longName = `${"a".repeat(150)}.jpg`;
  assert.equal(sanitizeFilename(longName).length, 100);
});
