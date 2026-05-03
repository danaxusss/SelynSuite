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
import { z } from 'zod';
import { CurrentAuth } from './current-auth.decorator';
import { ZodValidationPipe } from '../../../infra/zod-validation.pipe';
import { TwoFactorService } from '../two-factor.service';
import { PrismaService } from '../../../infra/prisma/prisma.service';
import type { AuthContext } from './auth.types';

const EnrollVerifyDto = z.object({
  secret: z.string().regex(/^[A-Z2-7]{16,64}$/),
  code: z.string().regex(/^\d{6}$/),
});

@Controller({ path: 'auth/2fa', version: '1' })
export class TwoFactorController {
  constructor(
    private readonly twoFactor: TwoFactorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Returns a fresh TOTP secret + otpauth URI for QR rendering. The
   * caller stores the secret transiently (e.g. on the page state) and
   * sends it back with the first verified TOTP code on /enroll-verify.
   */
  @Post('enroll-start')
  @HttpCode(HttpStatus.OK)
  async enrollStart(
    @CurrentAuth() auth: AuthContext | undefined,
  ): Promise<{ secret: string; uri: string }> {
    if (!auth?.userId) throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.twoFactor.enrollStart(user.email);
  }

  /**
   * Persists the secret if the supplied code is valid, generates 8
   * single-use recovery codes, and returns them ONCE in plaintext.
   */
  @Post('enroll-verify')
  @HttpCode(HttpStatus.OK)
  async enrollVerify(
    @Body(new ZodValidationPipe(EnrollVerifyDto)) dto: z.infer<typeof EnrollVerifyDto>,
    @CurrentAuth() auth: AuthContext | undefined,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ recoveryCodes: string[] }> {
    if (!auth?.userId) throw new UnauthorizedException();
    const ua = req.get('user-agent') ?? null;
    return this.twoFactor.enrollVerify(
      auth.userId,
      dto.secret,
      dto.code,
      auth.currentTenantId,
      ip,
      ua,
    );
  }

  @Post('disable')
  @HttpCode(HttpStatus.OK)
  async disable(
    @CurrentAuth() auth: AuthContext | undefined,
    @Ip() ip: string,
    @Req() req: Request,
  ): Promise<{ ok: true }> {
    if (!auth?.userId) throw new UnauthorizedException();
    const ua = req.get('user-agent') ?? null;
    await this.twoFactor.disable(auth.userId, auth.currentTenantId, ip, ua);
    return { ok: true };
  }
}
