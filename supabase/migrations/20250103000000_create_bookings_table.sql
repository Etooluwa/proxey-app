-- Create bookings/appointments table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Client information
    client_id UUID NOT NULL,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,

    -- Provider information
    provider_id UUID NOT NULL,
    provider_name TEXT,

    -- Service details
    service_id UUID,
    service_name TEXT NOT NULL,
    service_description TEXT,

    -- Booking details
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 60, -- in minutes
    location TEXT,
    address TEXT,
    notes TEXT,

    -- Pricing
    price INTEGER, -- in cents
    currency TEXT DEFAULT 'USD',

    -- Status
    status TEXT NOT NULL DEFAULT 'pending',
    -- Possible values: pending, confirmed, active, completed, cancelled, declined

    -- Payment
    payment_status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON public.bookings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own bookings (as client)
CREATE POLICY "Users can view own bookings as client"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can view bookings assigned to them
CREATE POLICY "Providers can view assigned bookings"
    ON public.bookings
    FOR SELECT
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Public can view bookings (for backend operations)
CREATE POLICY "Allow backend read access"
    ON public.bookings
    FOR SELECT
    TO public
    USING (true);

-- Policy: Authenticated users can create bookings
CREATE POLICY "Authenticated users can create bookings"
    ON public.bookings
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow backend to create bookings
CREATE POLICY "Allow backend create access"
    ON public.bookings
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Clients can update their own bookings
CREATE POLICY "Clients can update own bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (client_id::TEXT = auth.uid()::TEXT);

-- Policy: Providers can update assigned bookings
CREATE POLICY "Providers can update assigned bookings"
    ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (provider_id::TEXT = auth.uid()::TEXT);

-- Policy: Allow backend to update bookings
CREATE POLICY "Allow backend update access"
    ON public.bookings
    FOR UPDATE
    TO public
    USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_bookings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_bookings_updated_at();
