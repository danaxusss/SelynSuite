/**
 * Auth.js v5 configuration. Wires a Credentials provider that calls the
 * NestJS API's /auth/verify-credentials endpoint, and overrides Auth.js's
 * default JWE with an HS256 JWT signed by the same AUTH_SECRET the API
 * uses (see ADR 0003). The session cookie is therefore a token the API
 * AuthGuard can verify directly.
 */
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { apiFetch } from './lib/api';

const ISSUER = 'selyn-suite';
const AUDIENCE = 'selyn-api';

type Role = 'ADMIN' | 'GESTIONNAIRE_PAIE' | 'MANAGER' | 'SALARIE' | 'FIDUCIAIRE';

declare module 'next-auth' {
  interface Session {
    user: { id: string; email: string } & DefaultSession['user'];
    currentTenantId: string | null;
    role: Role | null;
    mfaVerified: boolean;
  }
}

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  recoveryCode: z
    .string()
    .regex(/^[A-Z2-9-]{16,24}$/)
    .optional(),
});

interface ApiVerifySuccess {
  token: string;
}
interface ApiVerifyFailure {
  ok: false;
  reason: 'INVALID_CREDENTIALS' | 'TOTP_REQUIRED' | 'TOTP_INVALID' | 'RECOVERY_INVALID';
}

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 chars');
  }
  return new TextEncoder().encode(raw);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
        totpCode: {},
        recoveryCode: {},
      },
      authorize: async (raw) => {
        const parsed = CredentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const result = await apiFetch<ApiVerifySuccess | ApiVerifyFailure>(
          '/auth/verify-credentials',
          { method: 'POST', body: JSON.stringify(parsed.data) },
        );
        if (!result.ok) return null;
        const body = result.data;
        if ('ok' in body && body.ok === false) {
          throw new Error(body.reason);
        }
        const token = (body as ApiVerifySuccess).token;
        const { payload } = await jwtVerify(token, getSecret(), {
          algorithms: ['HS256'],
          issuer: ISSUER,
          audience: AUDIENCE,
        });
        const sub = typeof payload.sub === 'string' ? payload.sub : '';
        const tid = typeof payload.tid === 'string' ? payload.tid : null;
        const role = typeof payload.role === 'string' ? (payload.role as Role) : null;
        const mfa = payload.mfa === true;
        return { id: sub, email: parsed.data.email, tid, role, mfa } as never;
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user, trigger, session }) => {
      const t = token as Record<string, unknown>;
      if (user) {
        const u = user as Record<string, unknown>;
        if (typeof u.id === 'string') t.sub = u.id;
        if (typeof u.email === 'string') t.email = u.email;
        t.tid = u.tid ?? null;
        t.role = u.role ?? null;
        t.mfa = u.mfa === true;
      }
      if (trigger === 'update' && session) {
        const s = session as Record<string, unknown>;
        if ('tid' in s) t.tid = s.tid ?? null;
        if ('role' in s) t.role = s.role ?? null;
        if (typeof s.mfa === 'boolean') t.mfa = s.mfa;
      }
      return token;
    },
    session: ({ session, token }) => {
      const t = token as Record<string, unknown>;
      session.user = {
        ...session.user,
        id: typeof t.sub === 'string' ? t.sub : '',
        email: typeof t.email === 'string' ? t.email : '',
      };
      session.currentTenantId = typeof t.tid === 'string' ? t.tid : null;
      session.role = typeof t.role === 'string' ? (t.role as Role) : null;
      session.mfaVerified = t.mfa === true;
      return session;
    },
  },
  jwt: {
    encode: async ({ token, secret, maxAge }) => {
      const t = (token ?? {}) as Record<string, unknown>;
      const sub = typeof t.sub === 'string' ? t.sub : '';
      const tid = typeof t.tid === 'string' ? t.tid : null;
      const role = typeof t.role === 'string' ? t.role : null;
      const mfa = t.mfa === true;
      const ttl = typeof maxAge === 'number' ? maxAge : 60 * 60 * 24 * 30;
      return new SignJWT({ sub, tid, role, mfa })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .setIssuedAt()
        .setExpirationTime(Math.floor(Date.now() / 1000) + ttl)
        .sign(toUint8(secret));
    },
    decode: async ({ token, secret }) => {
      if (!token) return null;
      try {
        const { payload } = await jwtVerify(token, toUint8(secret), {
          algorithms: ['HS256'],
          issuer: ISSUER,
          audience: AUDIENCE,
        });
        return payload;
      } catch {
        return null;
      }
    },
  },
});

function toUint8(
  secret: string | Buffer | Uint8Array | (string | Buffer | Uint8Array)[],
): Uint8Array {
  const first = Array.isArray(secret) ? secret[0] : secret;
  if (first === undefined) throw new Error('AUTH_SECRET missing');
  if (first instanceof Uint8Array) return first;
  if (typeof first === 'string') return new TextEncoder().encode(first);
  return new Uint8Array(first);
}
