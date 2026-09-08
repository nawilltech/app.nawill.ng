import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { createInvoice } from './utils/fixtures';

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('signs up a client, hashes the password with argon2, and returns tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'Correct-Horse9!',
        confirmPassword: 'Correct-Horse9!',
        clientType: 'individual',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe('ada@example.com');

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'ada@example.com' } });
    expect(stored.passwordHash).toMatch(/^\$argon2/);
    expect(stored.passwordHash).not.toContain('Correct-Horse9!');
  });

  it('rejects login with the wrong password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'Correct-Horse9!',
        confirmPassword: 'Correct-Horse9!',
        clientType: 'individual',
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'bob@example.com', password: 'Wrong-Password9!' })
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('UNAUTHENTICATED');
  });

  it('rejects an unauthenticated request to a protected route', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/wallets/me').expect(401);
    expect(res.body.success).toBe(false);
  });

  it('denies a client calling a staff-only route', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ name: 'Should not be created', organizationId: client.user.organizationId, ownerId: client.user.id })
      .expect(403);

    expect(res.body.errorCode).toBe('FORBIDDEN');
  });

  it('allows staff to call a staff-only route', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    await request(app.getHttpServer())
      .post('/api/v1/projects')
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .send({ name: 'Nawill Portal', organizationId: client.user.organizationId, ownerId: staff.user.id })
      .expect(201);
  });

  it('prevents a client from another organization from reading a private invoice', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const orgAClient = await createUserWithToken(app, prisma, { userType: 'client' });
    const orgBClient = await createUserWithToken(app, prisma, { userType: 'client' });

    const invoice = await createInvoice(prisma, {
      organizationId: orgAClient.user.organizationId as string,
      issuedBy: staff.user.id,
      totalMinor: 100000n,
    });

    await request(app.getHttpServer())
      .get(`/api/v1/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${orgBClient.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/api/v1/invoices/${invoice.id}`)
      .set('Authorization', `Bearer ${orgAClient.accessToken}`)
      .expect(200);
  });
});
