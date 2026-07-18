import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import {
  CreateLinkParams,
  CreateLinkResult,
  ParsedWebhookEvent,
  PaymentProcessorAdapter,
  ProcessorTxnStatus,
  VerifyResult,
} from './payment-processor.interface';

interface MockTxn {
  processorReference: string;
  amountMinor: bigint;
  currency: string;
  status: ProcessorTxnStatus;
}

/**
 * Sandbox stand-in for a real processor (Paystack/Flutterwave/...). No network calls —
 * transactions live in-memory, keyed by processorReference. `markPaid()` is the
 * equivalent of "the customer completed checkout on the processor's hosted page",
 * which in production happens entirely outside our system before the webhook fires.
 */
@Injectable()
export class MockPaymentProcessorAdapter implements PaymentProcessorAdapter {
  readonly processorName = 'mock';
  private readonly store = new Map<string, MockTxn>();

  constructor(private readonly config: ConfigService) {}

  async createLink(params: CreateLinkParams): Promise<CreateLinkResult> {
    const processorReference = `mock_${randomUUID()}`;
    this.store.set(processorReference, {
      processorReference,
      amountMinor: params.amountMinor,
      currency: params.currency,
      status: 'pending',
    });
    return {
      paymentLink: `https://mock-processor.test/pay/${processorReference}`,
      processorReference,
    };
  }

  /**
   * Test/dev-only hook simulating the customer completing checkout on the processor's
   * side. `confirmedAmountMinor` lets a test simulate the processor's own record
   * disagreeing with what we asked for (e.g. a partial capture) — verify() will then
   * return that amount, which reconciliation must refuse to trust blindly.
   */
  markPaid(processorReference: string, confirmedAmountMinor?: bigint): void {
    const txn = this.store.get(processorReference);
    if (!txn) throw new Error(`Unknown mock transaction: ${processorReference}`);
    txn.status = 'successful';
    if (confirmedAmountMinor !== undefined) {
      txn.amountMinor = confirmedAmountMinor;
    }
  }

  markFailed(processorReference: string): void {
    const txn = this.store.get(processorReference);
    if (!txn) throw new Error(`Unknown mock transaction: ${processorReference}`);
    txn.status = 'failed';
  }

  async verify(processorReference: string): Promise<VerifyResult> {
    const txn = this.store.get(processorReference);
    if (!txn) {
      return { status: 'failed', amountMinor: 0n, currency: '' };
    }
    return { status: txn.status, amountMinor: txn.amountMinor, currency: txn.currency };
  }

  verifySignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const expected = this.sign(rawBody);
    const expectedBuf = Buffer.from(expected, 'hex');
    const givenBuf = Buffer.from(signatureHeader, 'hex');
    if (expectedBuf.length !== givenBuf.length) return false;
    return timingSafeEqual(expectedBuf, givenBuf);
  }

  parseWebhook(rawBody: string): ParsedWebhookEvent {
    const payload = JSON.parse(rawBody);
    return {
      eventType: payload.event,
      processorReference: payload.data?.reference,
    };
  }

  /** Test helper: builds a correctly-signed webhook payload for a given transaction. */
  buildSignedWebhook(processorReference: string, eventType = 'charge.success') {
    const txn = this.store.get(processorReference);
    const payload = {
      event: eventType,
      data: {
        reference: processorReference,
        amount: (txn?.amountMinor ?? 0n).toString(),
        currency: txn?.currency ?? 'NGN',
        status: txn?.status ?? 'failed',
      },
    };
    const rawBody = JSON.stringify(payload);
    return { rawBody, signature: this.sign(rawBody) };
  }

  private sign(rawBody: string): string {
    const secret = this.config.getOrThrow<string>('MOCK_PROCESSOR_WEBHOOK_SECRET');
    return createHmac('sha256', secret).update(rawBody).digest('hex');
  }
}
