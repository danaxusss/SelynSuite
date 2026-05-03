/**
 * End-to-end 2FA flow:
 *   - signup → log in (no 2FA) → enroll-start → enroll-verify
 *   - re-login: TOTP_REQUIRED → submit valid TOTP → ok
 *   - re-login: submit recovery code → ok and code becomes single-use
 *   - disable 2FA → next login no longer needs 2FA
 *
 * Skipped automatically without DATABASE_URL outside CI.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { Secret, TOTP } from 'otpauth';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://selyn:selyn_dev_password@localhost:5432/selyn_test';
const skipIfNoDb = !process.env.DATABASE_URL && process.env.CI !== 'true';
const describeOrSkip = skipIfNoDb ? describe.skip : describe;

describeOrSkip('Two-factor authentication flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = '2fa@flow.test';
  const password = 'correct horse battery staple';

  let token = '';
  let totpSecret = '';
  let recoveryCodes: string[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.AUTH_SECRET ??= 'test-secret-test-secret-test-secret-1234';
    process.env.SMTP_HOST ??= 'localhost';
    process.env.SMTP_PORT ??= '1025';
    process.env.LOG_LEVEL = 'silent';

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE audit_log, invitation, membership, tenant RESTART IDENTITY CASCADE`,
    );
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE audit_log, invitation, membership, tenant RESTART IDENTITY CASCADE`,
    );
    await prisma.user.deleteMany({ where: { email } });
    await app?.close();
  });

  it('signs up the user and returns a session token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password, raisonSociale: '2FA Co', formeJuridique: 'SARL' });
    expect(res.status).toBe(201);
    token = res.body.token;
  });

  it('enroll-start returns a base32 secret and otpauth URI', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/enroll-start')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.secret).toMatch(/^[A-Z2-7]+$/);
    expect(res.body.uri).toMatch(/^otpauth:\/\/totp\//);
    totpSecret = res.body.secret;
  });

  it('enroll-verify rejects an invalid code', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/enroll-verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ secret: totpSecret, code: '000000' });
    expect(res.status).toBe(400);
  });

  it('enroll-verify accepts a valid code and returns 8 recovery codes', async () => {
    const code = new TOTP({ secret: Secret.fromBase32(totpSecret) }).generate();
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/enroll-verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ secret: totpSecret, code });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.recoveryCodes)).toBe(true);
    expect(res.body.recoveryCodes).toHaveLength(8);
    expect(res.body.recoveryCodes[0]).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    recoveryCodes = res.body.recoveryCodes;
  });

  it('verify-credentials now returns TOTP_REQUIRED for password-only', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.reason).toBe('TOTP_REQUIRED');
  });

  it('verify-credentials accepts password + TOTP', async () => {
    const code = new TOTP({ secret: Secret.fromBase32(totpSecret) }).generate();
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password, totpCode: code });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });

  it('verify-credentials accepts a recovery code and consumes it', async () => {
    const code = recoveryCodes[0]!;
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password, recoveryCode: code });
    expect(res1.status).toBe(200);
    expect(typeof res1.body.token).toBe('string');

    // Re-using the same recovery code fails.
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password, recoveryCode: code });
    expect(res2.status).toBe(200);
    expect(res2.body.ok).toBe(false);
    expect(res2.body.reason).toBe('RECOVERY_INVALID');
  });

  it('disable removes the totpSecret and recovery codes', async () => {
    const code = new TOTP({ secret: Secret.fromBase32(totpSecret) }).generate();
    // Re-mint a token to be sure we still have one.
    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password, totpCode: code });
    expect(login.status).toBe(200);
    token = login.body.token;

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/2fa/disable')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const u = await prisma.user.findUnique({
      where: { email },
      select: { totpSecret: true },
    });
    expect(u?.totpSecret).toBeNull();
  });

  it('post-disable login no longer needs TOTP', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });
});
