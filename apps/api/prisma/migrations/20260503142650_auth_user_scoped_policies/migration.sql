-- Auth-boundary read policies for membership and tenant.
--
-- The auth path (signup, login, /me, switch-tenant) needs to look up
-- "what tenants does THIS user belong to?" before any tenant context
-- exists. RLS scoped purely by tenantId blocks that.
--
-- We add a second session variable, app.user_id, that the auth code
-- sets via SET LOCAL just like app.tenant_id. The membership and tenant
-- policies accept reads when EITHER:
--   - the tenantId matches the active tenant context, OR
--   - the row belongs to the current user (membership.userId =
--     app.user_id, or tenant.id is a tenant the user is a member of).
--
-- This lets a user enumerate their own memberships and the tenants
-- behind them — never anyone else's.
--
-- Writes stay strict: WITH CHECK still requires tenantId =
-- current_tenant_id() (no foreign-tenant impersonation).

CREATE OR REPLACE FUNCTION current_user_id() RETURNS TEXT AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')
$$ LANGUAGE sql STABLE;

-- Membership: existing read policy is by tenant; add user-scoped read.
DROP POLICY IF EXISTS membership_isolation ON "membership";
CREATE POLICY membership_isolation ON "membership"
  USING (
    "tenantId" = current_tenant_id()
    OR "userId" = current_user_id()
  )
  WITH CHECK ("tenantId" = current_tenant_id());

-- Tenant: existing read policy is `id = current_tenant_id()`; allow a
-- user to also read tenants they're a member of (used by /me).
DROP POLICY IF EXISTS tenant_isolation ON "tenant";
CREATE POLICY tenant_isolation ON "tenant"
  USING (
    "id" = current_tenant_id()
    OR EXISTS (
      SELECT 1
      FROM "membership" m
      WHERE m."tenantId" = "tenant"."id"
        AND m."userId" = current_user_id()
    )
  )
  WITH CHECK ("id" = current_tenant_id() OR current_tenant_id() IS NULL);
