ALTER TABLE IF EXISTS public.provider_clients
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'booking';

UPDATE public.provider_clients
SET source = COALESCE(source, 'booking')
WHERE source IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'unique_provider_client'
    ) THEN
        ALTER TABLE public.provider_clients
        ADD CONSTRAINT unique_provider_client UNIQUE (provider_id, client_id);
    END IF;
END $$;
