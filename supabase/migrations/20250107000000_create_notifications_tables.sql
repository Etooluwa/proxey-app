-- Create notifications table for providers
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    request_id UUID,
    booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table for clients
CREATE TABLE IF NOT EXISTS public.client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    request_id UUID,
    booking_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_provider_id ON public.notifications(provider_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_client_notifications_user_id ON public.client_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_client_notifications_created_at ON public.client_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_notifications_is_read ON public.client_notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider notifications (cast UUID to text for comparison)
CREATE POLICY "Providers can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid()::text = provider_id::text);

CREATE POLICY "Providers can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid()::text = provider_id::text);

CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Providers can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid()::text = provider_id::text);

-- RLS Policies for client notifications (cast UUID to text for comparison)
CREATE POLICY "Users can view their own notifications"
    ON public.client_notifications FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own notifications"
    ON public.client_notifications FOR UPDATE
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert client notifications"
    ON public.client_notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications"
    ON public.client_notifications FOR DELETE
    USING (auth.uid()::text = user_id::text);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_notifications;
