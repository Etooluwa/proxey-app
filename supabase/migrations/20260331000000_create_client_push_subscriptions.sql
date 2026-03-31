CREATE TABLE IF NOT EXISTS public.client_push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_push_subscriptions_user_id
    ON public.client_push_subscriptions(user_id);

ALTER TABLE public.client_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push subscriptions"
    ON public.client_push_subscriptions FOR SELECT
    USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert client push subscriptions"
    ON public.client_push_subscriptions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update client push subscriptions"
    ON public.client_push_subscriptions FOR UPDATE
    USING (true);

CREATE POLICY "Users can delete their own push subscriptions"
    ON public.client_push_subscriptions FOR DELETE
    USING (auth.uid()::text = user_id::text);
