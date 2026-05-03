import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { TenantPrismaService } from '../../../infra/prisma/tenant-prisma.service';

export interface AuditEntry {
  tenantId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  ua?: string | null;
}

/**
 * Cardinal Rule R6 — every sensitive action writes one append-only audit_log
 * row. The DB-level trigger (see migration) blocks UPDATE and DELETE.
 *
 * Cardinal Rule R10 — payloads passed here MUST be already redacted of PII.
 * Callers responsible for not putting CIN, RIB, salaries, etc. into
 * before/after. The service does not auto-scrub — explicit > implicit.
 */
@Injectable()
export class AuditService {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async log(entry: AuditEntry): Promise<void> {
    await this.tenantPrisma.run(entry.tenantId, async (tx) => {
      const data: Prisma.AuditLogCreateInput = {
        tenantId: entry.tenantId,
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        ip: entry.ip ?? null,
        ua: entry.ua ?? null,
      };
      if (entry.before !== undefined) {
        data.beforeJson = entry.before as Prisma.InputJsonValue;
      }
      if (entry.after !== undefined) {
        data.afterJson = entry.after as Prisma.InputJsonValue;
      }
      await tx.auditLog.create({ data });
    });
  }
}
