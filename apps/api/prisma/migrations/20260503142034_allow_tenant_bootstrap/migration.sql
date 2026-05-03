-- Allow tenant self-bootstrap during signup.
--
-- The init_identity migration locked tenant INSERTs to a row whose `id`
-- equals current_tenant_id(). That works for impersonation defence, but
-- breaks signup: a brand-new user has no app.tenant_id yet, so the WITH
-- CHECK clause would reject the very first tenant insert.
--
-- We relax the WITH CHECK to also accept inserts when the session has no
-- tenant context (current_tenant_id() IS NULL). The USING clause stays
-- strict, so reads/updates/deletes still require an explicit context —
-- only INSERT into tenant from a fresh session is now permitted.
--
-- The signup endpoint is @Public(); WAF + rate-limit will keep it from
-- being abused (Phase 9 hardening).

DROP POLICY IF EXISTS tenant_isolation ON "tenant";

CREATE POLICY tenant_isolation ON "tenant"
  USING ("id" = current_tenant_id())
  WITH CHECK ("id" = current_tenant_id() OR current_tenant_id() IS NULL);
