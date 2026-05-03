import type { ConfigService } from '@nestjs/config';
import { Secret, TOTP } from 'otpauth';
import { TotpService } from './totp.service';

const config = {
  get: (key: string): string | undefined => (key === 'AUTH_TOTP_ISSUER' ? 'Selyn' : undefined),
} as unknown as ConfigService;

describe('TotpService', () => {
  const svc = new TotpService(config);

  it('issues an enrollment with a base32 secret and otpauth URI', () => {
    const enr = svc.enroll('user@example.test');
    expect(enr.secret).toMatch(/^[A-Z2-7]+$/);
    expect(enr.uri).toMatch(/^otpauth:\/\/totp\/Selyn:user(@|%40)example\.test/);
    expect(enr.uri).toContain(`secret=${enr.secret}`);
  });

  it('verifies the current code', () => {
    const { secret } = svc.enroll('a@b.test');
    const totp = new TOTP({ secret: Secret.fromBase32(secret) });
    const code = totp.generate();
    expect(svc.verify(secret, code)).toBe(true);
  });

  it('rejects an obviously bad code', () => {
    const { secret } = svc.enroll('a@b.test');
    expect(svc.verify(secret, '000000')).toBe(false);
  });
});
