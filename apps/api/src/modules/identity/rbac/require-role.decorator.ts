import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prisma/client';

export const REQUIRED_ROLES_KEY = 'requiredRoles';

/**
 * Restricts a route to one or more roles.
 *
 *   @RequireRole('ADMIN', 'GESTIONNAIRE_PAIE')
 *   @Post('/bulletins/validate')
 *   validate() { ... }
 */
export const RequireRole = (...roles: Role[]): ReturnType<typeof SetMetadata> =>
  SetMetadata(REQUIRED_ROLES_KEY, roles);
