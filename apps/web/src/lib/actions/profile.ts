'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

export async function updateProfile(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/users/me', {
      method: 'PATCH',
      body: {
        name: formData.get('name'),
        phoneNo: formData.get('phoneNo') || undefined,
      },
    });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Profile updated successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function changePassword(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/auth/change-password', {
      method: 'POST',
      body: {
        currentPassword: formData.get('currentPassword'),
        newPassword: formData.get('newPassword'),
      },
    });
    return { ok: true, message: 'Password changed successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function resendVerification(_prev: ActionResult, _formData: FormData): Promise<ActionResult> {
  try {
    const result = await apiFetch<{ message: string }>('/auth/resend-verification', { method: 'POST' });
    return { ok: true, message: result.message };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
