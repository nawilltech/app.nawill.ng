import { Injectable, NotFoundException } from '@nestjs/common';
import { Payment, PaymentPurpose } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentProcessorAdapter } from '../external-services/payments/mock-payment-processor.adapter';
import { VerifyResult } from '../external-services/payments/payment-processor.interface';

export interface InitiatePaymentParams {
  purpose: PaymentPurpose;
  invoiceId?: string;
  walletId?: string;
  amountMinor: bigint;
  currency: string;
  initiatedBy: string;
  idempotencyKey: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockAdapter: MockPaymentProcessorAdapter,
  ) {}

  /** Only the mock adapter is wired up in this build — see docs/QA.md §7. */
  private getAdapter(_processorName: string) {
    return this.mockAdapter;
  }

  async getById(id: string): Promise<Payment> {
    const payment = await this.prisma.payment.findFirst({ where: { id, deletedAt: null } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async initiate(params: InitiatePaymentParams): Promise<Payment> {
    const existing = await this.prisma.payment.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) {
      return existing;
    }

    const processor = await this.prisma.paymentProcessor.findFirstOrThrow({
      where: { isDefault: true, processorStatus: 'active', deletedAt: null },
    });
    const adapter = this.getAdapter(processor.name);
    const reference = `PAY-${randomUUID()}`;

    const payment = await this.prisma.payment.create({
      data: {
        purpose: params.purpose,
        invoiceId: params.invoiceId,
        walletId: params.walletId,
        initiatedBy: params.initiatedBy,
        processorId: processor.id,
        amountMinor: params.amountMinor,
        currency: params.currency,
        idempotencyKey: params.idempotencyKey,
        reference,
        paymentStatus: 'initiated',
      },
    });

    const { paymentLink, processorReference } = await adapter.createLink({
      amountMinor: params.amountMinor,
      currency: params.currency,
      reference,
    });

    return this.prisma.payment.update({
      where: { id: payment.id },
      data: { paymentStatus: 'pending', paymentLink, processorReference },
    });
  }

  async handleWebhook(processorName: string, rawBody: string, signatureHeader: string | undefined) {
    const processor = await this.prisma.paymentProcessor.findFirst({
      where: { name: processorName as never, deletedAt: null },
    });
    if (!processor) throw new NotFoundException('Unknown payment processor');

    const adapter = this.getAdapter(processorName);
    const signatureValid = adapter.verifySignature(rawBody, signatureHeader);

    let parsed: { eventType: string; processorReference: string } | null = null;
    let rawPayload: unknown = {};
    try {
      rawPayload = JSON.parse(rawBody);
      parsed = adapter.parseWebhook(rawBody);
    } catch {
      parsed = null;
    }

    const notification = await this.prisma.paymentNotification.create({
      data: {
        processorId: processor.id,
        eventType: parsed?.eventType ?? 'unknown',
        rawPayload: rawPayload as never,
        signatureValid,
        processingStatus: 'received',
      },
    });

    if (!signatureValid || !parsed) {
      await this.prisma.paymentNotification.update({
        where: { id: notification.id },
        data: { processingStatus: 'ignored', processedAt: new Date() },
      });
      return { received: true };
    }

    const payment = await this.prisma.payment.findFirst({
      where: { processorReference: parsed.processorReference },
    });

    if (!payment) {
      await this.prisma.paymentNotification.update({
        where: { id: notification.id },
        data: { processingStatus: 'ignored', processedAt: new Date() },
      });
      return { received: true };
    }

    if (payment.paymentStatus === 'successful') {
      await this.prisma.paymentNotification.update({
        where: { id: notification.id },
        data: { processingStatus: 'ignored', processedAt: new Date(), paymentId: payment.id },
      });
      return { received: true };
    }

    const verification = await adapter.verify(parsed.processorReference);
    await this.reconcile(payment.id, verification, notification.id);

    return { received: true };
  }

  /** Manual re-check against the processor, for payments stuck in `pending`. */
  async requery(paymentId: string): Promise<Payment> {
    const payment = await this.getById(paymentId);
    if (!payment.processorReference) {
      return payment;
    }
    const adapter = this.getAdapter('mock');
    const verification = await adapter.verify(payment.processorReference);
    await this.reconcile(paymentId, verification, null);
    return this.getById(paymentId);
  }

  private async reconcile(paymentId: string, verification: VerifyResult, notificationId: string | null): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });

      const matches =
        verification.status === 'successful' &&
        verification.amountMinor === payment.amountMinor &&
        verification.currency === payment.currency;

      if (notificationId) {
        await tx.paymentNotification.update({
          where: { id: notificationId },
          data: { processingStatus: 'processed', processedAt: new Date(), paymentId },
        });
      }

      if (!matches) {
        await tx.payment.updateMany({
          where: { id: paymentId, paymentStatus: { not: 'successful' } },
          data: {
            paymentStatus: verification.status === 'failed' ? 'failed' : 'pending',
            failureReason:
              verification.status !== 'successful'
                ? 'Processor did not report a successful transaction'
                : 'Amount/currency mismatch between processor verification and the recorded payment',
          },
        });
        return;
      }

      const { count } = await tx.payment.updateMany({
        where: { id: paymentId, paymentStatus: { not: 'successful' } },
        data: { paymentStatus: 'successful', reconciledAt: new Date() },
      });

      // count === 0 means a concurrent/duplicate delivery already reconciled this payment.
      if (count === 0) return;

      if (payment.purpose === 'invoice_payment' && payment.invoiceId) {
        await tx.invoice.updateMany({
          where: { id: payment.invoiceId, invoiceStatus: { not: 'paid' } },
          data: { invoiceStatus: 'paid', paidAt: new Date() },
        });
      } else if (payment.purpose === 'wallet_funding' && payment.walletId) {
        const updatedWallet = await tx.wallet.update({
          where: { id: payment.walletId },
          data: { balanceMinor: { increment: payment.amountMinor } },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: updatedWallet.id,
            direction: 'credit',
            source: 'funding',
            amountMinor: payment.amountMinor,
            balanceAfterMinor: updatedWallet.balanceMinor,
            idempotencyKey: `payment-funding:${payment.id}`,
            referencePaymentId: payment.id,
            description: 'Wallet funding via payment processor',
            initiatedBy: payment.initiatedBy,
            txnStatus: 'completed',
          },
        });
      }
    });
  }
}
