-- Add currency to provider_profiles
-- Providers set their billing currency once during onboarding.
-- All their services and future bookings inherit this value.
-- Allowed values are lowercase ISO 4217 codes (e.g. 'cad', 'usd', 'gbp').

ALTER TABLE public.provider_profiles
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'cad';

-- Backfill: any existing provider profiles get 'cad' (already the column default,
-- but explicit for clarity in case the column was added as nullable first).
UPDATE public.provider_profiles
SET currency = 'cad'
WHERE currency IS NULL;

COMMENT ON COLUMN public.provider_profiles.currency IS
    'Lowercase ISO 4217 currency code for this provider (e.g. cad, usd, gbp). '
    'Locked after the provider has active services or bookings.';
