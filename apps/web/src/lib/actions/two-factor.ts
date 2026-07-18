'use server';

import QRCode from 'qrcode';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

interface TotpSetup {
  secret: string;
  otpauthUrl: string;
}

export async function setupTotp(): Promise<ActionResult> {
  try {
    const setup = await apiFetch<TotpSetup>('/auth/2fa/totp/setup', { method: 'POST' });
    const qrCodeDataUrl = await QRCode.toDataURL(setup.otpauthUrl);
    return { ok: true, data: { secret: setup.secret, qrCodeDataUrl } };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function confirmTotp(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/auth/2fa/totp/enable', { method: 'POST', body: { code: formData.get('code') } });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Authenticator app enabled' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function requestEmailTwoFactorCode(): Promise<ActionResult> {
  try {
    await apiFetch('/auth/2fa/email/request-code', { method: 'POST' });
    return { ok: true, message: 'Confirmation code sent to your email' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function enableEmailTwoFactor(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/auth/2fa/email/enable', { method: 'POST', body: { code: formData.get('code') } });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Email two-factor authentication enabled' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function disableTwoFactor(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/auth/2fa/disable', { method: 'POST', body: { password: formData.get('password') } });
    revalidatePath('/dashboard/settings');
    return { ok: true, message: 'Two-factor authentication disabled' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
