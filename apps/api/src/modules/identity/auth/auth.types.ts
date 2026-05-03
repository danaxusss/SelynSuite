import type { Role } from '@prisma/client';

/**
 * Shape of the JWT payload signed by the Web (Auth.js) and verified by the
 * API. Kept deliberately minimal — only what the API needs to authorize a
 * request. Anything else (display name, avatar, etc.) lives in the session
 * lookup, not the token.
 *
 * The token is mfaVerified=true only after the second factor has cleared
 * for the current session. ADMIN endpoints require mfaVerified.
 */
export interface SessionTokenPayload {
  /** User ID (cuid). */
  sub: string;
  /** Currently selected tenant. May be null right after signup. */
  tid: string | null;
  /** Role within the current tenant. Null when tid is null. */
  role: Role | null;
  /** True once 2FA has been validated for this session. */
  mfa: boolean;
  /** Issued-at and expiration are standard JWT claims. */
  iat: number;
  exp: number;
}

/** Resolved authentication context attached to the request. */
export interface AuthContext {
  userId: string;
  currentTenantId: string | null;
  role: Role | null;
  mfaVerified: boolean;
}
