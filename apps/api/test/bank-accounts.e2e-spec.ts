import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Bank accounts (e2e)', () => {
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

  it('verifies via the mock resolver (no PAYSTACK_SECRET_KEY in test env) and adds the account as default', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' })
      .expect(201);

    expect(res.body.data.isVerified).toBe(true);
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data.accountName).toContain('6789');
  });

  it('makes only the first account default; a second account is not', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '011', bankName: 'First Bank', accountNumber: '9876543210' })
      .expect(201);

    expect(second.body.data.isDefault).toBe(false);
  });

  it('rejects adding the exact same account twice', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });
    const payload = { bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' };

    await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send(payload)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send(payload)
      .expect(409);
  });

  it('switches the default account via set-default', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const first = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' })
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '011', bankName: 'First Bank', accountNumber: '9876543210' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/bank-accounts/${second.body.data.id}/set-default`)
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get('/api/v1/bank-accounts/me')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);

    const byId = Object.fromEntries(list.body.data.map((a: { id: string; isDefault: boolean }) => [a.id, a.isDefault]));
    expect(byId[first.body.data.id]).toBe(false);
    expect(byId[second.body.data.id]).toBe(true);
  });

  it('does not let one user see or modify another user’s bank accounts', async () => {
    const userA = await createUserWithToken(app, prisma, { userType: 'client' });
    const userB = await createUserWithToken(app, prisma, { userType: 'client' });

    const created = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${userA.accessToken}`)
      .send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' })
      .expect(201);

    const listB = await request(app.getHttpServer())
      .get('/api/v1/bank-accounts/me')
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(200);
    expect(listB.body.data).toHaveLength(0);

    await request(app.getHttpServer())
      .patch(`/api/v1/bank-accounts/${created.body.data.id}/set-default`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .delete(`/api/v1/bank-accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${userB.accessToken}`)
      .expect(404);
  });

  it('soft-deletes on remove — the account disappears from listMine', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const created = await request(app.getHttpServer())
      .post('/api/v1/bank-accounts')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789' })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/api/v1/bank-accounts/${created.body.data.id}`)
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get('/api/v1/bank-accounts/me')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);
    expect(list.body.data).toHaveLength(0);
  });
});
