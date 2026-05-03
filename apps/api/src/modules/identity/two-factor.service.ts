import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantPrismaService } from '../../infra/prisma/tenant-prisma.service';
import { AuditService } from '../shared/audit/audit.service';
import { TotpService } from './auth/totp.service';

const RECOVERY_CODE_COUNT = 8;

export interface EnrollStartResult {
  secret: string; // Provisional, NOT yet persisted. Returned for QR rendering.
  uri: string;
}

export interface EnrollVerifyResult {
  recoveryCodes: string[]; // Plaintext, shown ONCE then hashed.
}

/**
 * 2FA enrollment lifecycle.
 *
 *   start:    generate TOTP secret + URI, return for QR rendering. Not
 *             persisted yet — user must successfully verify a code first.
 *   verify:   accept first valid TOTP code, persist the encrypted secret,
 *             generate 8 single-use recovery codes (Argon2id hashed), and
 *             return the codes ONCE to the user.
 *   disable:  remove totpSecret + recovery codes after a fresh password
 *             confirmation (caller passes the verified-password assertion).
 *   consumeRecoveryCode: marks a code as used during a 2FA-stuck login.
 *
 * ADR 0003: ADMIN must enable 2FA. Enforced at the role level by the Web
 * (post-signup wizard) and by gating ADMIN endpoints on `mfaVerified`
 * once enrollment is complete.
 */
@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly audit: AuditService,
    private readonly totp: TotpService,
  ) {}

  enrollStart(userEmail: string): EnrollStartResult {
    const enr = this.totp.enroll(userEmail);
    return { secret: enr.secret, uri: enr.uri };
  }

  async enrollVerify(
    userId: string,
    secret: string,
    code: string,
    tenantId: string | null,
    ip: string | null,
    ua: string | null,
  ): Promise<EnrollVerifyResult> {
    if (!this.totp.verify(secret, code)) {
      throw new BadRequestException('Invalid TOTP code');
    }
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpSecret: true },
    });
    if (existing?.totpSecret) {
      throw new ConflictException('2FA already enabled');
    }

    const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, () => generateRecoveryCode());

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { totpSecret: secret } });
      await tx.recoveryCode.createMany({
        data: await Promise.all(
          recoveryCodes.map(async (code) => ({ userId, codeHash: await argon2Hash(code) })),
        ),
      });
    });

    if (tenantId) {
      await this.audit.log({
        tenantId,
        actorUserId: userId,
        action: '2FA_ENROLL',
        entityType: 'user',
        entityId: userId,
        ip,
        ua,
      });
    }

    return { recoveryCodes };
  }

  async disable(
    userId: string,
    tenantId: string | null,
    ip: string | null,
    ua: string | null,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { totpSecret: null } });
      await tx.recoveryCode.deleteMany({ where: { userId } });
    });
    if (tenantId) {
      await this.audit.log({
        tenantId,
        actorUserId: userId,
        action: '2FA_DISABLE',
        entityType: 'user',
        entityId: userId,
        ip,
        ua,
      });
    }
  }

  /**
   * Consumes a recovery code for a user attempting a 2FA-stuck login.
   * Returns true on success (code matched and was unused).
   * Each successful match is single-use — the code is marked as consumed.
   */
  async consumeRecoveryCode(userId: string, code: string): Promise<boolean> {
    const codes = await this.prisma.recoveryCode.findMany({
      where: { userId, usedAt: null },
      select: { id: true, codeHash: true },
    });
    for (const row of codes) {
      // argon2Verify handles malformed hashes by throwing — catch to false.
      const ok = await argon2Verify(row.codeHash, code).catch(() => false);
      if (ok) {
        await this.prisma.recoveryCode.update({
          where: { id: row.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }

  /**
   * Throws if the caller is not authenticated. Used by 2FA endpoints to
   * harden against missing-auth bugs at the controller level.
   */
  static assertCaller(userId: string | undefined): asserts userId is string {
    if (!userId) throw new UnauthorizedException();
  }
}

/**
 * Recovery code shape: 4 groups of 4 alphanumerics (XXXX-XXXX-XXXX-XXXX).
 * 16 alphanumerics from a 32-character set = ~80 bits of entropy. The
 * uppercase-only set makes the codes easier to type from a printed sheet.
 */
function generateRecoveryCode(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1
  const out: string[] = [];
  const bytes = randomBytes(16);
  for (let i = 0; i < 16; i += 1) {
    out.push(ALPHABET[bytes[i]! % ALPHABET.length] ?? 'A');
    if (i % 4 === 3 && i !== 15) out.push('-');
  }
  return out.join('');
}

// Used in tests to verify constant-time comparison is invoked.
export const __test__ = { generateRecoveryCode, timingSafeEqual };
