export function extractLeadingHours(value, fallbackHours) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return fallbackHours;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : fallbackHours;
}

export function normalizeProviderBookingRules(settings = {}) {
  const minimumNoticeHours = extractLeadingHours(settings.minimum_notice, 2);
  const cancellationWindowHours = extractLeadingHours(
    settings.cancellation_policy,
    24
  );

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
