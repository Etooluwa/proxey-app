-- Enable RLS on sms_pending_actions to satisfy Supabase security advisor.
-- No policies needed — this table is only accessed by the server via the
-- service role key, which bypasses RLS entirely.
ALTER TABLE public.sms_pending_actions ENABLE ROW LEVEL SECURITY;
