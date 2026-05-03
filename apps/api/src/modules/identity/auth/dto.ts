import { z } from 'zod';
import { FormeJuridique } from '@prisma/client';

export const SignupDto = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(256),
  raisonSociale: z.string().min(1).max(200),
  formeJuridique: z.nativeEnum(FormeJuridique),
});
export type SignupDto = z.infer<typeof SignupDto>;

export const VerifyCredentialsDto = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  totpCode: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  recoveryCode: z
    .string()
    .regex(/^[A-Z2-9-]{16,24}$/)
    .optional(),
});
export type VerifyCredentialsDto = z.infer<typeof VerifyCredentialsDto>;

export const SwitchTenantDto = z.object({
  tenantId: z.string().min(1).max(64),
});
export type SwitchTenantDto = z.infer<typeof SwitchTenantDto>;
