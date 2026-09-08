import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Support tickets — creation + self-service close (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ticketTypeId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
    const ticketType = await prisma.ticketType.findFirstOrThrow();
    ticketTypeId = ticketType.id;
  });

  it('creates a ticket and its opening message in one call', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/support-tickets')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ ticketTypeId, subject: 'My website is down', message: "It's been down for an hour." })
      .expect(201);

    expect(res.body.data.ticketStatus).toBe('open');
    expect(res.body.data.messages).toHaveLength(1);
    expect(res.body.data.messages[0].body).toBe("It's been down for an hour.");
  });

  it('lets the ticket owner close their own ticket', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/support-tickets')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ ticketTypeId, subject: 'Question about billing', message: 'Can I get a receipt?' })
      .expect(201);

    const ticketId = createRes.body.data.id;

    const closeRes = await request(app.getHttpServer())
      .post(`/api/v1/support-tickets/${ticketId}/close`)
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);

    expect(closeRes.body.data.ticketStatus).toBe('closed');
    expect(closeRes.body.data.resolvedAt).not.toBeNull();
  });

  it('lets staff close a ticket they did not raise', async () => {
    const client = await createUserWithToken(app, prisma, { userType: 'client' });
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/support-tickets')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .send({ ticketTypeId, subject: 'Urgent issue', message: 'Please help.' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/support-tickets/${createRes.body.data.id}/close`)
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .expect(200);
  });

  it('rejects closing a ticket that belongs to a different client', async () => {
    const owner = await createUserWithToken(app, prisma, { userType: 'client' });
    const stranger = await createUserWithToken(app, prisma, { userType: 'client' });

    const createRes = await request(app.getHttpServer())
      .post('/api/v1/support-tickets')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ ticketTypeId, subject: 'Private ticket', message: 'Only I should see this.' })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/v1/support-tickets/${createRes.body.data.id}/close`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .expect(403);
  });
});
