import crypto from "node:crypto";

import {
  assertBookingLeadTime,
  normalizeProviderBookingRules,
} from "./bookingRules.js";

export function createChargedBookingHandler({
  getUserId,
  getProviderBookingRules = async () => normalizeProviderBookingRules(),
  getServiceDuration = async () => 60,
  getServiceName = async () => null,
  getProviderStripe = async () => null,
  hasConflict = async () => false,
  createBookingRecord = async ({ bookingId }) => bookingId,
  getOrCreateCustomerId = async () => null,
  createPaymentIntent = async () => null,
  afterBookingCreated = async () => {},
  generateBookingId = () => crypto.randomUUID(),
  getNowMs = () => Date.now(),
  platformCurrency = "cad",
}) {
  return async function handleCreateChargedBooking(req, res) {
    const userId = getUserId(req);
    const {
      serviceId,
      providerId,
      scheduledAt,
      notes,
      price,
      depositAmount,
      paymentMethodId,
      saveCard,
    } = req.body || {};

    if (!serviceId || !providerId || !scheduledAt) {
      return res
        .status(400)
        .json({ error: "serviceId, providerId, and scheduledAt are required." });
    }

    const providerBookingRules =
      (await getProviderBookingRules(providerId)) || normalizeProviderBookingRules();

    try {
      assertBookingLeadTime({
        scheduledAt,
        minimumNoticeHours: providerBookingRules.minimumNoticeHours,
        now: getNowMs(),
      });
    } catch (leadTimeErr) {
      return res.status(400).json({ error: leadTimeErr.message });
    }

    const chargeAmount = depositAmount != null ? depositAmount : price;
    const amountCents = Math.round((parseFloat(chargeAmount) || 0) * 100);
    let providerStripe = null;
    const [serviceDuration, serviceName] = await Promise.all([
      getServiceDuration(serviceId),
      getServiceName(serviceId),
    ]);

    if (amountCents > 0) {
      try {
        providerStripe = await getProviderStripe(providerId);
      } catch (providerStripeError) {
        return res.status(providerStripeError.statusCode || 500).json({
          error:
            providerStripeError.message ||
            "Provider payout account is not ready yet.",
        });
      }
    }

    try {
      const conflict = await hasConflict({
        providerId,
        scheduledAt,
        durationMinutes: serviceDuration,
      });
      if (conflict) {
        return res
          .status(409)
          .json({ error: "That time slot is no longer available." });
      }

      const bookingId = await createBookingRecord({
        bookingId: generateBookingId(),
        userId,
        serviceId,
        serviceName,
        providerId,
        scheduledAt,
        serviceDuration,
        notes,
        price,
        platformCurrency,
        autoAccept: providerBookingRules.autoAccept,
      });

      let paymentIntentId = null;
      if (amountCents > 0 && paymentMethodId) {
        const customerId = await getOrCreateCustomerId(userId);
        const paymentIntent = await createPaymentIntent({
          amountCents,
          customerId,
          paymentMethodId,
          bookingId,
          providerId,
          userId,
          saveCard,
          providerStripe,
          platformCurrency,
        });
        paymentIntentId = paymentIntent?.id || null;
      }

      await afterBookingCreated({
        bookingId,
        userId,
        serviceId,
        providerId,
        scheduledAt,
        paymentIntentId,
        autoAccept: providerBookingRules.autoAccept,
      });

      return res.json({ ok: true, bookingId, paymentIntentId });
    } catch (err) {
      return res
        .status(500)
        .json({ error: err.message || "Failed to create booking." });
    }
  };
}
