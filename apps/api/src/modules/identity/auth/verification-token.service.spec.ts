import type { ConfigService } from '@nestjs/config';
import { VerificationTokenService } from './verification-token.service';

const config = (secret: string) =>
  ({
    get: (k: string): string | undefined => (k === 'AUTH_SECRET' ? secret : undefined),
  }) as unknown as ConfigService;

const SECRET = 'test-secret-test-secret-test-secret-1234';

describe('VerificationTokenService', () => {
  const svc = new VerificationTokenService(config(SECRET));

  it('generates a fresh token and a matching hash', () => {
    const { token, tokenHash } = svc.generate();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(svc.matches(token, tokenHash)).toBe(true);
  });

  it('rejects a tampered token', () => {
    const { token, tokenHash } = svc.generate();
    expect(svc.matches(`${token}xx`, tokenHash)).toBe(false);
  });

  it('round-trips a signed payload', () => {
    const t = svc.signed({ tid: 'ten_a', email: 'a@b.test' });
    expect(svc.verifySigned<{ tid: string; email: string }>(t)).toEqual({
      tid: 'ten_a',
      email: 'a@b.test',
    });
  });

  it('rejects a payload signed with a different secret', () => {
    const a = new VerificationTokenService(config(SECRET));
    const b = new VerificationTokenService(config('other-secret-other-secret-other-1234'));
    const token = a.signed({ tid: 'ten_a' });
    expect(b.verifySigned(token)).toBeNull();
  });

  it('rejects malformed signed tokens', () => {
    expect(svc.verifySigned('not-a-token')).toBeNull();
    expect(svc.verifySigned('a.b.c')).toBeNull();
  });
});
