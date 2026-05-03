import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';

/**
 * Cardinal Rule R1 — every authenticated request runs its DB work inside a
 * transaction whose first statement sets `app.tenant_id`. Postgres RLS
 * policies then constrain every subsequent query to that tenant.
 *
 * Usage:
 *   await tenantPrisma.run(tenantId, async (tx) => {
 *     return tx.salarie.findMany();
 *   });
 *
 * The application MUST NOT bypass this service for tenant-scoped reads or
 * writes. The Prisma superuser short-circuit is prevented in production by
 * connecting as a non-superuser role (see docker-init/postgres/01-app-role.sql).
 */
@Injectable()
export class TenantPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    tenantId: string,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
    options: { isolationLevel?: Prisma.TransactionIsolationLevel } = {},
  ): Promise<T> {
    if (!isValidTenantId(tenantId)) {
      // Defensive — RLS filter would already exclude bad values, but reject
      // upstream to fail fast.
      throw new Error('Invalid tenantId');
    }
    return this.prisma.$transaction(
      async (tx) => {
        // Postgres rejects parameter binding for SET; tenantId is validated
        // by isValidTenantId() to contain only [A-Za-z0-9_-].
        await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
        return work(tx);
      },
      options.isolationLevel ? { isolationLevel: options.isolationLevel } : {},
    );
  }

  /**
   * Auth-boundary helper. Runs `work` inside a transaction with `app.user_id`
   * set, so the user-scoped RLS policies on `membership` and `tenant` apply
   * (see migration `20260503142650_auth_user_scoped_policies`). Used for
   * lookups like /me and switch-tenant where no tenant context exists yet.
   *
   * Pass a tenantId to also set `app.tenant_id` (covers the case where the
   * caller already knows which tenant the user is operating in).
   */
  async runForUser<T>(
    userId: string,
    work: (tx: Prisma.TransactionClient) => Promise<T>,
    options: { tenantId?: string; isolationLevel?: Prisma.TransactionIsolationLevel } = {},
  ): Promise<T> {
    if (!isValidId(userId)) throw new Error('Invalid userId');
    if (options.tenantId !== undefined && !isValidTenantId(options.tenantId)) {
      throw new Error('Invalid tenantId');
    }
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${userId}'`);
        if (options.tenantId) {
          await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${options.tenantId}'`);
        }
        return work(tx);
      },
      options.isolationLevel ? { isolationLevel: options.isolationLevel } : {},
    );
  }
}

// Allowlist for tenantId / userId — both are CUIDs or random base64url
// strings ([A-Za-z0-9_-]). Length capped to keep SET LOCAL safe.
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
function isValidTenantId(id: string): boolean {
  return ID_RE.test(id);
}
function isValidId(id: string): boolean {
  return ID_RE.test(id);
}
