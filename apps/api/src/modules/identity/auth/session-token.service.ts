import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@prisma/client';
import type { SessionTokenPayload } from './auth.types';

const ALG = 'HS256';
const ISSUER = 'selyn-suite';
const AUDIENCE = 'selyn-api';

/**
 * Signs and verifies session JWTs shared between the Web (Auth.js
 * encode/decode callbacks) and the API. Using a signed JWT (not Auth.js's
 * default JWE) keeps the API verification path tiny and lets us use the
 * same code in tests.
 *
 * AUTH_SECRET is the only required env var. Generate with:
 *   openssl rand -base64 32
 */
@Injectable()
export class SessionTokenService {
  private readonly logger = new Logger(SessionTokenService.name);
  private readonly secret: Uint8Array;

  constructor(config: ConfigService) {
    const raw = config.get<string>('AUTH_SECRET');
    if (!raw || raw.length < 32) {
      throw new Error(
        'AUTH_SECRET must be set and at least 32 chars (use `openssl rand -base64 32`)',
      );
    }
    this.secret = new TextEncoder().encode(raw);
  }

  async sign(
    payload: { sub: string; tid: string | null; role: Role | null; mfa: boolean },
    ttlSeconds = 60 * 60 * 24 * 30,
  ): Promise<string> {
    const jwt = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: ALG })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
      .sign(this.secret);
    return jwt;
  }

  async verify(token: string): Promise<SessionTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: [ALG],
        issuer: ISSUER,
        audience: AUDIENCE,
      });
      return payload as unknown as SessionTokenPayload;
    } catch (err) {
      this.logger.debug(`session token verification failed: ${(err as Error).name}`);
      throw new UnauthorizedException('Invalid session');
    }
  }
}
