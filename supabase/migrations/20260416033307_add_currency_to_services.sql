-- Add currency to services
-- Each service inherits its currency from the provider's profile at creation time.
-- The value is snapshotted so that if a provider could ever change their currency
-- (only allowed before any active services exist), existing records stay consistent.

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'cad';

-- Backfill: join to provider_profiles and copy the provider's currency.
-- Falls back to 'cad' if no profile row exists yet.
UPDATE public.services s
SET currency = COALESCE(
    (SELECT pp.currency FROM public.provider_profiles pp WHERE pp.provider_id = s.provider_id),
    'cad'
);

COMMENT ON COLUMN public.services.currency IS
    'Lowercase ISO 4217 currency code inherited from provider_profiles.currency at service creation. '
    'Never manually editable by the provider — always set server-side.';
