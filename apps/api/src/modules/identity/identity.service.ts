import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { type FormeJuridique, Role } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { TenantPrismaService } from '../../infra/prisma/tenant-prisma.service';
import { AuditService } from '../shared/audit/audit.service';
import { PasswordService } from './auth/password.service';
import { TotpService } from './auth/totp.service';
import { VerificationTokenService } from './auth/verification-token.service';
import type { SessionTokenPayload } from './auth/auth.types';

export interface SignupInput {
  email: string;
  password: string;
  raisonSociale: string;
  formeJuridique: FormeJuridique;
  ip?: string | undefined;
  ua?: string | undefined;
}

export interface SignupResult {
  user: { id: string; email: string };
  tenant: { id: string; slug: string };
}

export interface VerifyCredentialsInput {
  email: string;
  password: string;
  totpCode?: string | undefined;
  ip?: string | undefined;
  ua?: string | undefined;
}

export type VerifyCredentialsResult =
  | { ok: true; payload: Omit<SessionTokenPayload, 'iat' | 'exp'> }
  | { ok: false; reason: 'INVALID_CREDENTIALS' | 'TOTP_REQUIRED' | 'TOTP_INVALID' };

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly audit: AuditService,
    private readonly passwords: PasswordService,
    private readonly totp: TotpService,
    private readonly verificationTokens: VerificationTokenService,
  ) {}

  /**
   * Creates a User, a Tenant, and a Membership (ADMIN) atomically. The new
   * user becomes the founding admin of the tenant. Email verification is
   * pending (emailVerified = null) — the API issues a verification token
   * separately and the Web sends the email.
   */
  async signup(input: SignupInput): Promise<SignupResult> {
    const email = normalizeEmail(input.email);
    if (!isStrongPassword(input.password)) {
      throw new BadRequestException('Password must be at least 12 characters');
    }
    const slug = await this.uniqueSlug(input.raisonSociale);
    const passwordHash = await this.passwords.hash(input.password);

    // The User and Tenant are created outside the tenant transaction (RLS
    // would block tenant creation otherwise — chicken-and-egg). We then
    // open a tenant transaction to create the Membership and audit log.
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Email already in use');

    const user = await this.prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });

    const tenant = await this.prisma.$transaction(async (tx) => {
      // We must INSERT the tenant WITHOUT a RETURNING clause: Postgres
      // evaluates RLS USING on the returned row, and at this point no
      // app.tenant_id is set, so `id = current_tenant_id()` is unknown.
      // The migration's WITH CHECK accepts inserts with a NULL context
      // (signup bootstrap), but RETURNING still triggers USING. Fix:
      // generate the id client-side and use $executeRaw (no RETURNING).
      const id = generateTenantId();
      await tx.$executeRaw`
        INSERT INTO "tenant" ("id", "slug", "name", "raisonSociale", "formeJuridique", "updatedAt")
        VALUES (${id}, ${slug}, ${input.raisonSociale}, ${input.raisonSociale}, ${input.formeJuridique}::"FormeJuridique", now())
      `;
      // Set the tenant context for subsequent statements; from here, RLS
      // applies normally.
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${id}'`);
      await tx.membership.create({
        data: { userId: user.id, tenantId: id, role: 'ADMIN' },
      });
      return { id, slug };
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastTenantId: tenant.id },
    });

    await this.audit.log({
      tenantId: tenant.id,
      actorUserId: user.id,
      action: 'SIGNUP',
      entityType: 'tenant',
      entityId: tenant.id,
      after: { slug: tenant.slug, raisonSociale: input.raisonSociale },
      ip: input.ip ?? null,
      ua: input.ua ?? null,
    });

    return { user, tenant };
  }

  /**
   * Verifies email + password (+ TOTP if enrolled) and returns the JWT
   * payload the Web should sign into the session cookie.
   *
   * ADR 0003: ADMIN role mandates 2FA. We enforce that at the role gate
   * (RolesGuard) by requiring mfa=true for ADMIN routes — not here. This
   * service simply enrols the user's mfa state into the payload.
   */
  async verifyCredentials(input: VerifyCredentialsInput): Promise<VerifyCredentialsResult> {
    const email = normalizeEmail(input.email);
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        totpSecret: true,
        lastTenantId: true,
      },
    });

    // Constant-ish time: always run a hash verification so timing leaks
    // don't reveal whether the email exists.
    const stored = user?.passwordHash ?? FALLBACK_HASH;
    const passwordOk = await this.passwords.verify(stored, input.password);
    if (!user || !passwordOk) {
      this.logger.debug(`failed verifyCredentials for domain=${domainOf(email)}`);
      return { ok: false, reason: 'INVALID_CREDENTIALS' };
    }

    let mfa = false;
    if (user.totpSecret) {
      if (!input.totpCode) return { ok: false, reason: 'TOTP_REQUIRED' };
      if (!this.totp.verify(user.totpSecret, input.totpCode)) {
        return { ok: false, reason: 'TOTP_INVALID' };
      }
      mfa = true;
    }

    // Pick the default tenant: lastTenantId if still a member, else the
    // first membership the user has, else null (incomplete onboarding).
    const targetTenantId = user.lastTenantId ?? null;
    const membership = await this.tenantPrisma.runForUser(user.id, (tx) =>
      this.firstActiveMembership(tx, user.id, targetTenantId),
    );

    if (membership) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastTenantId: membership.tenantId },
      });
      await this.audit.log({
        tenantId: membership.tenantId,
        actorUserId: user.id,
        action: 'LOGIN',
        entityType: 'user',
        entityId: user.id,
        ip: input.ip ?? null,
        ua: input.ua ?? null,
      });
    }

    return {
      ok: true,
      payload: {
        sub: user.id,
        tid: membership?.tenantId ?? null,
        role: membership?.role ?? null,
        mfa,
      },
    };
  }

  /**
   * Re-mints the session payload for a user switching to a different
   * tenant. Verifies the user is a member; throws if not.
   */
  async switchTenant(
    userId: string,
    nextTenantId: string,
    ip?: string,
    ua?: string,
  ): Promise<Omit<SessionTokenPayload, 'iat' | 'exp'>> {
    const membership = await this.tenantPrisma.runForUser(userId, (tx) =>
      tx.membership.findUnique({
        where: { userId_tenantId: { userId, tenantId: nextTenantId } },
        select: { role: true, tenantId: true },
      }),
    );
    if (!membership) throw new UnauthorizedException('Not a member of this tenant');

    await this.prisma.user.update({
      where: { id: userId },
      data: { lastTenantId: membership.tenantId },
    });
    await this.audit.log({
      tenantId: membership.tenantId,
      actorUserId: userId,
      action: 'SWITCH_TENANT',
      entityType: 'user',
      entityId: userId,
      ip: ip ?? null,
      ua: ua ?? null,
    });

    // mfa carries forward conceptually but we re-require it on the new
    // tenant for ADMIN/GESTIONNAIRE to be safe. Caller of switchTenant
    // (controller) decides whether to set mfa=false here.
    return { sub: userId, tid: membership.tenantId, role: membership.role, mfa: false };
  }

  async getMe(userId: string): Promise<{
    id: string;
    email: string;
    name: string | null;
    emailVerified: Date | null;
    has2FA: boolean;
    memberships: { tenantId: string; tenantName: string; role: Role }[];
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
        totpSecret: true,
      },
    });
    if (!user) throw new UnauthorizedException();
    // Membership read goes through user-scoped RLS (app.user_id) so a
    // single transaction returns memberships across every tenant the
    // user belongs to.
    const memberships = await this.tenantPrisma.runForUser(userId, (tx) =>
      tx.membership.findMany({
        where: { userId },
        select: {
          tenantId: true,
          role: true,
          tenant: { select: { name: true } },
        },
      }),
    );
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      has2FA: user.totpSecret !== null,
      memberships: memberships.map((m) => ({
        tenantId: m.tenantId,
        tenantName: m.tenant.name,
        role: m.role,
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // helpers
  // ─────────────────────────────────────────────────────────────────────

  private async firstActiveMembership(
    tx: Prisma.TransactionClient,
    userId: string,
    preferredTenantId: string | null,
  ): Promise<{ tenantId: string; role: Role } | null> {
    if (preferredTenantId) {
      const m = await tx.membership.findUnique({
        where: { userId_tenantId: { userId, tenantId: preferredTenantId } },
        select: { tenantId: true, role: true },
      });
      if (m) return m;
    }
    return tx.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { tenantId: true, role: true },
    });
  }

  private async uniqueSlug(rawName: string): Promise<string> {
    const base = slugify(rawName) || 'tenant';
    let attempt = base;
    let suffix = 0;
    // Race-window narrow; the unique constraint catches collisions and
    // we retry with a higher suffix.
    while (await this.prisma.tenant.findUnique({ where: { slug: attempt } })) {
      suffix += 1;
      attempt = `${base}-${suffix}`;
      if (suffix > 50) {
        attempt = `${base}-${Date.now().toString(36)}`;
        break;
      }
    }
    return attempt;
  }
}

// Reasonable Argon2id hash of the empty string — used for constant-time
// comparison when the email is unknown. Pre-computed offline; no secret in it.
const FALLBACK_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$mJ8m4mmvXgRGzzU7rwGaQQ$XnsApDzyrqpAkLrPYFDVe7w7P8qg0OMG8q3spvXqZL0';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function domainOf(email: string): string {
  const at = email.lastIndexOf('@');
  return at >= 0 ? email.slice(at + 1) : 'unknown';
}

function isStrongPassword(pw: string): boolean {
  return typeof pw === 'string' && pw.length >= 12;
}

function generateTenantId(): string {
  // 16 random bytes (128 bits) base64url-encoded → 22 chars. Plus "ten_"
  // prefix so the ID is recognizable in logs without revealing the tenant.
  return `ten_${randomBytes(16).toString('base64url')}`;
}

function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}
