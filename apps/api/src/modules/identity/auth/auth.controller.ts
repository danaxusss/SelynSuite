import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Public } from './public.decorator';
import { CurrentAuth } from './current-auth.decorator';
import { SessionTokenService } from './session-token.service';
import { ZodValidationPipe } from '../../../infra/zod-validation.pipe';
import { IdentityService } from '../identity.service';
import { SignupDto, SwitchTenantDto, VerifyCredentialsDto } from './dto';
import type { AuthContext } from './auth.types';

/**
 * Auth API used by the Web (Auth.js Credentials provider) and by tests.
 * The API does not set the session cookie itself — Auth.js owns the cookie
 * lifecycle on the Web side. Endpoints that mint a session payload return
 * `{ token }` so Auth.js can place it.
 *
 * `/signup` and `/verify-credentials` are @Public(). Rate limiting
 * (Phase 9 hardening) will be applied to these specifically.
 */
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly identity: IdentityService,
    private readonly sessions: SessionTokenService,
  ) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body(new ZodValidationPipe(SignupDto)) dto: SignupDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ token: string; user: { id: string; email: string } }> {
    const ua = req.get('user-agent') ?? undefined;
    const result = await this.identity.signup({ ...dto, ip, ua });
    const token = await this.sessions.sign({
      sub: result.user.id,
      tid: result.tenant.id,
      role: 'ADMIN',
      mfa: false,
    });
    return { token, user: result.user };
  }

  @Public()
  @Post('verify-credentials')
  @HttpCode(HttpStatus.OK)
  async verifyCredentials(
    @Body(new ZodValidationPipe(VerifyCredentialsDto)) dto: VerifyCredentialsDto,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ token: string } | { ok: false; reason: string }> {
    const ua = req.get('user-agent') ?? undefined;
    const result = await this.identity.verifyCredentials({ ...dto, ip, ua });
    if (!result.ok) return { ok: false, reason: result.reason };
    const token = await this.sessions.sign(result.payload);
    return { token };
  }

  @Post('switch-tenant')
  @HttpCode(HttpStatus.OK)
  async switchTenant(
    @Body(new ZodValidationPipe(SwitchTenantDto)) dto: SwitchTenantDto,
    @CurrentAuth() auth: AuthContext | undefined,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ token: string }> {
    if (!auth?.userId) throw new UnauthorizedException();
    const ua = req.get('user-agent') ?? undefined;
    const payload = await this.identity.switchTenant(auth.userId, dto.tenantId, ip, ua);
    const token = await this.sessions.sign(payload);
    return { token };
  }
}
