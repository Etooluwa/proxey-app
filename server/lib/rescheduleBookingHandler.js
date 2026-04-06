export function createRescheduleBookingHandler({
  getBookingId,
  getUserId,
  getPayload = (req) => req.body || {},
  parseScheduledAt = ({ new_date, new_time }) =>
    new Date(`${new_date}T${new_time}`).toISOString(),
  fetchBooking = async () => null,
  fetchProviderOwnerUserId = async () => null,
  hasConflict = async () => false,
  updateBookingSchedule = async () => null,
  afterReschedule = async () => {},
}) {
  return async function handleRescheduleBooking(req, res) {
    const bookingId = getBookingId(req);
    const userId = getUserId(req);
    const { new_date, new_time, reason } = getPayload(req);

    if (!new_date || !new_time) {
      return res.status(400).json({ error: "new_date and new_time are required." });
    }

    const newScheduledAt = parseScheduledAt({ new_date, new_time });
    if (!newScheduledAt || newScheduledAt === "Invalid Date") {
      return res.status(400).json({ error: "Invalid date or time." });
    }

    const booking = await fetchBooking(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }

    const isClient = booking.client_id === userId;
    let isProvider = booking.provider_id === userId;
    if (!isClient && !isProvider) {
      const providerOwnerUserId = await fetchProviderOwnerUserId(booking.provider_id);
      if (providerOwnerUserId === userId) isProvider = true;
    }
    if (!isClient && !isProvider) {
      return res.status(403).json({ error: "Not authorized to reschedule this booking." });
    }

    const conflict = await hasConflict({
      providerId: booking.provider_id,
      scheduledAt: newScheduledAt,
      durationMinutes: booking.duration || booking.duration_minutes || 60,
      excludeBookingId: bookingId,
    });
    if (conflict) {
      return res.status(409).json({ error: "That time slot is no longer available." });
    }

    const rescheduledBooking = await updateBookingSchedule({
      bookingId,
      scheduledAt: newScheduledAt,
    });

    await afterReschedule({
      previousBooking: booking,
      booking: rescheduledBooking,
      initiatedBy: isClient ? "client" : "provider",
      reason: reason || "",
      scheduledAt: newScheduledAt,
    });

    return res.status(200).json({ booking: rescheduledBooking });
  };
}
