-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    client_name TEXT,
    provider_id UUID NOT NULL,
    provider_name TEXT,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    client_unread_count INTEGER DEFAULT 0,
    provider_unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, provider_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'provider')),
    content TEXT,
    image_url TEXT,
    read_by_client BOOLEAN DEFAULT false,
    read_by_provider BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '6 months'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_provider_id ON public.conversations(provider_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON public.messages(expires_at);

-- Function to update conversation's updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_conversations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for conversations updated_at
CREATE TRIGGER set_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_conversations_updated_at();

-- Function to update conversation when a new message is sent
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update conversation with last message info
    UPDATE public.conversations
    SET
        last_message = COALESCE(NEW.content, 'Image'),
        last_message_at = NEW.created_at,
        client_unread_count = CASE
            WHEN NEW.sender_role = 'provider' THEN client_unread_count + 1
            ELSE client_unread_count
        END,
        provider_unread_count = CASE
            WHEN NEW.sender_role = 'client' THEN provider_unread_count + 1
            ELSE provider_unread_count
        END
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$;

-- Trigger to update conversation on new message
CREATE TRIGGER on_new_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(
    p_conversation_id UUID,
    p_user_role TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_user_role = 'client' THEN
        UPDATE public.messages
        SET read_by_client = true
        WHERE conversation_id = p_conversation_id
        AND sender_role = 'provider'
        AND read_by_client = false;

        UPDATE public.conversations
        SET client_unread_count = 0
        WHERE id = p_conversation_id;
    ELSIF p_user_role = 'provider' THEN
        UPDATE public.messages
        SET read_by_provider = true
        WHERE conversation_id = p_conversation_id
        AND sender_role = 'client'
        AND read_by_provider = false;

        UPDATE public.conversations
        SET provider_unread_count = 0
        WHERE id = p_conversation_id;
    END IF;
END;
$$;

-- Function to delete expired messages (run this periodically via cron or manually)
CREATE OR REPLACE FUNCTION public.delete_expired_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.messages
    WHERE expires_at < NOW();
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
    ON public.conversations
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR auth.uid() = provider_id
    );

CREATE POLICY "Users can create conversations"
    ON public.conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = client_id OR auth.uid() = provider_id
    );

CREATE POLICY "Users can update their own conversations"
    ON public.conversations
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = client_id OR auth.uid() = provider_id
    );

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (client_id = auth.uid() OR provider_id = auth.uid())
        )
    );

CREATE POLICY "Users can send messages in their conversations"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations
            WHERE id = conversation_id
            AND (client_id = auth.uid() OR provider_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Comments for documentation
COMMENT ON TABLE public.conversations IS 'Stores conversation threads between clients and providers';
COMMENT ON TABLE public.messages IS 'Stores individual messages with 6-month retention';
COMMENT ON COLUMN public.messages.expires_at IS 'Message will be auto-deleted after this timestamp (6 months from creation)';
COMMENT ON FUNCTION public.delete_expired_messages() IS 'Call this function periodically to clean up messages older than 6 months';
