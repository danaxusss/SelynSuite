import type { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { SessionTokenService } from './session-token.service';

const SECRET = 'test-secret-test-secret-test-secret-1234';

function makeService(secret: string = SECRET): SessionTokenService {
  const config = { get: (key: string): unknown => (key === 'AUTH_SECRET' ? secret : undefined) };
  return new SessionTokenService(config as unknown as ConfigService);
}

describe('SessionTokenService', () => {
  it('refuses a missing or short AUTH_SECRET', () => {
    expect(() => makeService('')).toThrow(/AUTH_SECRET/);
    expect(() => makeService('short')).toThrow(/AUTH_SECRET/);
  });

  it('round-trips a valid payload', async () => {
    const svc = makeService();
    const token = await svc.sign({ sub: 'usr_1', tid: 'ten_1', role: 'ADMIN', mfa: true });
    const payload = await svc.verify(token);
    expect(payload.sub).toBe('usr_1');
    expect(payload.tid).toBe('ten_1');
    expect(payload.role).toBe('ADMIN');
    expect(payload.mfa).toBe(true);
    expect(typeof payload.exp).toBe('number');
  });

  it('rejects a token signed with a different secret', async () => {
    const a = makeService('secret-a-secret-a-secret-a-secret-aaaa');
    const b = makeService('secret-b-secret-b-secret-b-secret-bbbb');
    const token = await a.sign({ sub: 'usr_1', tid: null, role: null, mfa: false });
    await expect(b.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired token', async () => {
    const svc = makeService();
    const token = await svc.sign({ sub: 'usr_1', tid: null, role: null, mfa: false }, -10);
    await expect(svc.verify(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a tampered token', async () => {
    const svc = makeService();
    const token = await svc.sign({ sub: 'usr_1', tid: null, role: null, mfa: false });
    const tampered = `${token.slice(0, -2)}xx`;
    await expect(svc.verify(tampered)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
