'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

export async function addBankAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/bank-accounts', {
      method: 'POST',
      body: {
        bankCode: formData.get('bankCode'),
        bankName: formData.get('bankName'),
        accountNumber: formData.get('accountNumber'),
      },
    });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Bank account verified and added successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function setDefaultBankAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id'));
  try {
    await apiFetch(`/bank-accounts/${id}/set-default`, { method: 'PATCH' });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Default bank account updated' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function removeBankAccount(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get('id'));
  try {
    await apiFetch(`/bank-accounts/${id}`, { method: 'DELETE' });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Bank account removed' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
