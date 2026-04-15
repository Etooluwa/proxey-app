import crypto from "node:crypto";

import {
  assertBookingLeadTime,
  normalizeProviderBookingRules,
} from "./bookingRules.js";

export function createBookingHandler({
  getUserId,
  getProviderBookingRules = async () => normalizeProviderBookingRules(),
  createPersistedBooking = async () => null,
  appendMemoryBooking = () => {},
  getNowIso = () => new Date().toISOString(),
  getNowMs = () => Date.now(),
  generateBookingId = () => crypto.randomUUID(),
}) {
  return async function handleCreateBooking(req, res) {
    const userId = getUserId(req);
    const {
      serviceId,
      providerId,
      scheduledAt,
      location,
      notes,
      status = "draft",
      price,
      originalPrice,
      promotionId,
      promoCode,
      discountType,
      discountValue,
      discountAmount,
      intakeResponses,
    } = req.body || {};

    if (!serviceId || !providerId || !scheduledAt) {
      return res.status(400).json({
        error: "serviceId, providerId, and scheduledAt are required.",
      });
    }

    const now = getNowIso();
    const providerBookingRules =
      (await getProviderBookingRules(providerId, serviceId)) || normalizeProviderBookingRules();

    try {
      assertBookingLeadTime({
        scheduledAt,
        minimumNoticeHours: providerBookingRules.minimumNoticeHours,
        now: getNowMs(),
      });
    } catch (leadTimeErr) {
      return res.status(400).json({ error: leadTimeErr.message });
    }

    const requestedStatus = status === "draft" ? "pending" : status;
    const initialStatus = providerBookingRules.autoAccept
      ? "confirmed"
      : requestedStatus;

    const metadata = {};
    if (promotionId) {
      metadata.promotion = {
        id: promotionId,
        promoCode,
        discountType,
        discountValue,
        discountAmount,
        originalPrice: originalPrice ?? null,
      };
    }

    const booking = {
      id: generateBookingId(),
      userId,
      serviceId,
      providerId,
      scheduledAt,
      location: location || "",
      notes: notes || "",
      status: initialStatus,
      createdAt: now,
      updatedAt: now,
      price: price ?? null,
    };

    const persistedBooking = await createPersistedBooking({
      booking,
      metadata,
      intakeResponses,
      now,
    });

    if (persistedBooking) {
      return res.status(201).json({ booking: persistedBooking });
    }

    const memoryBooking = appendMemoryBooking(booking) || booking;
    return res.status(201).json({ booking: memoryBooking });
  };
}
