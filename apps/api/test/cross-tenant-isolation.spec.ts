/**
 * Cardinal Rule R1 — cross-tenant isolation tests.
 *
 * These tests prove that PostgreSQL Row-Level Security blocks every kind of
 * cross-tenant access an attacker (or a buggy code path) might attempt:
 *
 *   1. Reads without an `app.tenant_id` context return zero rows.
 *   2. Reads with tenant A's context never see tenant B's rows.
 *   3. Writes with tenant A's context cannot insert/update for tenant B
 *      (WITH CHECK clause).
 *   4. The audit_log table is append-only — UPDATE and DELETE raise.
 *   5. Identifier-injection attempts on tenantId are rejected by
 *      TenantPrismaService.
 *
 * If any of these tests fail, isolation is broken — do not ship.
 *
 * Requires: a running Postgres on DATABASE_URL with the migration applied,
 * and the app role MUST NOT be a superuser (selyn role created without the
 * SUPERUSER attribute — see docker-init/postgres/01-app-role.sql).
 */

import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../src/infra/prisma/prisma.service';
import { TenantPrismaService } from '../src/infra/prisma/tenant-prisma.service';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://selyn:selyn_dev_password@localhost:5432/selyn_test';

const isCi = process.env.CI === 'true';
const skipIfNoDb = !process.env.DATABASE_URL && !isCi;

const describeOrSkip = skipIfNoDb ? describe.skip : describe;

