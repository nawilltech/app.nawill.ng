import { Module } from '@nestjs/common';
import { MockPaymentProcessorAdapter } from './payments/mock-payment-processor.adapter';
import { PaystackAccountVerificationProvider } from './paystack/paystack-account-verification.provider';

/**
 * Every outbound call to a third party lives under this module — payment processor
 * adapters, Paystack account verification, and anything added later. Keeping all of it
 * in one place is what "special provision for external services" means in practice:
 * one module to audit for "what leaves our network", one place to add the next integration.
 */
@Module({
  providers: [MockPaymentProcessorAdapter, PaystackAccountVerificationProvider],
  exports: [MockPaymentProcessorAdapter, PaystackAccountVerificationProvider],
})
export class ExternalServicesModule {}
