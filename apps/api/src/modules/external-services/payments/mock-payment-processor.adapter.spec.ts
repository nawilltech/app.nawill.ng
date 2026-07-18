import { ConfigService } from '@nestjs/config';
import { MockPaymentProcessorAdapter } from './mock-payment-processor.adapter';

function buildAdapter(): MockPaymentProcessorAdapter {
  const config = { getOrThrow: () => 'test-secret' } as unknown as ConfigService;
  return new MockPaymentProcessorAdapter(config);
}

describe('MockPaymentProcessorAdapter', () => {
  it('round-trips createLink -> verify for a paid transaction', async () => {
    const adapter = buildAdapter();
    const { processorReference } = await adapter.createLink({ amountMinor: 50_000n, currency: 'NGN', reference: 'REF-1' });

    let verification = await adapter.verify(processorReference);
    expect(verification.status).toBe('pending');

    adapter.markPaid(processorReference);
    verification = await adapter.verify(processorReference);
    expect(verification.status).toBe('successful');
    expect(verification.amountMinor).toBe(50_000n);
  });

  it('verify() reflects a confirmed amount that differs from what was requested', async () => {
    const adapter = buildAdapter();
    const { processorReference } = await adapter.createLink({ amountMinor: 50_000n, currency: 'NGN', reference: 'REF-2' });

    adapter.markPaid(processorReference, 10_000n);
    const verification = await adapter.verify(processorReference);
    expect(verification.amountMinor).toBe(10_000n);
  });

  it('accepts a signature produced by the same secret', () => {
    const adapter = buildAdapter();
    const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'REF-3' } });
    const signature = (adapter as unknown as { sign: (body: string) => string })['sign'](rawBody);
    expect(adapter.verifySignature(rawBody, signature)).toBe(true);
  });

  it('rejects a tampered body even if a signature is present', () => {
    const adapter = buildAdapter();
    const rawBody = JSON.stringify({ event: 'charge.success', data: { reference: 'REF-4', amount: '1000' } });
    const signature = (adapter as unknown as { sign: (body: string) => string })['sign'](rawBody);

    const tamperedBody = JSON.stringify({ event: 'charge.success', data: { reference: 'REF-4', amount: '9999999' } });
    expect(adapter.verifySignature(tamperedBody, signature)).toBe(false);
  });

  it('rejects a missing signature', () => {
    const adapter = buildAdapter();
    expect(adapter.verifySignature('{}', undefined)).toBe(false);
  });
});
