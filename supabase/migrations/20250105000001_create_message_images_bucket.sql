-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
CREATE POLICY "Anyone can view message images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'message-images');

CREATE POLICY "Authenticated users can upload message images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'message-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own message images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'message-images'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Add size limit (5MB per image)
CREATE POLICY "Limit upload size to 5MB"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'message-images'
        AND octet_length(decode(encode(content, 'base64'), 'base64')) < 5242880
    );
