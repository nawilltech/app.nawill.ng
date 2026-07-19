import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';

describe('Invoices — multi-item, discount, VAT (e2e)', () => {
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

  it('sums multiple items, applies a discount, and computes VAT on the discounted amount', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .send({
        organizationId: client.user.organizationId,
        currency: 'NGN',
        dueDate: '2026-12-01',
        discountMinor: 5000,
        vatEnabled: true,
        vatRate: 7.5,
        items: [
          { itemName: 'Website Hosting', quantity: 1, unitAmountMinor: 3763200 },
          { itemName: 'Domain Name', quantity: 1, unitAmountMinor: 3315300 },
        ],
      })
      .expect(201);

    const invoice = res.body.data;
    // subtotal = 3763200 + 3315300 = 7078500
    expect(invoice.subtotalMinor).toBe('7078500');
    expect(invoice.discountMinor).toBe('5000');
    // taxable = 7078500 - 5000 = 7073500; vat = round(7073500 * 0.075) = 530513
    expect(invoice.taxMinor).toBe('530513');
    // total = 7073500 + 530513 = 7604013
    expect(invoice.totalMinor).toBe('7604013');
    expect(invoice.items).toHaveLength(2);
  });

  it('excludes VAT entirely when vatEnabled is false, regardless of a passed vatRate', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .send({
        organizationId: client.user.organizationId,
        currency: 'NGN',
        dueDate: '2026-12-01',
        vatEnabled: false,
        items: [{ itemName: 'One-off item', quantity: 2, unitAmountMinor: 10000 }],
      })
      .expect(201);

    expect(res.body.data.taxMinor).toBe('0');
    expect(res.body.data.totalMinor).toBe('20000');
    expect(res.body.data.vatEnabled).toBe(false);
  });

  it('rejects a discount larger than the items subtotal', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .send({
        organizationId: client.user.organizationId,
        currency: 'NGN',
        dueDate: '2026-12-01',
        discountMinor: 999999,
        items: [{ itemName: 'Small item', quantity: 1, unitAmountMinor: 1000 }],
      })
      .expect(400);
  });

  it('excludes a cancelled item from the subtotal but keeps it on the invoice for the struck-through display', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${staff.accessToken}`)
      .send({
        organizationId: client.user.organizationId,
        currency: 'NGN',
        dueDate: '2026-12-01',
        items: [
          { itemName: 'Kept item', quantity: 1, unitAmountMinor: 5000 },
          { itemName: 'Waived item', quantity: 1, unitAmountMinor: 95000, isCancelled: true },
        ],
      })
      .expect(201);

    expect(res.body.data.subtotalMinor).toBe('5000');
    expect(res.body.data.totalMinor).toBe('5000');
    expect(res.body.data.items).toHaveLength(2);
    const cancelledItem = res.body.data.items.find((i: { isCancelled: boolean }) => i.isCancelled);
    expect(cancelledItem.actualAmountMinor).toBe('0');
    expect(cancelledItem.unitAmountMinor).toBe('95000');
  });
});
