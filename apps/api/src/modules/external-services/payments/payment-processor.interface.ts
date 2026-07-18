export interface CreateLinkParams {
  amountMinor: bigint;
  currency: string;
  reference: string;
}

export interface CreateLinkResult {
  paymentLink: string;
  processorReference: string;
}

export type ProcessorTxnStatus = 'pending' | 'successful' | 'failed';

export interface VerifyResult {
  status: ProcessorTxnStatus;
  amountMinor: bigint;
  currency: string;
}

export interface ParsedWebhookEvent {
  eventType: string;
  processorReference: string;
}

/**
 * One implementation per processor (Paystack, Flutterwave, ...), selected via the
 * payment_processors table. Swapping in a real processor means writing a new class
 * that implements this — nothing else in the payments/wallets flow changes.
 */
export interface PaymentProcessorAdapter {
  readonly processorName: string;

  createLink(params: CreateLinkParams): Promise<CreateLinkResult>;

  verify(processorReference: string): Promise<VerifyResult>;

  verifySignature(rawBody: string, signatureHeader: string | undefined): boolean;

  parseWebhook(rawBody: string): ParsedWebhookEvent;
}

export const PAYMENT_PROCESSOR_ADAPTER = 'PAYMENT_PROCESSOR_ADAPTER';
