import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken, creditWallet, createInvoice } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { MockPaymentProcessorAdapter } from '../src/modules/external-services/payments/mock-payment-processor.adapter';

describe('Wallet (e2e) — sensitive flows', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockAdapter: MockPaymentProcessorAdapter;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    mockAdapter = app.get(MockPaymentProcessorAdapter);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  async function initiateFunding(accessToken: string, amountMinor: number, idempotencyKey: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/wallets/me/fund')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ amountMinor })
      .expect(201);
    return res.body.data as { processorReference: string; id: string };
  }

  function sendWebhook(payload: { rawBody: string; signature: string }) {
    return request(app.getHttpServer())
      .post('/api/v1/webhooks/payments/mock')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', payload.signature)
      .send(JSON.parse(payload.rawBody));
  }

  describe('funding', () => {
    it('credits the wallet exactly once on a successful webhook', async () => {
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      const payment = await initiateFunding(client.accessToken, 500000, 'fund-happy-1');

      mockAdapter.markPaid(payment.processorReference);
      const webhook = mockAdapter.buildSignedWebhook(payment.processorReference);
      await sendWebhook(webhook).expect(201);

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(500000n);

      const txns = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id } });
      expect(txns).toHaveLength(1);
      expect(txns[0].balanceAfterMinor).toBe(500000n);
    });

    it('is a no-op on a duplicate webhook delivery for the same payment', async () => {
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      const payment = await initiateFunding(client.accessToken, 250000, 'fund-dup-1');

      mockAdapter.markPaid(payment.processorReference);
      const webhook = mockAdapter.buildSignedWebhook(payment.processorReference);

      await sendWebhook(webhook).expect(201);
      await sendWebhook(webhook).expect(201); // processor redelivers the same event

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(250000n);
    });

    it('leaves the balance untouched when the webhook signature is invalid', async () => {
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      const payment = await initiateFunding(client.accessToken, 300000, 'fund-badsig-1');
      mockAdapter.markPaid(payment.processorReference);

      await request(app.getHttpServer())
        .post('/api/v1/webhooks/payments/mock')
        .set('Content-Type', 'application/json')
        .set('x-mock-signature', 'deadbeef'.repeat(8))
        .send({ event: 'charge.success', data: { reference: payment.processorReference, amount: '300000', currency: 'NGN', status: 'successful' } })
        .expect(201);

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(0n);

      const notification = await prisma.paymentNotification.findFirstOrThrow({ orderBy: { createdAt: 'desc' } });
      expect(notification.signatureValid).toBe(false);
    });

    it('does not create a duplicate payment when the same Idempotency-Key is retried', async () => {
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      const first = await initiateFunding(client.accessToken, 100000, 'fund-idem-1');
      const second = await initiateFunding(client.accessToken, 100000, 'fund-idem-1');

      expect(second.id).toBe(first.id);
      const count = await prisma.payment.count({ where: { idempotencyKey: 'fund-idem-1' } });
      expect(count).toBe(1);
    });
  });

  describe('pay invoice with wallet', () => {
    it('debits the wallet and marks the invoice paid when balance is sufficient', async () => {
      const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      await creditWallet(prisma, client.user.id, 1_000_000n);
      const invoice = await createInvoice(prisma, {
        organizationId: client.user.organizationId as string,
        issuedBy: staff.user.id,
        totalMinor: 400_000n,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/invoices/${invoice.id}/pay-with-wallet`)
        .set('Authorization', `Bearer ${client.accessToken}`)
        .set('Idempotency-Key', 'pay-happy-1')
        .expect(201);

      expect(res.body.data.balanceAfterMinor).toBe('600000');

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(600_000n);

      const updatedInvoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      expect(updatedInvoice.invoiceStatus).toBe('paid');
    });

    it('rejects with 422 and leaves state untouched when balance is insufficient', async () => {
      const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      await creditWallet(prisma, client.user.id, 10_000n);
      const invoice = await createInvoice(prisma, {
        organizationId: client.user.organizationId as string,
        issuedBy: staff.user.id,
        totalMinor: 400_000n,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/invoices/${invoice.id}/pay-with-wallet`)
        .set('Authorization', `Bearer ${client.accessToken}`)
        .set('Idempotency-Key', 'pay-insufficient-1')
        .expect(422);

      expect(res.body.errorCode).toBe('UNPROCESSABLE');

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(10_000n);
      const updatedInvoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
      expect(updatedInvoice.invoiceStatus).not.toBe('paid');
      // 1, not 0: creditWallet() itself writes the initial funding ledger row; the
      // assertion that matters is that the failed debit added no *second* row.
      const ledgerCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });
      expect(ledgerCount).toBe(1);
    });

    it('debits exactly once when the same Idempotency-Key is retried', async () => {
      const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      await creditWallet(prisma, client.user.id, 1_000_000n);
      const invoice = await createInvoice(prisma, {
        organizationId: client.user.organizationId as string,
        issuedBy: staff.user.id,
        totalMinor: 400_000n,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/invoices/${invoice.id}/pay-with-wallet`)
        .set('Authorization', `Bearer ${client.accessToken}`)
        .set('Idempotency-Key', 'pay-retry-1')
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/invoices/${invoice.id}/pay-with-wallet`)
        .set('Authorization', `Bearer ${client.accessToken}`)
        .set('Idempotency-Key', 'pay-retry-1')
        .expect(201);

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(600_000n);
      // 2, not 1: creditWallet()'s funding row plus exactly one debit row — the
      // retried request must not have added a second debit.
      const ledgerCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });
      expect(ledgerCount).toBe(2);
    });

    it('grants exactly one of two concurrent requests when the balance only covers one', async () => {
      const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
      const client = await createUserWithToken(app, prisma, { userType: 'client' });
      await creditWallet(prisma, client.user.id, 400_000n);
      const invoiceA = await createInvoice(prisma, {
        organizationId: client.user.organizationId as string,
        issuedBy: staff.user.id,
        totalMinor: 400_000n,
      });
      const invoiceB = await createInvoice(prisma, {
        organizationId: client.user.organizationId as string,
        issuedBy: staff.user.id,
        totalMinor: 400_000n,
      });

      const [resA, resB] = await Promise.all([
        request(app.getHttpServer())
          .post(`/api/v1/invoices/${invoiceA.id}/pay-with-wallet`)
          .set('Authorization', `Bearer ${client.accessToken}`)
          .set('Idempotency-Key', 'pay-race-a')
          .send(),
        request(app.getHttpServer())
          .post(`/api/v1/invoices/${invoiceB.id}/pay-with-wallet`)
          .set('Authorization', `Bearer ${client.accessToken}`)
          .set('Idempotency-Key', 'pay-race-b')
          .send(),
      ]);

      const statuses = [resA.status, resB.status].sort();
      expect(statuses).toEqual([201, 422]);

      const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: client.user.id } });
      expect(wallet.balanceMinor).toBe(0n);
      expect(wallet.balanceMinor).toBeGreaterThanOrEqual(0n);
    });

    it('does not allow a user to read or spend another user’s wallet', async () => {
      const userA = await createUserWithToken(app, prisma, { userType: 'client' });
      const userB = await createUserWithToken(app, prisma, { userType: 'client' });
      await creditWallet(prisma, userA.user.id, 1_000_000n);

      const resA = await request(app.getHttpServer())
        .get('/api/v1/wallets/me')
        .set('Authorization', `Bearer ${userA.accessToken}`)
        .expect(200);
      const resB = await request(app.getHttpServer())
        .get('/api/v1/wallets/me')
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(200);

      expect(resA.body.data.balanceMinor).toBe('1000000');
      expect(resB.body.data.balanceMinor).toBe('0');

      await request(app.getHttpServer())
        .get(`/api/v1/wallets/${userA.user.id}`)
        .set('Authorization', `Bearer ${userB.accessToken}`)
        .expect(403);
    });
  });
});
