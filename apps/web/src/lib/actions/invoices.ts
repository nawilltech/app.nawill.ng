'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

interface Payment {
  id: string;
  paymentLink: string | null;
}

export async function payInvoiceWithProcessor(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const invoiceId = String(formData.get('invoiceId'));
  try {
    const payment = await apiFetch<Payment>(`/invoices/${invoiceId}/pay`, {
      method: 'POST',
      idempotencyKey: randomUUID(),
    });
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return {
      ok: true,
      message: 'Payment initiated — complete it via the link below.',
      data: { paymentLink: payment.paymentLink },
    };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
