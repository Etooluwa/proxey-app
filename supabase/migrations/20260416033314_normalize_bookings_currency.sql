-- Normalize bookings.currency to NOT NULL with 'cad' default
-- The bookings table already had a currency column (TEXT, DEFAULT 'USD', nullable).
-- This migration:
--   1. Sets the correct lowercase default 'cad'
--   2. Backfills NULL rows and stale 'USD' rows using the booking's service currency,
--      then the provider's profile currency, then 'cad' as final fallback
--   3. Adds the NOT NULL constraint

-- Step 1: backfill NULLs and old 'USD' default from the service/provider chain
UPDATE public.bookings b
SET currency = COALESCE(
    -- Prefer the service's own currency (already backfilled in previous migration)
    NULLIF(
        (SELECT s.currency FROM public.services s WHERE s.id = b.service_id),
        ''
    ),
    -- Fall back to provider profile currency
    NULLIF(
        (SELECT pp.currency FROM public.provider_profiles pp WHERE pp.provider_id = b.provider_id),
        ''
    ),
    -- Final fallback
    'cad'
)
WHERE b.currency IS NULL OR b.currency = 'USD';

-- Step 2: set the correct default going forward
ALTER TABLE public.bookings
    ALTER COLUMN currency SET DEFAULT 'cad';

-- Step 3: enforce NOT NULL (safe now that backfill is done)
ALTER TABLE public.bookings
    ALTER COLUMN currency SET NOT NULL;

COMMENT ON COLUMN public.bookings.currency IS
    'Lowercase ISO 4217 currency code snapshotted from services.currency at booking creation. '
    'Immutable after booking is created — all charges for this booking use this currency.';