describeOrSkip('Cardinal Rule R1 — cross-tenant isolation', () => {
  let prisma: PrismaService;
  let tenantPrisma: TenantPrismaService;

  const TENANT_A = 'cuid_isolation_a';
  const TENANT_B = 'cuid_isolation_b';

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = new PrismaService();
    tenantPrisma = new TenantPrismaService(prisma);
    await prisma.$connect();
    await prisma.$executeRawUnsafe(`SET app.tenant_id = ''`);
  });

  afterAll(async () => {
    // TRUNCATE bypasses both RLS and per-row triggers (so the audit_log
    // append-only trigger does not block test cleanup).
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE audit_log, invitation, membership, tenant RESTART IDENTITY CASCADE`,
    );
    await prisma.user.deleteMany({
      where: { email: { in: ['a@isolation.test', 'b@isolation.test'] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Seed two tenants and one user per tenant. Done with a privileged
    // client because seeding crosses tenant boundaries.
    const seed = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    try {
      await seed.user.upsert({
        where: { email: 'a@isolation.test' },
        update: {},
        create: { id: 'usr_a', email: 'a@isolation.test' },
      });
      await seed.user.upsert({
        where: { email: 'b@isolation.test' },
        update: {},
        create: { id: 'usr_b', email: 'b@isolation.test' },
      });
      await seed.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${TENANT_A}'`);
        await tx.tenant.upsert({
          where: { id: TENANT_A },
          update: {},
          create: {
            id: TENANT_A,
            slug: 'iso-a',
            name: 'Isolation A',
            raisonSociale: 'Isolation A SARL',
            formeJuridique: 'SARL',
          },
        });
        await tx.membership.upsert({
          where: { userId_tenantId: { userId: 'usr_a', tenantId: TENANT_A } },
          update: {},
          create: { userId: 'usr_a', tenantId: TENANT_A, role: 'ADMIN' },
        });
      });
      await seed.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${TENANT_B}'`);
        await tx.tenant.upsert({
          where: { id: TENANT_B },
          update: {},
          create: {
            id: TENANT_B,
            slug: 'iso-b',
            name: 'Isolation B',
            raisonSociale: 'Isolation B SARL',
            formeJuridique: 'SARL',
          },
        });
        await tx.membership.upsert({
          where: { userId_tenantId: { userId: 'usr_b', tenantId: TENANT_B } },
          update: {},
          create: { userId: 'usr_b', tenantId: TENANT_B, role: 'ADMIN' },
        });
      });
    } finally {
      await seed.$disconnect();
    }
  });

  // 1. Without context: zero rows for tenant-scoped tables.
  it('without app.tenant_id, tenant-scoped tables return zero rows', async () => {
    const tenants = await prisma.tenant.findMany();
    const memberships = await prisma.membership.findMany();
    expect(tenants).toHaveLength(0);
    expect(memberships).toHaveLength(0);
  });

  // 2. Tenant A reads only A; tenant B reads only B.
  it('reads from tenant A only see tenant A rows', async () => {
    const result = await tenantPrisma.run(TENANT_A, async (tx) => {
      const tenants = await tx.tenant.findMany();
      const memberships = await tx.membership.findMany();
      return { tenants, memberships };
    });
    expect(result.tenants.map((t) => t.id)).toEqual([TENANT_A]);
    expect(result.memberships.every((m) => m.tenantId === TENANT_A)).toBe(true);
  });

  it('reads from tenant B only see tenant B rows', async () => {
    const result = await tenantPrisma.run(TENANT_B, async (tx) => {
      const tenants = await tx.tenant.findMany();
      const memberships = await tx.membership.findMany();
      return { tenants, memberships };
    });
    expect(result.tenants.map((t) => t.id)).toEqual([TENANT_B]);
    expect(result.memberships.every((m) => m.tenantId === TENANT_B)).toBe(true);
  });

  // 3. Direct ID lookup across tenants returns null (no escape via findUnique).
  it('findUnique by id of tenant B returns null when in tenant A context', async () => {
    const found = await tenantPrisma.run(TENANT_A, async (tx) => {
      return tx.tenant.findUnique({ where: { id: TENANT_B } });
    });
    expect(found).toBeNull();
  });

  // 4. WITH CHECK blocks writes with a foreign tenantId.
  it('cannot insert a membership pointing at tenant B while in tenant A context', async () => {
    await expect(
      tenantPrisma.run(TENANT_A, async (tx) => {
        return tx.membership.create({
          data: { userId: 'usr_a', tenantId: TENANT_B, role: 'MANAGER' },
        });
      }),
    ).rejects.toThrow();
  });

  // 5. WITH CHECK blocks updates that move a row to another tenant.
  it('cannot update a membership tenantId to escape into tenant B', async () => {
    await expect(
      tenantPrisma.run(TENANT_A, async (tx) => {
        return tx.membership.updateMany({
          where: { userId: 'usr_a' },
          data: { tenantId: TENANT_B },
        });
      }),
    ).rejects.toThrow();
  });

  // 6. Audit log isolation.
  it('audit_log rows of tenant A are invisible from tenant B context', async () => {
    await tenantPrisma.run(TENANT_A, async (tx) => {
      await tx.auditLog.create({
        data: {
          tenantId: TENANT_A,
          action: 'TEST',
          entityType: 'tenant',
          entityId: TENANT_A,
        },
      });
    });
    const seenByB = await tenantPrisma.run(TENANT_B, async (tx) => {
      return tx.auditLog.findMany();
    });
    expect(seenByB).toHaveLength(0);
  });

  // 7. R6 — audit_log is append-only (DB trigger).
  it('updating an audit_log row raises (append-only trigger)', async () => {
    await expect(
      tenantPrisma.run(TENANT_A, async (tx) => {
        await tx.auditLog.create({
          data: { tenantId: TENANT_A, action: 'TEST_UPDATE', entityType: 'tenant' },
        });
        return tx.$executeRaw`UPDATE audit_log SET action = 'BAD' WHERE "tenantId" = ${TENANT_A}`;
      }),
    ).rejects.toThrow(/append-only/);
  });

  it('deleting an audit_log row raises (append-only trigger)', async () => {
    await expect(
      tenantPrisma.run(TENANT_A, async (tx) => {
        await tx.auditLog.create({
          data: { tenantId: TENANT_A, action: 'TEST_DELETE', entityType: 'tenant' },
        });
        return tx.$executeRaw`DELETE FROM audit_log WHERE "tenantId" = ${TENANT_A}`;
      }),
    ).rejects.toThrow(/append-only/);
  });

  // 8. tenantId allowlist blocks injection.
  it('rejects tenantId values outside the safe character set', async () => {
    const noop = (): Promise<null> => Promise.resolve(null);
    await expect(tenantPrisma.run("' OR 1=1; --", noop)).rejects.toThrow(/Invalid tenantId/);
    await expect(tenantPrisma.run('', noop)).rejects.toThrow(/Invalid tenantId/);
    await expect(tenantPrisma.run('a'.repeat(65), noop)).rejects.toThrow(/Invalid tenantId/);
  });
});
