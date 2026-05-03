# ADR 0003 — Authentication architecture (Auth.js on Web, signed JWT bridge to API)

- **Status:** Accepted
- **Date:** 2026-05-03
- **Phase:** 1 — Identity & multi-tenancy
- **Cardinal Rules:** R6 (audit log), R10 (no PII in logs)

## Context

We need authentication that:
- Works for credentials (email + password) today, with TOTP 2FA enrollment.
- Can add OAuth providers (Google for fiduciaires, Microsoft for SMEs) later without a schema rewrite.
- Lets the Web (Next.js, App Router) own session lifecycle.
- Lets the API (NestJS) authorize every request with strict, fast verification.
- Supports a session-scoped "current tenant" for users with multiple memberships.

## Decision

### Components

- **Web side:** Auth.js v5 (NextAuth) with the Prisma adapter. Credentials provider for email/password, plus reserved slots for OAuth.
- **Bridge:** a signed JWT (HS256) shared between Web and API. Auth.js encode/decode callbacks override the default JWE so the API can verify with `jose.jwtVerify` and a single shared `AUTH_SECRET`.
- **API side:** `SessionTokenService` (verify only), `AuthGuard` registered globally via `APP_GUARD`, `@Public()` to opt out, `@CurrentAuth()` to inject the resolved context, `@RequireRole(...)` + `RolesGuard` for RBAC.

### JWT payload (minimal by design)

```ts
interface SessionTokenPayload {
  sub: string;           // userId (cuid)
  tid: string | null;    // currently selected tenant
  role: Role | null;     // role within current tenant
  mfa: boolean;          // 2FA cleared for this session
  iat: number;
  exp: number;           // 30 days
}
```

Anything not on this list (display name, avatar, list of memberships) is fetched fresh from the DB when needed. Keeps the cookie small and the blast radius of a leaked token bounded.

### Tenant resolution

Phase 1 ships **session-based** tenant selection: the user's currently selected tenant lives in `tid` on the JWT and is switched via a UI control that re-mints the token. No subdomain or path routing yet — that would require wildcard DNS and complicates Hostinger setup.

The architecture is upgrade-ready: subdomain routing can be added in Phase 9 by reading the `Host` header in addition to (not instead of) `tid`.

### Password rules (NIST 800-63B style)

- Minimum **12 characters**, no maximum, no composition rules (upper/lower/digit/symbol).
- Hashed with **Argon2id** via `@node-rs/argon2` (Rust binding, no native build needed).
- Rejected if found in HIBP-style breached-password list (implementation in Phase 1 follow-up).

### 2FA

- TOTP via `otpauth`. Issuer label = "Selyn".
- **Mandatory for ADMIN immediately**, optional for everyone else.
- 8 single-use recovery codes generated at enrollment, stored as Argon2id hashes, marked `usedAt` on consumption.
- Phase 9 hardening flips GESTIONNAIRE_PAIE to mandatory before public launch.

### Audit log triggers (R6)

The following events MUST emit one `audit_log` row each:
- login, logout, password change, 2FA enrollment, 2FA reset, recovery code use
- role change, membership create/delete, invitation create/accept/revoke
- tenant settings change, salarié create/update, bulletin validate, export download

`AuditService.log()` is the single entry point. Callers responsible for redacting PII before passing `before`/`after` payloads (R10).

### Cookie names

- Production (HTTPS): `__Secure-authjs.session-token` — `Secure`, `HttpOnly`, `SameSite=Lax`.
- Development: `authjs.session-token`.
- Both names are accepted by `AuthGuard` so a single API binary works in both environments.

### Machine-to-machine

For internal jobs and tests, the same JWT can be passed as `Authorization: Bearer <token>`. No separate API-key system in Phase 1.

## Consequences

**Positive**
- Single source of truth for auth (Auth.js on Web). API stays small and fast.
- Tokens are deterministically verifiable in tests with the same `SessionTokenService.sign()` we use in production.
- Shared `AUTH_SECRET` is the only critical secret. Rotation = update env var on both apps; old tokens fail verification immediately.

**Negative**
- We override Auth.js's default JWE in favour of HS256. We accept this — JWE adds complexity (HKDF + AES-CBC) without buying us anything for a same-team Web↔API setup. We keep the rotation story (rotate `AUTH_SECRET` and ride out the 30-day window).
- Logging out a user across all devices means rotating `AUTH_SECRET` (kills all sessions) or maintaining a server-side revocation set. Phase 1 ships without revocation; Phase 9 adds a `User.tokenVersion` claim for selective revocation.

## Alternatives considered

- **JWE (Auth.js default)** — rejected for our bridge. Encryption inside an internal trust boundary buys nothing and complicates the API verification path.
- **Database sessions only** — rejected. Forces a DB lookup on every API request. Acceptable for a small app, wasteful for a busy payroll batch.
- **Passport.js inside NestJS** — rejected. Would duplicate Auth.js's flows on the API side. We picked the simpler bridge.
- **Session-cookie revocation list in Redis** — deferred to Phase 9. Phase 1 accepts the 30-day-window trade-off.

## References

- Project brief §11 (security baseline), §3 R6, §3 R10
- Auth.js v5 docs: <https://authjs.dev/>
- `apps/api/src/modules/identity/auth/`
- `apps/api/src/modules/identity/rbac/`
- `apps/api/src/modules/shared/audit/`
