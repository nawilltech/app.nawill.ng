import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './utils/test-app';
import { resetDb } from './utils/reset-db';
import { createUserWithToken, createInvoice } from './utils/fixtures';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { MockPaymentProcessorAdapter } from '../src/modules/external-services/payments/mock-payment-processor.adapter';

describe('Payments — invoice-via-processor webhook reconciliation (e2e)', () => {
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

  function sendWebhook(rawBody: string, signature: string) {
    return request(app.getHttpServer())
      .post('/api/v1/webhooks/payments/mock')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', signature)
      .send(JSON.parse(rawBody));
  }

  it('marks the invoice paid on a verified successful webhook', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });
    const invoice = await createInvoice(prisma, {
      organizationId: client.user.organizationId as string,
      issuedBy: staff.user.id,
      totalMinor: 750_000n,
    });

    const initiateRes = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoice.id}/pay`)
      .set('Authorization', `Bearer ${client.accessToken}`)
      .set('Idempotency-Key', 'inv-pay-1')
      .expect(201);

    const processorReference = initiateRes.body.data.processorReference as string;
    mockAdapter.markPaid(processorReference);
    const webhook = mockAdapter.buildSignedWebhook(processorReference);
    await sendWebhook(webhook.rawBody, webhook.signature).expect(201);

    const updated = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updated.invoiceStatus).toBe('paid');
    expect(updated.paidAt).not.toBeNull();

    const payment = await prisma.payment.findFirstOrThrow({ where: { idempotencyKey: 'inv-pay-1' } });
    expect(payment.paymentStatus).toBe('successful');
    expect(payment.reconciledAt).not.toBeNull();
  });

  it('ignores a validly-signed webhook for an unknown processor reference without erroring', async () => {
    // Signing doesn't require the transaction to exist in the mock's store, so this
    // exercises the "unknown payment" branch distinctly from signature validity.
    const webhook = mockAdapter.buildSignedWebhook('mock_does-not-exist');
    const res = await sendWebhook(webhook.rawBody, webhook.signature);

    expect(res.status).toBe(201);

    const notification = await prisma.paymentNotification.findFirstOrThrow({ orderBy: { createdAt: 'desc' } });
    expect(notification.signatureValid).toBe(true);
    expect(notification.processingStatus).toBe('ignored');
  });

  it('refuses to mark the payment successful when verify() amount disagrees with the recorded payment', async () => {
    const staff = await createUserWithToken(app, prisma, { userType: 'staff', organizationId: null });
    const client = await createUserWithToken(app, prisma, { userType: 'client' });
    const invoice = await createInvoice(prisma, {
      organizationId: client.user.organizationId as string,
      issuedBy: staff.user.id,
      totalMinor: 500_000n,
    });

    const initiateRes = await request(app.getHttpServer())
      .post(`/api/v1/invoices/${invoice.id}/pay`)
      .set('Authorization', `Bearer ${client.accessToken}`)
      .set('Idempotency-Key', 'inv-pay-mismatch-1')
      .expect(201);

    const processorReference = initiateRes.body.data.processorReference as string;
    // Processor's own record confirms a smaller amount than what we recorded — e.g. a partial capture.
    mockAdapter.markPaid(processorReference, 100_000n);
    const webhook = mockAdapter.buildSignedWebhook(processorReference);
    await sendWebhook(webhook.rawBody, webhook.signature).expect(201);

    const updatedInvoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(updatedInvoice.invoiceStatus).not.toBe('paid');

    const payment = await prisma.payment.findFirstOrThrow({ where: { idempotencyKey: 'inv-pay-mismatch-1' } });
    expect(payment.paymentStatus).not.toBe('successful');
    expect(payment.reconciledAt).toBeNull();
  });
});
