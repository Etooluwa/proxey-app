-- provider_earnings is used in two ways in the codebase:
-- 1. Aggregate row per provider (total_earned, pending_payout, transactions[]) — jobs/tips path
-- 2. Per-booking/per-tip insert rows (booking_id, gross_amount, net_amount, etc.) — completion path
--
-- The DB only had the aggregate columns. The per-booking columns have been missing,
-- causing silent insert failures on booking completion. This migration adds them.
-- currency column was already added under migration 20260416033321.

ALTER TABLE public.provider_earnings
    ADD COLUMN IF NOT EXISTS booking_id UUID,
    ADD COLUMN IF NOT EXISTS gross_amount INTEGER,
    ADD COLUMN IF NOT EXISTS platform_fee INTEGER,
    ADD COLUMN IF NOT EXISTS net_amount INTEGER,
    ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS type TEXT,
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Index for per-booking lookups
CREATE INDEX IF NOT EXISTS idx_provider_earnings_booking_id
    ON public.provider_earnings (booking_id)
    WHERE booking_id IS NOT NULL;

-- Backfill currency from linked bookings now that booking_id column exists
UPDATE public.provider_earnings pe
SET currency = b.currency
FROM public.bookings b
WHERE pe.booking_id = b.id
  AND b.currency IS NOT NULL
  AND b.currency <> ''
  AND pe.currency = 'cad'
  AND b.currency <> 'cad';
