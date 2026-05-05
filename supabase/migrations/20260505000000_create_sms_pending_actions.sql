-- sms_pending_actions: tracks outbound SMS messages that expect a YES/NO reply.
-- The inbound Telnyx webhook looks up rows by phone number to match replies
-- back to the right booking.

CREATE TABLE IF NOT EXISTS sms_pending_actions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  booking_id  UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'booking_decision',
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_pending_actions_phone_idx
  ON sms_pending_actions (phone)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS sms_pending_actions_booking_idx
  ON sms_pending_actions (booking_id);

-- No RLS needed — this table is only accessed by the server via the service role key.
