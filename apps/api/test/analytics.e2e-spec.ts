import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken, creditWallet, createInvoice } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Analytics overview (e2e)', () => {
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

  it('aggregates projects, wallet, invoices, and tickets for the logged-in client', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });
    const orgId = client.user.organizationId as string;

    await prisma.project.create({ data: { name: 'Website revamp', organizationId: orgId, ownerId: staff.user.id, phase: 'ongoing' } });
    await prisma.project.create({ data: { name: 'Mobile app', organizationId: orgId, ownerId: staff.user.id, phase: 'pre_project' } });

    await createInvoice(prisma, { organizationId: orgId, issuedBy: staff.user.id, totalMinor: 200_000n });
    const paidInvoice = await createInvoice(prisma, { organizationId: orgId, issuedBy: staff.user.id, totalMinor: 300_000n });
    await prisma.invoice.update({ where: { id: paidInvoice.id }, data: { invoiceStatus: 'paid', paidAt: new Date() } });

    await creditWallet(prisma, client.user.id, 750_000n);

    const ticketType = await prisma.ticketType.findFirstOrThrow();
    await prisma.supportTicket.create({
      data: { ticketNo: 'TCK-TEST-1', ticketTypeId: ticketType.id, raisedBy: client.user.id, subject: 'Help', ticketStatus: 'open' },
    });
    await prisma.supportTicket.create({
      data: { ticketNo: 'TCK-TEST-2', ticketTypeId: ticketType.id, raisedBy: client.user.id, subject: 'Resolved one', ticketStatus: 'resolved' },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/analytics/me/overview')
      .set('Authorization', `Bearer ${client.accessToken}`)
      .expect(200);

    const data = res.body.data;
    expect(data.projects.total).toBe(2);
    expect(data.projects.byPhase.ongoing).toBe(1);
    expect(data.projects.byPhase.pre_project).toBe(1);

    expect(data.wallet.balanceMinor).toBe('750000');

    expect(data.invoices.total).toBe(2);
    expect(data.invoices.byStatus.paid).toBe(1);
    expect(data.invoices.totalOutstandingMinor).toBe('200000');

    expect(data.supportTickets.total).toBe(2);
    expect(data.supportTickets.byStatus.open).toBe(1);
    expect(data.supportTickets.byStatus.resolved).toBe(1);
  });
});
