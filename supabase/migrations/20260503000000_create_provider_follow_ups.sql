-- provider_follow_ups: stores scheduled follow-up emails from providers to specific clients.
-- Covers client-level (manual, one-shot) follow-ups.
-- Service-level follow-ups are tracked via bookings.metadata->>'followUpSentAt'.

CREATE TABLE IF NOT EXISTS provider_follow_ups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID NOT NULL,
  client_id     UUID NOT NULL,
  subject       TEXT,
  message       TEXT,
  send_at       TIMESTAMPTZ NOT NULL,
  sent_at       TIMESTAMPTZ,
  cancelled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS provider_follow_ups_provider_idx ON provider_follow_ups (provider_id);
CREATE INDEX IF NOT EXISTS provider_follow_ups_send_at_idx  ON provider_follow_ups (send_at) WHERE sent_at IS NULL AND cancelled_at IS NULL;

ALTER TABLE provider_follow_ups ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own follow-ups
CREATE POLICY "provider_follow_ups_provider_select"
  ON provider_follow_ups FOR SELECT
  USING (provider_id = auth.uid());

CREATE POLICY "provider_follow_ups_provider_insert"
  ON provider_follow_ups FOR INSERT
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "provider_follow_ups_provider_update"
  ON provider_follow_ups FOR UPDATE
  USING (provider_id = auth.uid());

CREATE POLICY "provider_follow_ups_provider_delete"
  ON provider_follow_ups FOR DELETE
  USING (provider_id = auth.uid());

-- RPC used by the service-level follow-up scheduler on the server.
-- Returns completed bookings where the service has follow-up enabled and
-- the delay has elapsed, but the follow-up hasn't been sent yet.
-- Runs as SECURITY DEFINER so the server's service-role key can call it.
CREATE OR REPLACE FUNCTION get_service_followup_candidates()
RETURNS TABLE (
  id            UUID,
  client_id     UUID,
  provider_id   UUID,
  service_name  TEXT,
  completed_at  TIMESTAMPTZ,
  booking_meta  JSONB,
  service_meta  JSONB
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    b.id,
    b.client_id,
    b.provider_id,
    b.service_name,
    b.completed_at,
    b.metadata  AS booking_meta,
    s.metadata  AS service_meta
  FROM bookings b
  JOIN services s ON s.id = b.service_id
  WHERE b.status = 'completed'
    AND b.completed_at IS NOT NULL
    AND (b.metadata->>'followUpSentAt') IS NULL
    AND (s.metadata->'followUp'->>'enabled')::boolean = true
    AND b.completed_at <= NOW() - (
          (s.metadata->'followUp'->>'delayDays')::int * interval '1 day'
        );
$$;
