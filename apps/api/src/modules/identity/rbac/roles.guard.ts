import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prisma/client';
import type { AuthContext } from '../auth/auth.types';
import { REQUIRED_ROLES_KEY } from './require-role.decorator';

/**
 * Asserts the request's resolved role satisfies @RequireRole(...). Runs
 * AFTER AuthGuard, so req.auth is guaranteed populated unless the route is
 * @Public().
 *
 * Cardinal Rule R10 — error messages avoid leaking which role was needed.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(REQUIRED_ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ auth?: AuthContext }>();
    const role = req.auth?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException();
    }
    return true;
  }
}
