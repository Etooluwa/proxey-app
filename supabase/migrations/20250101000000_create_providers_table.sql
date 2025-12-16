-- Drop existing table if it exists (with all dependencies)
DROP TABLE IF EXISTS public.providers CASCADE;

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.handle_providers_updated_at() CASCADE;

-- Create providers table to store service provider profiles
CREATE TABLE public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    photo TEXT,
    bio TEXT,
    headline TEXT,
    category TEXT,
    categories TEXT[] DEFAULT '{}',
    city TEXT,
    location TEXT,
    hourly_rate INTEGER,
    rating NUMERIC(3,2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    services JSONB DEFAULT '[]',
    availability JSONB DEFAULT '{}',
    stripe_account_id TEXT,
    is_active BOOLEAN DEFAULT true,
    is_profile_complete BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    onboarding_completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_providers_user_id ON public.providers(user_id);
CREATE INDEX idx_providers_category ON public.providers(category);
CREATE INDEX idx_providers_is_active ON public.providers(is_active);
CREATE INDEX idx_providers_rating ON public.providers(rating DESC);

-- Enable Row Level Security
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read active providers
CREATE POLICY "providers_select_policy"
    ON public.providers
    FOR SELECT
    USING (is_active = true);

-- Policy: Allow authenticated users to insert/update/delete
CREATE POLICY "providers_all_policy"
    ON public.providers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_providers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_providers_updated_at
    BEFORE UPDATE ON public.providers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_providers_updated_at();
