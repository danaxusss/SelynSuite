import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import type { Role } from '@prisma/client';
import { CurrentAuth } from './auth/current-auth.decorator';
import type { AuthContext } from './auth/auth.types';
import { IdentityService } from './identity.service';

@Controller({ path: 'me', version: '1' })
export class MeController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  async me(@CurrentAuth() auth: AuthContext | undefined): Promise<{
    user: {
      id: string;
      email: string;
      name: string | null;
      emailVerified: Date | null;
      has2FA: boolean;
    };
    currentTenantId: string | null;
    role: Role | null;
    mfaVerified: boolean;
    memberships: { tenantId: string; tenantName: string; role: Role }[];
  }> {
    if (!auth?.userId) throw new UnauthorizedException();
    const profile = await this.identity.getMe(auth.userId);
    return {
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        emailVerified: profile.emailVerified,
        has2FA: profile.has2FA,
      },
      currentTenantId: auth.currentTenantId,
      role: auth.role,
      mfaVerified: auth.mfaVerified,
      memberships: profile.memberships,
    };
  }
}
