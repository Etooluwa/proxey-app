-- Create time_requests table for client appointment requests
CREATE TABLE IF NOT EXISTS public.time_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    client_name TEXT,
    client_email TEXT,
    client_phone TEXT,
    provider_id UUID NOT NULL,
    requested_date DATE NOT NULL,
    requested_time TIME NOT NULL,
    requested_datetime TIMESTAMPTZ NOT NULL,
    service_id TEXT,
    service_name TEXT,
    duration_minutes INTEGER DEFAULT 60,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    provider_response TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_time_requests_client_id ON public.time_requests(client_id);
CREATE INDEX idx_time_requests_provider_id ON public.time_requests(provider_id);
CREATE INDEX idx_time_requests_status ON public.time_requests(status);
CREATE INDEX idx_time_requests_requested_datetime ON public.time_requests(requested_datetime);

-- Enable Row Level Security
ALTER TABLE public.time_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own requests
CREATE POLICY "time_requests_client_select"
    ON public.time_requests
    FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

-- Policy: Providers can view requests sent to them
CREATE POLICY "time_requests_provider_select"
    ON public.time_requests
    FOR SELECT
    TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    ));

-- Policy: Clients can insert their own requests
CREATE POLICY "time_requests_client_insert"
    ON public.time_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

-- Policy: Clients can update their own requests (to cancel)
CREATE POLICY "time_requests_client_update"
    ON public.time_requests
    FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- Policy: Providers can update requests sent to them (to accept/decline)
CREATE POLICY "time_requests_provider_update"
    ON public.time_requests
    FOR UPDATE
    TO authenticated
    USING (provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    ))
    WITH CHECK (provider_id IN (
        SELECT id FROM public.providers WHERE user_id = auth.uid()
    ));

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_time_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER set_time_requests_updated_at
    BEFORE UPDATE ON public.time_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_time_requests_updated_at();
