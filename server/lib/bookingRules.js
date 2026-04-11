export function extractLeadingHours(value, fallbackHours) {
  // Numeric value stored directly (new format: 0 = no limit)
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return fallbackHours;
  // Legacy string format: "Clients can cancel up to 24 hours before"
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallbackHours;
}

export function normalizeProviderBookingRules(settings = {}) {
  // Support both new numeric fields (cancellation_hours / notice_hours) and
  // legacy string fields (cancellation_policy / minimum_notice).
  const rawNotice = settings.notice_hours ?? settings.minimum_notice;
  const rawCancel = settings.cancellation_hours ?? settings.cancellation_policy;

  const minimumNoticeHours = extractLeadingHours(rawNotice, 2);
  const cancellationWindowHours = extractLeadingHours(rawCancel, 24);

  return {
    autoAccept: Boolean(settings.auto_accept),
    minimumNoticeHours,
    cancellationWindowHours,
  };
}

export function assertBookingLeadTime({
  scheduledAt,
  minimumNoticeHours,
  now = Date.now(),
}) {
  // 0 means no lead time required — allow any booking time
  if (!scheduledAt || !minimumNoticeHours) return;
  const scheduledTime = new Date(scheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) return;
  const minAllowed = now + minimumNoticeHours * 60 * 60 * 1000;
  if (scheduledTime < minAllowed) {
    throw new Error(
      `Bookings must be made at least ${minimumNoticeHours} hours ahead.`
    );
  }
}
