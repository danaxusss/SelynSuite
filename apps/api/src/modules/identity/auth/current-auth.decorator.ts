import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthContext } from './auth.types';

/**
 * Injects the resolved AuthContext into a controller handler.
 *
 *   @Get('/me')
 *   me(@CurrentAuth() auth: AuthContext) { ... }
 */
export const CurrentAuth = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthContext | undefined => {
    const req = ctx.switchToHttp().getRequest<{ auth?: AuthContext }>();
    return req.auth;
  },
);
