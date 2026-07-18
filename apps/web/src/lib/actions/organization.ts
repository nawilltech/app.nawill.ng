'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

export async function updateOrganization(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const organizationId = String(formData.get('organizationId'));
  try {
    await apiFetch(`/organizations/${organizationId}`, {
      method: 'PATCH',
      body: {
        name: formData.get('name'),
        sector: formData.get('sector') || undefined,
        headOffice: formData.get('headOffice') || undefined,
      },
    });
    revalidatePath('/dashboard/organization');
    return { ok: true, message: 'Organization updated successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function submitKycDocument(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const organizationId = String(formData.get('organizationId'));
  try {
    await apiFetch(`/organizations/${organizationId}/kyc-documents`, {
      method: 'POST',
      body: {
        docType: formData.get('docType'),
        fileId: formData.get('fileId'),
      },
    });
    revalidatePath('/dashboard/organization');
    return { ok: true, message: 'KYC document submitted successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
