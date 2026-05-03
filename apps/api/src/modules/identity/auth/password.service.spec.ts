import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const svc = new PasswordService();

  it('hashes a password to an Argon2id encoded string', async () => {
    const hashed = await svc.hash('correct horse battery staple');
    expect(hashed).toMatch(/^\$argon2id\$/);
    expect(hashed).not.toContain('correct horse battery staple');
  });

  it('verifies the correct password', async () => {
    const hashed = await svc.hash('correct horse battery staple');
    await expect(svc.verify(hashed, 'correct horse battery staple')).resolves.toBe(true);
  });

  it('rejects the wrong password', async () => {
    const hashed = await svc.hash('correct horse battery staple');
    await expect(svc.verify(hashed, 'wrong password')).resolves.toBe(false);
  });

  it('returns false (not throw) on a malformed hash', async () => {
    await expect(svc.verify('not-a-valid-hash', 'whatever')).resolves.toBe(false);
  });

  it('produces a different hash for the same password (random salt)', async () => {
    const a = await svc.hash('same-password');
    const b = await svc.hash('same-password');
    expect(a).not.toBe(b);
  });
});
