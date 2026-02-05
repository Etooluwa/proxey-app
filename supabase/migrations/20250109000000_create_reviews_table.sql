-- ============================================
-- Create Reviews Table Migration
-- ============================================
-- This migration creates the reviews table to store client reviews
-- for providers. This enables:
-- 1. Real reviews on provider public profiles (replacing mock data)
-- 2. Rating calculations for providers
-- 3. Review management and display
-- ============================================

-- Drop existing table if it exists (with all dependencies)
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Drop function if it exists
DROP FUNCTION IF EXISTS public.handle_reviews_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_provider_rating() CASCADE;

-- Create reviews table to store client reviews for providers
CREATE TABLE public.reviews (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who wrote the review (client)
    client_id UUID NOT NULL,
    client_name TEXT,
    client_avatar TEXT,
    
    -- Who the review is for (provider)
    provider_id UUID NOT NULL,
    
    -- Optional: Link to the booking this review is for
    booking_id UUID,
    
    -- Optional: Link to the service that was reviewed
    service_id UUID,
    service_name TEXT,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    
    -- Provider response to review
    response TEXT,
    response_at TIMESTAMPTZ,
    
    -- Review status
    is_verified BOOLEAN DEFAULT false,  -- Verified purchase/booking
    is_visible BOOLEAN DEFAULT true,    -- Can be hidden by admin
    is_featured BOOLEAN DEFAULT false,  -- Featured on profile
    
    -- Helpful votes
    helpful_count INTEGER DEFAULT 0,
    
    -- Optional: Additional review details
    pros TEXT[],
    cons TEXT[],
    
    -- Metadata for additional flexible data
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for query performance
-- ============================================

-- Index on provider_id for fetching provider's reviews
CREATE INDEX idx_reviews_provider_id ON public.reviews(provider_id);

-- Index on client_id for fetching client's reviews
CREATE INDEX idx_reviews_client_id ON public.reviews(client_id);

-- Index on booking_id for linking to bookings
CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);

-- Index on rating for filtering/sorting by rating
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Index on is_visible for filtering visible reviews
CREATE INDEX idx_reviews_is_visible ON public.reviews(is_visible);

-- Composite index for common query: visible reviews by provider
CREATE INDEX idx_reviews_provider_visible ON public.reviews(provider_id, is_visible);

-- Index on created_at for chronological sorting
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Unique constraint: one review per client per booking
CREATE UNIQUE INDEX idx_reviews_unique_booking ON public.reviews(client_id, booking_id)
    WHERE booking_id IS NOT NULL;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view visible reviews
CREATE POLICY "reviews_select_visible_policy"
    ON public.reviews
    FOR SELECT
    USING (is_visible = true);

-- Policy: Clients can view all their own reviews (including hidden)
CREATE POLICY "reviews_select_own_client_policy"
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can view all reviews about them
CREATE POLICY "reviews_select_own_provider_policy"
    ON public.reviews
    FOR SELECT
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Clients can insert reviews
CREATE POLICY "reviews_insert_policy"
    ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Clients can update their own reviews (within time limit)
