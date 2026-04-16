-- Add currency to client_transactions.
-- client_transactions tracks client-side payment records per booking.
-- Adding currency allows transaction history to display amounts in the correct
-- denomination without mixing values across currencies.
--
-- Note: this column may already exist on some deployments with DEFAULT 'usd' (legacy).
-- The IF NOT EXISTS guard makes this migration safe to re-run.
--
-- NOTE: This migration covers client_transactions only.
-- The provider_earnings table is handled in 20260416034500_add_currency_to_provider_earnings.sql.

ALTER TABLE public.client_transactions
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'cad';

-- Backfill from the associated booking's currency where the transaction has a booking_id.
-- Rows without a booking_id keep the column default ('cad').
UPDATE public.client_transactions ct
SET currency = b.currency
FROM public.bookings b
WHERE ct.booking_id = b.id
  AND (ct.currency IS NULL OR ct.currency = 'usd');

COMMENT ON COLUMN public.client_transactions.currency IS
    'Lowercase ISO 4217 currency code for this transaction, copied from the booking. '
    'Nullable for legacy rows that predate multi-currency support.';
