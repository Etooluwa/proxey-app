-- ============================================
-- Create Services Table Migration
-- ============================================
-- This migration creates the services table to store individual services
-- offered by providers. This is the single biggest blocker - it enables:
-- 1. Service management (ProviderServices.js CRUD)
-- 2. Booking flow service selection
-- 3. Provider public profile service listings
-- ============================================

-- Drop existing table if it exists (with all dependencies)
DROP TABLE IF EXISTS public.services CASCADE;

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.handle_services_updated_at() CASCADE;

-- Create services table to store provider-offered services
CREATE TABLE public.services (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Provider who owns this service (references providers table)
    provider_id UUID NOT NULL,
    
    -- Service details
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    
    -- Pricing (in cents to avoid floating point issues)
    base_price INTEGER NOT NULL CHECK (base_price >= 0),
    unit TEXT DEFAULT 'visit',
    
    -- Duration in minutes
    duration INTEGER DEFAULT 60 CHECK (duration > 0),
    
    -- Optional fields for enhanced service info
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata for additional flexible data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for query performance
-- ============================================

-- Index on provider_id for fetching provider's services
CREATE INDEX idx_services_provider_id ON public.services(provider_id);

-- Index on category for filtering by category
CREATE INDEX idx_services_category ON public.services(category);

-- Index on is_active for filtering active services
CREATE INDEX idx_services_is_active ON public.services(is_active);

-- Composite index for common query: active services by provider
CREATE INDEX idx_services_provider_active ON public.services(provider_id, is_active);

-- Index on base_price for price range filtering
CREATE INDEX idx_services_base_price ON public.services(base_price);

-- Full text search index on name and description
CREATE INDEX idx_services_search ON public.services USING gin(
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active services (for browse/search)
CREATE POLICY "services_select_active_policy"
    ON public.services
    FOR SELECT
    USING (is_active = true);

-- Policy: Providers can view all their own services (including inactive)
CREATE POLICY "services_select_own_policy"
    ON public.services
    FOR SELECT
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can insert their own services
CREATE POLICY "services_insert_policy"
    ON public.services
    FOR INSERT
    TO authenticated
    WITH CHECK (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can update their own services
CREATE POLICY "services_update_policy"
    ON public.services
    FOR UPDATE
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT)
    WITH CHECK (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can delete their own services
CREATE POLICY "services_delete_policy"
    ON public.services
    FOR DELETE
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Allow backend (public/service role) full read access
CREATE POLICY "services_backend_select_policy"
    ON public.services
    FOR SELECT
    TO public
    USING (true);

-- Policy: Allow backend to insert services (for seeding/admin)
CREATE POLICY "services_backend_insert_policy"
    ON public.services
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow backend to update services
CREATE POLICY "services_backend_update_policy"
    ON public.services
    FOR UPDATE
    TO public
    USING (true);

-- Policy: Allow backend to delete services
CREATE POLICY "services_backend_delete_policy"
    ON public.services
    FOR DELETE
    TO public
    USING (true);

-- ============================================
-- Trigger for automatic updated_at
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_services_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_services_updated_at();

-- ============================================
-- Optional: Add foreign key constraint
-- ============================================
-- Note: Uncomment if you want strict referential integrity
-- This requires the providers table to exist first

-- ALTER TABLE public.services
--     ADD CONSTRAINT fk_services_provider
--     FOREIGN KEY (provider_id)
--     REFERENCES public.providers(user_id)
--     ON DELETE CASCADE;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.services IS 'Services offered by providers - the core service catalog';
COMMENT ON COLUMN public.services.id IS 'Unique service identifier';
COMMENT ON COLUMN public.services.provider_id IS 'Provider user ID who offers this service';
COMMENT ON COLUMN public.services.name IS 'Display name of the service';
COMMENT ON COLUMN public.services.description IS 'Detailed description of what the service includes';
COMMENT ON COLUMN public.services.category IS 'Service category for filtering and organization';
COMMENT ON COLUMN public.services.base_price IS 'Base price in cents (e.g., 12000 = $120.00)';
COMMENT ON COLUMN public.services.unit IS 'Pricing unit (e.g., "visit", "hour", "session")';
COMMENT ON COLUMN public.services.duration IS 'Typical duration in minutes';
COMMENT ON COLUMN public.services.is_active IS 'Whether service is currently available for booking';
COMMENT ON COLUMN public.services.image_url IS 'Optional image URL for the service';
COMMENT ON COLUMN public.services.tags IS 'Optional tags for enhanced search/filtering';
COMMENT ON COLUMN public.services.metadata IS 'Flexible JSON field for additional data';
