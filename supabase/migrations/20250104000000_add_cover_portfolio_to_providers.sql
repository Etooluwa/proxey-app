-- Add coverPhoto and portfolioImages columns to providers table
ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS cover_photo TEXT,
ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]';

-- Add comment for documentation
COMMENT ON COLUMN public.providers.cover_photo IS 'Cover photo URL or base64 data for provider profile';
COMMENT ON COLUMN public.providers.portfolio_images IS 'Array of portfolio image URLs or base64 data';
