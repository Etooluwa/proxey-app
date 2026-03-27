-- ============================================
-- Migration: Add reviewed_at to bookings
-- ============================================
-- Supports the client review flow:
-- - reviewed_at is set when a client submits a review for a booking
-- - Allows the app to know whether a review prompt should still be shown

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.bookings.reviewed_at IS 'Timestamp of when the client submitted a review for this booking. NULL = not yet reviewed.';

-- Index for quickly finding unreviewed completed bookings per client
CREATE INDEX IF NOT EXISTS idx_bookings_reviewed_at
  ON public.bookings (client_id, status, reviewed_at)
  WHERE status = 'completed';
