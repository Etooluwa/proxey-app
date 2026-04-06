export function createCompleteBookingHandler({
  getBookingId,
  getUserId,
  fetchBooking = async () => null,
  getServiceInfo = async () => null,
  markPaymentFailed = async () => {},
  notifyProviderChargeResult = async () => {},
  notifyClientPaymentFailed = async () => {},
  getProviderStripeAccountId = async () => null,
  getClientStripeCustomerId = async () => null,
  chargeCompletion = async () => null,
  markCompleted = async () => {},
  createEarningsRecord = async () => {},
  createInvoice = async () => ({ invoiceNumber: null, invoiceId: null }),
  notifyClientCompletion = async () => {},
  getNowIso = () => new Date().toISOString(),
  platformFeeRate = 0.1,
}) {
  return async function handleCompleteBooking(req, res) {
    const bookingId = getBookingId(req);
    const requestingUserId = getUserId(req);

    try {
      const booking = await fetchBooking(bookingId);
      if (!booking) return res.status(404).json({ error: "Booking not found." });
      if (booking.status === "completed") {
        return res.status(409).json({ error: "Already completed." });
      }
      if (booking.provider_id !== requestingUserId) {
        return res.status(403).json({ error: "Not authorized to complete this booking." });
      }

      const serviceInfo = await getServiceInfo(booking.service_id);
      const now = getNowIso();
      const depositPaidCents = booking.deposit_paid_cents || 0;
      const totalCents = Math.round(Number(booking.price) || 0);
      const remainingCents = Math.max(totalCents - depositPaidCents, 0);
      let chargedOnCompletionCents = 0;
      let paymentStatusAfterCompletion = booking.payment_status || "unpaid";
      let completionChargeIntentId = null;
      const requiresCompletionCharge =
        (booking.payment_type === "deposit" &&
          depositPaidCents > 0 &&
          remainingCents > 0) ||
        (booking.payment_type === "save_card" && totalCents > 0);

      if (requiresCompletionCharge && !booking.stripe_payment_method_id) {
        await markPaymentFailed({ bookingId, now });
        await notifyProviderChargeResult({
          booking,
          paymentStatus: "payment_failed",
          serviceName: serviceInfo?.name || booking.service_name,
          clientName: booking.client_name,
          failureReason: "No saved payment method was found for this booking.",
        });
        return res.status(400).json({
          error:
            "Charge failed, so this booking was not marked complete. No saved payment method was found for this booking.",
        });
      }

      if (requiresCompletionCharge) {
        try {
          const stripeAccountId = await getProviderStripeAccountId(
            booking.provider_id
          );
          const customerId = await getClientStripeCustomerId(booking.client_id);
          const serviceChargeCents =
            booking.payment_type === "save_card" ? totalCents : remainingCents;
          const platformFeeRemaining = Math.round(
            serviceChargeCents * platformFeeRate
          );
          const totalRemainingCharge = serviceChargeCents + platformFeeRemaining;

          const paymentIntent = await chargeCompletion({
            booking,
            serviceChargeCents,
            totalRemainingCharge,
            stripeAccountId,
            customerId,
          });
          completionChargeIntentId = paymentIntent?.id || null;
          paymentStatusAfterCompletion = "paid";
          chargedOnCompletionCents = serviceChargeCents;
        } catch (stripeErr) {
          await markPaymentFailed({ bookingId, now });
          await notifyProviderChargeResult({
            booking,
            paymentStatus: "payment_failed",
            serviceName: serviceInfo?.name || booking.service_name,
            clientName: booking.client_name,
            failureReason:
              stripeErr.message || "Payment could not be processed.",
          });
          await notifyClientPaymentFailed({ booking, bookingId, stripeErr });
          const statusCode =
            stripeErr.type === "StripeCardError" ? 402 : 500;
          return res.status(statusCode).json({
            error:
              stripeErr.message ||
              "Charge failed, so this booking was not marked complete.",
          });
        }
      } else if (
        booking.payment_type === "full" ||
        (booking.payment_type === "deposit" &&
          remainingCents === 0 &&
          depositPaidCents > 0)
      ) {
        paymentStatusAfterCompletion = "paid";
      }

      await markCompleted({
        bookingId,
        now,
        paymentStatusAfterCompletion,
      });

      if (requiresCompletionCharge) {
        await notifyProviderChargeResult({
          booking,
          paymentStatus: "paid",
          serviceName: serviceInfo?.name || booking.service_name,
          clientName: booking.client_name,
          chargedAmountCents: chargedOnCompletionCents,
        });
      }

      const grossDollars = +(totalCents / 100).toFixed(2);
      const platformFeeDollars = +(grossDollars * platformFeeRate).toFixed(2);
      const netAmount = grossDollars;

      await createEarningsRecord({
        booking,
        bookingId,
        now,
        grossAmountCents: Math.round(grossDollars * 100),
        platformFeeCents: Math.round(platformFeeDollars * 100),
        netAmountCents: Math.round(netAmount * 100),
      });

      const { invoiceNumber, invoiceId } = await createInvoice({
        booking,
        bookingId,
        now,
        serviceInfo,
        totalCents,
        remainingCents,
        depositPaidCents,
      });

      await notifyClientCompletion({
        booking,
        bookingId,
        serviceInfo,
        invoiceNumber,
        invoiceId,
        totalCents,
      });

      return res.status(200).json({
        ok: true,
        payout: {
          grossAmount: grossDollars,
          depositCollected: +(depositPaidCents / 100).toFixed(2),
          remainingCharged: +(chargedOnCompletionCents / 100).toFixed(2),
          platformFee: platformFeeDollars,
          netAmount,
          paymentStatus: paymentStatusAfterCompletion,
          paymentIntentId: completionChargeIntentId,
        },
        invoice_number: invoiceNumber,
        invoice_id: invoiceId,
      });
    } catch {
      return res.status(500).json({ error: "Failed to complete booking." });
    }
  };
}