CREATE POLICY "reviews_update_client_policy"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (client_id::TEXT = auth.uid()::TEXT)
    WITH CHECK (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can update response on their reviews
CREATE POLICY "reviews_update_response_policy"
    ON public.reviews
    FOR UPDATE
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Clients can delete their own reviews
CREATE POLICY "reviews_delete_policy"
    ON public.reviews
    FOR DELETE
    TO authenticated
    USING (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Allow backend (public/service role) full read access
CREATE POLICY "reviews_backend_select_policy"
    ON public.reviews
    FOR SELECT
    TO public
    USING (true);

-- Policy: Allow backend to insert reviews
CREATE POLICY "reviews_backend_insert_policy"
    ON public.reviews
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Allow backend to update reviews
CREATE POLICY "reviews_backend_update_policy"
    ON public.reviews
    FOR UPDATE
    TO public
    USING (true);

-- Policy: Allow backend to delete reviews
CREATE POLICY "reviews_backend_delete_policy"
    ON public.reviews
    FOR DELETE
    TO public
    USING (true);

-- ============================================
-- Trigger for automatic updated_at
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_reviews_updated_at();

-- ============================================
-- Trigger to update provider rating
-- ============================================

-- Function to recalculate provider rating when reviews change
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    review_count INTEGER;
    target_provider_id UUID;
BEGIN
    -- Determine which provider to update
    IF TG_OP = 'DELETE' THEN
        target_provider_id := OLD.provider_id;
    ELSE
        target_provider_id := NEW.provider_id;
    END IF;

    -- Calculate average rating and count for visible reviews
    SELECT 
        COALESCE(AVG(rating), 5.0),
        COUNT(*)
    INTO avg_rating, review_count
    FROM public.reviews
    WHERE provider_id = target_provider_id
      AND is_visible = true;

    -- Update the provider's rating and review count
    UPDATE public.providers
    SET 
        rating = avg_rating,
        review_count = review_count,
        updated_at = NOW()
    WHERE user_id = target_provider_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Trigger to update provider rating on review changes
CREATE TRIGGER trigger_update_provider_rating_insert
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_provider_rating();

CREATE TRIGGER trigger_update_provider_rating_update
    AFTER UPDATE OF rating, is_visible ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_provider_rating();

CREATE TRIGGER trigger_update_provider_rating_delete
    AFTER DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_provider_rating();

-- ============================================
-- Optional: Add foreign key constraints
-- ============================================
-- Note: Uncomment if you want strict referential integrity

-- ALTER TABLE public.reviews
--     ADD CONSTRAINT fk_reviews_provider
--     FOREIGN KEY (provider_id)
--     REFERENCES public.providers(user_id)
--     ON DELETE CASCADE;

-- ALTER TABLE public.reviews
--     ADD CONSTRAINT fk_reviews_booking
--     FOREIGN KEY (booking_id)
--     REFERENCES public.bookings(id)
--     ON DELETE SET NULL;

-- ALTER TABLE public.reviews
--     ADD CONSTRAINT fk_reviews_service
--     FOREIGN KEY (service_id)
--     REFERENCES public.services(id)
--     ON DELETE SET NULL;

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON TABLE public.reviews IS 'Client reviews for providers - enables real reviews on profiles';
COMMENT ON COLUMN public.reviews.id IS 'Unique review identifier';
COMMENT ON COLUMN public.reviews.client_id IS 'User ID of the client who wrote the review';
COMMENT ON COLUMN public.reviews.client_name IS 'Display name of the reviewer (denormalized for performance)';
COMMENT ON COLUMN public.reviews.client_avatar IS 'Avatar URL of the reviewer (denormalized for performance)';
COMMENT ON COLUMN public.reviews.provider_id IS 'Provider user ID who received the review';
COMMENT ON COLUMN public.reviews.booking_id IS 'Optional link to the booking this review is for';
COMMENT ON COLUMN public.reviews.service_id IS 'Optional link to the specific service reviewed';
COMMENT ON COLUMN public.reviews.rating IS 'Rating from 1-5 stars';
COMMENT ON COLUMN public.reviews.title IS 'Optional review title/headline';
COMMENT ON COLUMN public.reviews.comment IS 'Review text/body';
COMMENT ON COLUMN public.reviews.response IS 'Provider response to the review';
COMMENT ON COLUMN public.reviews.response_at IS 'When the provider responded';
COMMENT ON COLUMN public.reviews.is_verified IS 'Whether this is a verified booking review';
COMMENT ON COLUMN public.reviews.is_visible IS 'Whether the review is publicly visible';
COMMENT ON COLUMN public.reviews.is_featured IS 'Whether the review is featured on the profile';
COMMENT ON COLUMN public.reviews.helpful_count IS 'Number of "helpful" votes from other users';
COMMENT ON COLUMN public.reviews.pros IS 'List of positive aspects mentioned';
COMMENT ON COLUMN public.reviews.cons IS 'List of negative aspects mentioned';
COMMENT ON COLUMN public.reviews.metadata IS 'Flexible JSON field for additional data';
