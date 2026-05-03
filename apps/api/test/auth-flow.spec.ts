/**
 * End-to-end smoke test for the signup → verify-credentials → /me flow.
 *
 * Boots the full Nest application (in-memory) connected to the test
 * Postgres. Covers:
 *   - signup creates a user, a tenant, a membership (ADMIN), and an audit row
 *   - verify-credentials accepts the right password and rejects the wrong one
 *   - /me returns the resolved user + memberships once the JWT is presented
 *   - logged-in admin can switch tenants when membership exists
 *
 * Skipped automatically if no DATABASE_URL is set and CI is not true.
 */

import { Test, type TestingModule } from '@nestjs/testing';
import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infra/prisma/prisma.service';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://selyn:selyn_dev_password@localhost:5432/selyn_test';

const skipIfNoDb = !process.env.DATABASE_URL && process.env.CI !== 'true';
const describeOrSkip = skipIfNoDb ? describe.skip : describe;

describeOrSkip('Auth flow (signup → verify-credentials → /me)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const email = 'founder@flow.test';
  const password = 'correct horse battery staple';

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

    // Clean state.
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

  let token = '';
  let tenantId = '';
  let userId = '';

  it('rejects signup with a too-short password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password: 'short', raisonSociale: 'Acme', formeJuridique: 'SARL' });
    expect(res.status).toBe(400);
  });

  it('signs up and returns a session token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password, raisonSociale: 'Acme SARL', formeJuridique: 'SARL' });
    expect(res.status).toBe(201);
    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(res.body.user.email).toBe(email);
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('persisted exactly one tenant + membership + audit row', async () => {
    // user is not under RLS — direct read works.
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    expect(u).toBeTruthy();

    // membership is RLS-protected; use the user-scoped session var so we
    // can read this user's own memberships without a tenant context.
    const memberships = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.user_id = '${userId}'`);
      return tx.membership.findMany({ where: { userId } });
    });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]!.role).toBe('ADMIN');
    tenantId = memberships[0]!.tenantId;

    // Audit row needs the tenant context to read.
    const audits = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
      return tx.auditLog.findMany({ where: { tenantId } });
    });
    expect(audits.some((a) => a.action === 'SIGNUP')).toBe(true);
  });

  it('refuses duplicate signup with the same email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({ email, password, raisonSociale: 'Acme', formeJuridique: 'SARL' });
    expect(res.status).toBe(409);
  });

  it('verify-credentials returns ok=false on wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password: 'wrong password long enough' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.reason).toBe('INVALID_CREDENTIALS');
  });

  it('verify-credentials returns a session token on correct password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-credentials')
      .send({ email, password });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    token = res.body.token;
  });

  it('/me requires a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/me');
    expect(res.status).toBe(401);
  });

  it('/me returns the user, memberships, and current tenant', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.has2FA).toBe(false);
    expect(res.body.role).toBe('ADMIN');
    expect(res.body.currentTenantId).toBe(tenantId);
    expect(res.body.memberships).toHaveLength(1);
    expect(res.body.memberships[0].role).toBe('ADMIN');
  });

  it('switch-tenant rejects a tenant the user is not a member of', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: 'ten_does_not_exist' });
    expect(res.status).toBe(401);
  });

  it('switch-tenant accepts an existing membership and returns a new token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/switch-tenant')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
  });
});
