# ADR 0002 — Multi-tenancy via PostgreSQL Row-Level Security

- **Status:** Accepted
- **Date:** 2026-05-03
- **Phase:** 1 — Identity & multi-tenancy
- **Cardinal Rule:** R1

## Context

Selyn Suite is a multi-tenant SaaS for Moroccan SMEs. Each tenant's data is highly sensitive (salaries, RIB, CIN, fiscal IDs) and a single cross-tenant leak would be a regulatory and reputational catastrophe.

The brief mandates (§3 R1):
> Multi-tenant by `tenant_id` + PostgreSQL Row-Level Security. RLS policies enforce isolation at the DB level — application bugs cannot leak data across tenants.

We need a concrete, auditable implementation pattern.

## Decision

### Storage layout
- One database, one schema (`public`), one connection pool.
- Every tenant-scoped table has a non-nullable `tenantId` column (cuid foreign key to `tenant.id`).
- Tables NOT under RLS (intentional): `user`, `account`, `session`, `verification_token`, `recovery_code`. These are personal/auth-layer and predate the tenant context (e.g. login lookup happens before a tenant is known).

### Policy shape (verbatim from the migration)

```sql
ALTER TABLE "membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_isolation ON "membership"
  USING ("tenantId" = current_tenant_id())
  WITH CHECK ("tenantId" = current_tenant_id());
```

`FORCE` makes RLS apply to the table owner too. The app role (`selyn`) is **not** a superuser — superusers bypass RLS unconditionally. The local docker-init script and the production runbook both create the app role without `SUPERUSER`.

`current_tenant_id()` is a tiny SQL function that reads `app.tenant_id` from the session settings.

### Setting the context

Every request that touches tenant-scoped tables runs its DB work inside a transaction whose first statement is `SET LOCAL app.tenant_id = '...'`. We expose this via `TenantPrismaService.run(tenantId, work)`:

```ts
await tenantPrisma.run(currentTenantId, async (tx) => {
  return tx.salarie.findMany();
});
```

`tenantId` is validated against `^[A-Za-z0-9_-]{1,64}$` before being interpolated into the SQL string (Postgres rejects parameter binding for `SET`). Defense in depth — RLS would already block bad values, but the allowlist fails fast.

### What it protects against

Verified by the integration tests in `apps/api/test/cross-tenant-isolation.spec.ts`:

1. Reads without an `app.tenant_id` context return zero rows.
2. Reads in tenant A's context never see tenant B's rows (even by direct ID lookup).
3. Writes with tenant A's context cannot insert/update for tenant B (`WITH CHECK` clause).
4. Auditing across tenants is also isolated.
5. The `audit_log` append-only trigger blocks `UPDATE` and `DELETE` (R6).
6. `tenantId` injection attempts are rejected at the application layer.

These tests are a **CI gate** — failure blocks merging.

## Consequences

**Positive**
- Application bugs that forget a `where: { tenantId }` clause cannot leak data.
- Single Postgres backup, single migration history, no per-tenant database overhead.
- Easy to add new business tables: `ALTER TABLE foo ENABLE ROW LEVEL SECURITY; ALTER TABLE foo FORCE ROW LEVEL SECURITY; CREATE POLICY foo_isolation ON foo USING ("tenantId" = current_tenant_id()) WITH CHECK ("tenantId" = current_tenant_id());`.

**Negative**
- Every tenant-scoped query must run inside `tenantPrisma.run(...)`. Plain `prisma.foo.findMany()` returns zero rows. Lint rule will flag direct `prisma.<tenantTable>` access in Phase 4.
- RLS adds a small per-query overhead (~1–2%). Negligible at our scale.
- Connection pooling: each transaction gets a fresh `app.tenant_id` because we use `SET LOCAL`. The pool is shared across tenants safely.

## Alternatives considered

- **Schema-per-tenant** — rejected. Operationally heavy (migrations × N tenants), breaks point-in-time recovery for one tenant, breaks foreign keys for cross-tenant features (Selyn-managed reference data).
- **Database-per-tenant** — rejected. Same problems plus connection-count explosion.
- **Application-level filtering only** — rejected by R1. A single forgotten `where` clause leaks the whole table.
- **Postgres role-per-tenant** — rejected. Doesn't scale beyond a few hundred tenants without role bloat.

## Operational notes

- Production app role: created with `NOSUPERUSER NOCREATEROLE NOCREATEDB` (Phase 9 hardening). Today the local dev role has `CREATEDB` for migrations.
- New business tables MUST add their RLS policy in the same migration that creates the table.
- Backups: Postgres logical backup respects RLS only if the `app.tenant_id` is set. Backups run as a privileged role and intentionally bypass RLS (full dump).

## References

- Project brief §3 R1, §7
- Postgres docs: <https://www.postgresql.org/docs/16/ddl-rowsecurity.html>
- `apps/api/prisma/migrations/20260502214741_init_identity/migration.sql`
- `apps/api/src/infra/prisma/tenant-prisma.service.ts`
- `apps/api/test/cross-tenant-isolation.spec.ts`
