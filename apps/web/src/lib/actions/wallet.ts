'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

interface Payment {
  id: string;
  paymentLink: string | null;
}

export async function fundWallet(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const naira = Number(formData.get('amount'));
  if (!Number.isFinite(naira) || naira <= 0) {
    return { error: 'Enter a valid amount', fieldErrors: { amount: 'Must be a positive number' } };
  }

  try {
    const payment = await apiFetch<Payment>('/wallets/me/fund', {
      method: 'POST',
      body: { amountMinor: Math.round(naira * 100) },
      idempotencyKey: randomUUID(),
    });
    revalidatePath('/dashboard/wallet');
    return {
      ok: true,
      message: 'Funding initiated — complete payment via the link below.',
      data: { paymentLink: payment.paymentLink },
    };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function payInvoiceWithWallet(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const invoiceId = String(formData.get('invoiceId'));
  try {
    await apiFetch(`/invoices/${invoiceId}/pay-with-wallet`, {
      method: 'POST',
      idempotencyKey: randomUUID(),
    });
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    revalidatePath('/dashboard/wallet');
    revalidatePath('/dashboard/invoices');
    return { ok: true, message: 'Invoice paid from wallet successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
