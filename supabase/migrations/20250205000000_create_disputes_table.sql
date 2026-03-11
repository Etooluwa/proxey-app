-- ============================================
-- Create Disputes Table Migration
-- ============================================
-- Enables dispute resolution workflow between clients and providers
-- with admin review and Stripe refund integration

-- Drop existing objects if they exist
DROP TABLE IF EXISTS public.disputes CASCADE;
DROP FUNCTION IF EXISTS public.handle_disputes_updated_at() CASCADE;

-- ============================================
-- Create Disputes Table
-- ============================================
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Booking reference
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  -- Who opened the dispute
  opened_by UUID NOT NULL,
  opened_by_role TEXT NOT NULL CHECK (opened_by_role IN ('client', 'provider')),

  -- Dispute details
  reason TEXT NOT NULL CHECK (reason IN (
    'service_not_provided',
    'poor_quality',
    'no_show_provider',
    'no_show_client',
    'wrong_service',
    'billing_issue',
    'other'
  )),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',

  -- Response from other party
  response_description TEXT,
  response_evidence_urls TEXT[] DEFAULT '{}',
  responded_at TIMESTAMPTZ,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),

  -- Admin resolution
  resolution TEXT CHECK (resolution IN ('full_refund', 'partial_refund', 'payment_released', 'dismissed')),
  resolution_amount INTEGER, -- cents (for partial refund)
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,

  -- Stripe refund tracking
  refund_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Create Indexes
-- ============================================
CREATE INDEX idx_disputes_booking_id ON public.disputes(booking_id);
CREATE INDEX idx_disputes_status ON public.disputes(status);
CREATE INDEX idx_disputes_opened_by ON public.disputes(opened_by);
CREATE INDEX idx_disputes_created_at ON public.disputes(created_at DESC);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Policy: Users can view disputes on bookings they're involved in
CREATE POLICY "Users can view their disputes"
  ON public.disputes
  FOR SELECT
  TO authenticated
  USING (
    opened_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
      AND (b.client_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Policy: Users can create disputes on their bookings
CREATE POLICY "Users can create disputes on their bookings"
  ON public.disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    opened_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND (b.client_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Policy: Other party can respond to dispute
CREATE POLICY "Other party can respond to dispute"
  ON public.disputes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
      AND (
        (disputes.opened_by_role = 'client' AND b.provider_id = auth.uid()) OR
        (disputes.opened_by_role = 'provider' AND b.client_id = auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = disputes.booking_id
      AND (
        (disputes.opened_by_role = 'client' AND b.provider_id = auth.uid()) OR
        (disputes.opened_by_role = 'provider' AND b.client_id = auth.uid())
      )
    )
  );

-- Policy: Backend/public role has full access (for admin operations)
CREATE POLICY "Backend full access to disputes"
  ON public.disputes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================
-- Updated At Trigger
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_disputes_updated_at();

-- ============================================
-- Column Comments
-- ============================================
COMMENT ON TABLE public.disputes IS 'Dispute resolution records between clients and providers';
COMMENT ON COLUMN public.disputes.booking_id IS 'Reference to the disputed booking';
COMMENT ON COLUMN public.disputes.opened_by IS 'User ID who opened the dispute';
COMMENT ON COLUMN public.disputes.opened_by_role IS 'Role of user who opened: client or provider';
COMMENT ON COLUMN public.disputes.reason IS 'Category of dispute reason';
COMMENT ON COLUMN public.disputes.description IS 'Detailed description from opener';
COMMENT ON COLUMN public.disputes.evidence_urls IS 'Array of image URLs as evidence';
COMMENT ON COLUMN public.disputes.response_description IS 'Response from other party';
COMMENT ON COLUMN public.disputes.response_evidence_urls IS 'Evidence from responding party';
COMMENT ON COLUMN public.disputes.status IS 'Current status: open, under_review, resolved, dismissed';
COMMENT ON COLUMN public.disputes.resolution IS 'Resolution type: full_refund, partial_refund, payment_released, dismissed';
COMMENT ON COLUMN public.disputes.resolution_amount IS 'Amount in cents for partial refunds';
COMMENT ON COLUMN public.disputes.resolution_notes IS 'Admin notes on resolution';
COMMENT ON COLUMN public.disputes.refund_id IS 'Stripe refund ID if refund was issued';
