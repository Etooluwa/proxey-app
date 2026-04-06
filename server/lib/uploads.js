const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function isAllowedImageContentType(contentType) {
  if (typeof contentType !== "string") return false;
  return ALLOWED_IMAGE_TYPES.has(contentType.toLowerCase());
}

export function sanitizeFilename(filename) {
  return String(filename || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(0, 100);
}
