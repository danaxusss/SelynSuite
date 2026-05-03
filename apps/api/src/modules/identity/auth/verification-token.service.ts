import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Random opaque tokens for email verification, password reset, and
 * invitation acceptance.
 *
 * Storage model: we generate a 32-byte random token, persist its SHA-256
 * hash in the DB, and email the raw token to the user. Acceptance compares
 * the SHA-256 of the presented token with the stored hash in constant time.
 *
 * Tokens are not signed because their validity is bound to the DB row's
 * expiry. The HMAC variant (`signed()/verifySigned()`) is used for
 * stateless tokens (e.g. invitation links carrying the tenantId).
 */
@Injectable()
export class VerificationTokenService {
  private readonly secret: Buffer;

  constructor(config: ConfigService) {
    const raw = config.get<string>('AUTH_SECRET');
    if (!raw) throw new Error('AUTH_SECRET required for VerificationTokenService');
    this.secret = Buffer.from(raw, 'utf8');
  }

  /** Returns { token (raw, send to user), tokenHash (persist) }. */
  generate(): { token: string; tokenHash: string } {
    const token = randomBytes(32).toString('base64url');
    return { token, tokenHash: hashToken(token) };
  }

  hash(token: string): string {
    return hashToken(token);
  }

  /** Constant-time comparison of two hex-encoded SHA-256 hashes. */
  matches(presentedToken: string, storedHash: string): boolean {
    const presentedHash = Buffer.from(hashToken(presentedToken), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    if (presentedHash.length !== stored.length) return false;
    return timingSafeEqual(presentedHash, stored);
  }

  /** HMAC-signed payload for stateless tokens (invitation URLs). */
  signed(payload: Record<string, string | number>): string {
    const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
    const sig = createHmac('sha256', this.secret).update(body).digest('base64url');
    return `${body}.${sig}`;
  }

  verifySigned<T extends Record<string, unknown>>(token: string): T | null {
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = createHmac('sha256', this.secret).update(body).digest('base64url');
    if (
      sig.length !== expected.length ||
      !timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
    ) {
      return null;
    }
    try {
      return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    } catch {
      return null;
    }
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}
