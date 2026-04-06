import { normalizeProviderBookingRules } from "./bookingRules.js";

export function createCancelBookingHandler({
  getBookingId,
  getUserId,
  getReason = (req) => req.body?.reason,
  fetchBooking = async () => null,
  fetchProviderOwnerUserId = async () => null,
  getProviderBookingRules = async () => normalizeProviderBookingRules(),
  cancelBookingRecord = async () => null,
  afterCancel = async () => {},
  findMemoryBooking = () => null,
  getNowMs = () => Date.now(),
  getNowIso = () => new Date().toISOString(),
}) {
  return async function handleCancelBooking(req, res) {
    const bookingId = getBookingId(req);
    const userId = getUserId(req);
    const reason = getReason(req) || "";

    const booking = await fetchBooking(bookingId);
    if (booking) {
      const isClient = booking.client_id === userId;
      let isProvider = booking.provider_id === userId;

      if (!isClient && !isProvider) {
        const providerOwnerUserId = await fetchProviderOwnerUserId(booking.provider_id);
        if (providerOwnerUserId === userId) isProvider = true;
      }

      if (!isClient && !isProvider) {
        return res.status(403).json({ error: "Not authorized to cancel this booking." });
      }

      if (isClient) {
        const providerBookingRules =
          (await getProviderBookingRules(booking.provider_id)) ||
          normalizeProviderBookingRules();
        const scheduledTime = new Date(booking.scheduled_at).getTime();
        const cutoffTime =
          scheduledTime -
          providerBookingRules.cancellationWindowHours * 60 * 60 * 1000;
        if (Number.isFinite(cutoffTime) && getNowMs() > cutoffTime) {
          return res.status(400).json({
            error: `This booking can only be cancelled at least ${providerBookingRules.cancellationWindowHours} hours before the appointment.`,
          });
        }
      }

      const cancelledBooking = await cancelBookingRecord({
        bookingId,
        cancelledAt: getNowIso(),
      });

      await afterCancel({
        booking: cancelledBooking,
        initiatedBy: isClient ? "client" : "provider",
        reason,
      });

      return res.status(200).json({ booking: cancelledBooking });
    }

    const memoryBooking = findMemoryBooking(bookingId, userId);
    if (!memoryBooking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    memoryBooking.status = "cancelled";
    memoryBooking.updatedAt = getNowIso();
    return res.status(200).json({ booking: memoryBooking });
  };
}
