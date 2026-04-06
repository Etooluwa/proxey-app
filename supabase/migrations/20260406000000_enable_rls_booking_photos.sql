-- Enable RLS on booking_photos (was disabled with zero policies)
ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by backend via service role key)
CREATE POLICY "Service role full access to booking_photos"
ON booking_photos
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Providers can view photos from their own bookings
CREATE POLICY "Providers can view own booking photos"
ON booking_photos
FOR SELECT
USING (provider_id = auth.uid()::text);

-- Providers can insert photos for their own bookings
CREATE POLICY "Providers can insert own booking photos"
ON booking_photos
FOR INSERT
WITH CHECK (provider_id = auth.uid()::text);

-- Providers can delete their own booking photos
CREATE POLICY "Providers can delete own booking photos"
ON booking_photos
FOR DELETE
USING (provider_id = auth.uid()::text);

-- Clients can view photos from their own bookings
CREATE POLICY "Clients can view booking photos for their bookings"
ON booking_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_photos.booking_id
    AND bookings.client_id = auth.uid()
  )
);
