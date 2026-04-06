import {
  assertBookingLeadTime,
  normalizeProviderBookingRules,
} from "./bookingRules.js";

export function createRequestTimeBookingHandler({
  getUserId,
  getProviderBookingRules = async () => normalizeProviderBookingRules(),
  getServiceInfo = async () => ({
    serviceName: null,
    servicePrice: null,
    serviceDuration: 60,
    servicePreAppointmentInfo: null,
  }),
  hasConflict = async () => false,
  ensureProviderPaymentReady = async () => {},
  getProviderName = async () => null,
  getClientName = async () => "A client",
  createBookingRecord = async () => null,
  afterBookingCreated = async () => {},
  getNowMs = () => Date.now(),
  getNowIso = () => new Date().toISOString(),
}) {
  return async function handleRequestTimeBooking(req, res) {
    const clientId = getUserId(req);
    const {
      provider_id,
      service_id,
      requested_date,
      requested_time,
      message,
      payment_type,
      stripe_setup_intent_id,
      stripe_payment_method_id,
      stripe_payment_intent_id,
      deposit_paid_cents,
    } = req.body || {};

    if (!provider_id || !requested_date || !requested_time) {
      return res.status(400).json({
        error: "provider_id, requested_date, and requested_time are required.",
      });
    }

    try {
      const scheduledAt = `${requested_date}T${requested_time}:00`;
      const providerBookingRules =
        (await getProviderBookingRules(provider_id)) ||
        normalizeProviderBookingRules();

      assertBookingLeadTime({
        scheduledAt,
        minimumNoticeHours: providerBookingRules.minimumNoticeHours,
        now: getNowMs(),
      });

      const {
        serviceName = null,
        servicePrice = null,
        serviceDuration = 60,
        servicePreAppointmentInfo = null,
      } = (await getServiceInfo(service_id)) || {};

      const conflict = await hasConflict({
        providerId: provider_id,
        scheduledAt,
        durationMinutes: serviceDuration,
      });
      if (conflict) {
        return res
          .status(409)
          .json({ error: "That time slot is no longer available." });
      }

      if (payment_type && payment_type !== "none" && Number(servicePrice) > 0) {
        try {
          await ensureProviderPaymentReady(provider_id);
        } catch (providerStripeError) {
          return res.status(providerStripeError.statusCode || 400).json({
            error:
              providerStripeError.message ||
              "Provider has not connected Stripe yet.",
          });
        }
      }

      const providerName = await getProviderName(provider_id);
      const clientName = await getClientName(clientId);
      const displayDate = new Date(scheduledAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      const displayTime = new Date(scheduledAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      let resolvedPaymentStatus = "unpaid";
      if (payment_type === "save_card" && stripe_payment_method_id) {
        resolvedPaymentStatus = "card_saved";
      } else if (payment_type === "deposit" && deposit_paid_cents > 0) {
        resolvedPaymentStatus = "deposit_paid";
      } else if (payment_type === "full" && stripe_payment_intent_id) {
        resolvedPaymentStatus = "paid";
      }

      const booking = await createBookingRecord({
        clientId,
        clientName,
        providerId: provider_id,
        providerName,
        serviceId: service_id || null,
        serviceName: serviceName || "Session",
        scheduledAt,
        serviceDuration,
        autoAccept: providerBookingRules.autoAccept,
        paymentStatus: resolvedPaymentStatus,
        paymentType: payment_type || "none",
        stripeSetupIntentId: stripe_setup_intent_id || null,
        stripePaymentMethodId: stripe_payment_method_id || null,
        stripePaymentIntentId: stripe_payment_intent_id || null,
        depositPaidCents: deposit_paid_cents || 0,
        servicePrice,
        message: message || null,
        requestedDate: requested_date,
        requestedTime: requested_time,
      });

      await afterBookingCreated({
        booking,
        clientId,
        clientName,
        providerId: provider_id,
        providerName,
        serviceName,
        scheduledAt,
        displayDate,
        displayTime,
        message: message || null,
        autoAccept: providerBookingRules.autoAccept,
        servicePreAppointmentInfo,
        now: getNowIso(),
      });

      return res.status(201).json({ booking });
    } catch (err) {
      return res.status(500).json({ error: "Failed to create time request." });
    }
  };
}
