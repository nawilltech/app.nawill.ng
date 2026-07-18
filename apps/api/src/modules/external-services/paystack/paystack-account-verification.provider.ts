import { Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ResolvedAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}

export interface Bank {
  name: string;
  code: string;
}

interface PaystackResolveResponse {
  status: boolean;
  message: string;
  data?: { account_number: string; account_name: string };
}

interface PaystackBankListResponse {
  status: boolean;
  message: string;
  data?: { name: string; code: string }[];
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Used only when PAYSTACK_SECRET_KEY isn't set — the ~15 most common Nigerian banks,
// with their real Paystack bank codes, so the "add bank account" form has something
// realistic to populate a dropdown with in dev/test.
const MOCK_BANKS: Bank[] = [
  { name: 'Access Bank', code: '044' },
  { name: 'Ecobank Nigeria', code: '050' },
  { name: 'Fidelity Bank', code: '070' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'First City Monument Bank', code: '214' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'Keystone Bank', code: '082' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Polaris Bank', code: '076' },
  { name: 'Providus Bank', code: '101' },
  { name: 'Stanbic IBTC Bank', code: '221' },
  { name: 'Sterling Bank', code: '232' },
  { name: 'Union Bank of Nigeria', code: '032' },
  { name: 'United Bank For Africa', code: '033' },
  { name: 'Wema Bank', code: '035' },
  { name: 'Zenith Bank', code: '057' },
];

/**
 * Calls Paystack's "Resolve Account Number" endpoint to confirm a bank account holder's
 * name before it's trusted for payouts/refunds (docs/ARCHITECTURE.md §7.8). With no
 * PAYSTACK_SECRET_KEY configured (this sandbox, and CI/tests), it returns a deterministic
 * mock result instead of calling the network — same "sandbox-by-default" shape as
 * MockPaymentProcessorAdapter, just without a separate class since there's only ever one
 * real implementation of this call.
 */
@Injectable()
export class PaystackAccountVerificationProvider {
  private readonly logger = new Logger(PaystackAccountVerificationProvider.name);

  constructor(private readonly config: ConfigService) {}

  async resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn('PAYSTACK_SECRET_KEY not set — using deterministic mock account resolution');
      return { accountNumber, bankCode, accountName: `TEST ACCOUNT ${accountNumber.slice(-4)}` };
    }

    const url = `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`;
    const response = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
    const body = (await response.json()) as PaystackResolveResponse;

    if (!response.ok || !body.status || !body.data) {
      throw new UnprocessableEntityException(body.message || 'Could not verify this bank account with Paystack');
    }

    return { accountNumber: body.data.account_number, accountName: body.data.account_name, bankCode };
  }

  async listBanks(): Promise<Bank[]> {
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      return MOCK_BANKS;
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?country=nigeria`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const body = (await response.json()) as PaystackBankListResponse;

    if (!response.ok || !body.status || !body.data) {
      throw new UnprocessableEntityException(body.message || 'Could not fetch the bank list from Paystack');
    }

    return body.data.map((b) => ({ name: b.name, code: b.code }));
  }
}
