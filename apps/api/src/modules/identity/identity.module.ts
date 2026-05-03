import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth/auth.guard';
import { SessionTokenService } from './auth/session-token.service';
import { RolesGuard } from './rbac/roles.guard';

/**
 * Identity bounded context: tenants, users, memberships, sessions, RBAC.
 *
 * AuthGuard runs before RolesGuard on every route (APP_GUARD), so request
 * handlers can rely on `req.auth` being populated unless the route is
 * @Public(). RolesGuard then enforces @RequireRole(...) when present.
 */
@Global()
@Module({
  providers: [
    SessionTokenService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [SessionTokenService],
})
export class IdentityModule {}
