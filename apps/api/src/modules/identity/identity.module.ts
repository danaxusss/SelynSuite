import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth/auth.controller';
import { AuthGuard } from './auth/auth.guard';
import { PasswordService } from './auth/password.service';
import { SessionTokenService } from './auth/session-token.service';
import { TotpService } from './auth/totp.service';
import { VerificationTokenService } from './auth/verification-token.service';
import { RolesGuard } from './rbac/roles.guard';
import { IdentityService } from './identity.service';
import { MeController } from './me.controller';

/**
 * Identity bounded context: tenants, users, memberships, sessions, RBAC.
 *
 * AuthGuard runs before RolesGuard on every route (APP_GUARD), so request
 * handlers can rely on `req.auth` being populated unless the route is
 * @Public(). RolesGuard then enforces @RequireRole(...) when present.
 */
@Global()
@Module({
  controllers: [AuthController, MeController],
  providers: [
    IdentityService,
    SessionTokenService,
    PasswordService,
    TotpService,
    VerificationTokenService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [
    IdentityService,
    SessionTokenService,
    PasswordService,
    TotpService,
    VerificationTokenService,
  ],
})
export class IdentityModule {}
