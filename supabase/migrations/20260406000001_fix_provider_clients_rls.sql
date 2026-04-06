-- Replace overly permissive provider_clients policy (qual: true = everyone)
-- with owner-scoped policies
DROP POLICY IF EXISTS "Backend full access" ON provider_clients;

-- Service role full access (used by backend via service role key)
CREATE POLICY "Service role full access to provider_clients"
ON provider_clients
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Providers can view their own client relationships
CREATE POLICY "Providers can view own clients"
ON provider_clients
FOR SELECT
USING (provider_id = auth.uid());

-- Clients can view their own provider relationships
CREATE POLICY "Clients can view own providers"
ON provider_clients
FOR SELECT
USING (client_id = auth.uid());
