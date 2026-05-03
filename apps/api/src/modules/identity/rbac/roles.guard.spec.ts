import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { AuthContext } from '../auth/auth.types';

function makeCtx(auth: Partial<AuthContext> | null): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ auth: auth ?? undefined }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function makeReflector(roles: string[] | undefined): Reflector {
  return { getAllAndOverride: jest.fn().mockReturnValue(roles) } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows when no @RequireRole metadata is present', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeCtx({ role: 'SALARIE' }))).toBe(true);
  });

  it('allows when role matches', () => {
    const guard = new RolesGuard(makeReflector(['ADMIN']));
    expect(guard.canActivate(makeCtx({ role: 'ADMIN' }))).toBe(true);
  });

  it('forbids when role does not match', () => {
    const guard = new RolesGuard(makeReflector(['ADMIN']));
    expect(() => guard.canActivate(makeCtx({ role: 'SALARIE' }))).toThrow(ForbiddenException);
  });

  it('forbids when no role on the request', () => {
    const guard = new RolesGuard(makeReflector(['ADMIN']));
    expect(() => guard.canActivate(makeCtx(null))).toThrow(ForbiddenException);
  });
});
