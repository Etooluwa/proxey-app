-- Create promotions table for provider promotional campaigns
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    promo_code TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
    applicable_services TEXT[] DEFAULT '{}',
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_promo_code UNIQUE (provider_id, promo_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promotions_provider_id ON public.promotions(provider_id);
CREATE INDEX IF NOT EXISTS idx_promotions_promo_code ON public.promotions(promo_code);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON public.promotions(is_active);

-- Enable Row Level Security
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view active promotions
CREATE POLICY "Active promotions are viewable by authenticated users"
    ON public.promotions
    FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Policy: Providers can view their own promotions (active or inactive)
CREATE POLICY "Providers can view own promotions"
    ON public.promotions
    FOR SELECT
    USING (true);

-- Policy: Providers can create their own promotions
CREATE POLICY "Providers can create own promotions"
    ON public.promotions
    FOR INSERT
    WITH CHECK (true);

-- Policy: Providers can update their own promotions
CREATE POLICY "Providers can update own promotions"
    ON public.promotions
    FOR UPDATE
    USING (true);

-- Policy: Providers can delete their own promotions
CREATE POLICY "Providers can delete own promotions"
    ON public.promotions
    FOR DELETE
    USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_promotions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_promotions_updated_at
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_promotions_updated_at();
