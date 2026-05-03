import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SessionTokenService } from './session-token.service';
import type { AuthContext } from './auth.types';

const COOKIE_NAMES = ['__Secure-authjs.session-token', 'authjs.session-token'];

/**
 * Verifies the Auth.js session JWT on every request and populates `req.auth`.
 * Routes can opt out with @Public().
 *
 * The token is looked up in the cookie set by Auth.js on the Web app; for
 * machine-to-machine traffic it can also be passed as `Authorization: Bearer`.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionTokenService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { auth?: AuthContext }>();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException('No session');

    const payload = await this.sessions.verify(token);
    req.auth = {
      userId: payload.sub,
      currentTenantId: payload.tid,
      role: payload.role,
      mfaVerified: payload.mfa,
    };
    return true;
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);

  const cookies = (req as { cookies?: Record<string, string> }).cookies ?? {};
  for (const name of COOKIE_NAMES) {
    const v = cookies[name];
    if (v) return v;
  }
  return null;
}
