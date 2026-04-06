export function createAcceptBookingHandler({
  getBookingId,
  getUserId,
  fetchBooking = async () => null,
  updateAcceptedBooking = async () => null,
  afterAccept = async () => {},
  getNowIso = () => new Date().toISOString(),
}) {
  return async function handleAcceptBooking(req, res) {
    const bookingId = getBookingId(req);
    const requestingUserId = getUserId(req);

    try {
      const booking = await fetchBooking(bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found." });
      if (booking.provider_id !== requestingUserId) {
        return res.status(403).json({ error: "Not authorized to accept this booking." });
      }
      if (booking.status === "confirmed") {
        return res.status(409).json({ error: "Already accepted." });
      }

      const updatedBooking = await updateAcceptedBooking({
        bookingId,
        updatedAt: getNowIso(),
      });

      await afterAccept({
        booking,
        updatedBooking,
        requestingUserId,
      });

      return res.status(200).json({ booking: updatedBooking });
    } catch {
      return res.status(500).json({ error: "Failed to accept booking." });
    }
  };
}
