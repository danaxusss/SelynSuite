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
}

// Allowlist for tenantId: cuid (default) is [a-z0-9], invitation accept paths
// also use cuid, but we accept any safe identifier characters.
const TENANT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
function isValidTenantId(id: string): boolean {
  return TENANT_ID_RE.test(id);
}
