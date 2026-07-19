'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

export async function updateUser(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get('userId'));
  const userType = formData.get('userType');
  const status = formData.get('status');
  try {
    await apiFetch(`/users/${userId}`, {
      method: 'PATCH',
      body: {
        userType: userType || undefined,
        status: status === null ? undefined : status === 'true',
      },
    });
    revalidatePath('/dashboard/admin/users');
    return { ok: true, message: 'User updated successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function assignRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get('userId'));
  try {
    await apiFetch(`/users/${userId}/roles`, {
      method: 'POST',
      body: { roleId: formData.get('roleId') },
    });
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { ok: true, message: 'Role assigned successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function revokeRole(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const userId = String(formData.get('userId'));
  const roleId = String(formData.get('roleId'));
  try {
    await apiFetch(`/users/${userId}/roles/${roleId}`, { method: 'DELETE' });
    revalidatePath(`/dashboard/admin/users/${userId}`);
    return { ok: true, message: 'Role revoked successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function createProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await apiFetch('/projects', {
      method: 'POST',
      body: {
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        organizationId: formData.get('organizationId'),
        ownerId: formData.get('ownerId'),
        serviceId: formData.get('serviceId') || undefined,
        dueDate: formData.get('dueDate') || undefined,
      },
    });
    revalidatePath('/dashboard/projects');
    return { ok: true, message: 'Project created successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function updateProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get('projectId'));
  try {
    await apiFetch(`/projects/${projectId}`, {
      method: 'PATCH',
      body: {
        name: formData.get('name') || undefined,
        description: formData.get('description') || undefined,
        phase: formData.get('phase') || undefined,
        dueDate: formData.get('dueDate') || undefined,
      },
    });
    revalidatePath('/dashboard/projects');
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { ok: true, message: 'Project updated successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function deleteProject(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const projectId = String(formData.get('projectId'));
  try {
    await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
    revalidatePath('/dashboard/projects');
    return { ok: true, message: 'Project removed successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

interface InvoiceItemInput {
  itemName: string;
  period?: string;
  quantity: string | number;
  unitAmountMinor: string | number;
}

export async function createInvoice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    const rawItems = JSON.parse(String(formData.get('items') ?? '[]')) as InvoiceItemInput[];
    const items = rawItems.map((item) => ({
      itemName: item.itemName,
      period: item.period || undefined,
      quantity: Number(item.quantity) || 1,
      unitAmountMinor: Number(item.unitAmountMinor) || 0,
    }));
    const vatEnabled = formData.get('vatEnabled') === 'true';

    await apiFetch('/invoices', {
      method: 'POST',
      body: {
        organizationId: formData.get('organizationId'),
        projectId: formData.get('projectId') || undefined,
        currency: formData.get('currency'),
        dueDate: formData.get('dueDate'),
        notes: formData.get('notes') || undefined,
        discountMinor: Number(formData.get('discountMinor')) || undefined,
        vatEnabled,
        vatRate: vatEnabled ? Number(formData.get('vatRate')) || 0 : undefined,
        items,
      },
    });
    revalidatePath('/dashboard/invoices');
    return { ok: true, message: 'Invoice created successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}

export async function updateInvoice(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const invoiceId = String(formData.get('invoiceId'));
  try {
    await apiFetch(`/invoices/${invoiceId}`, {
      method: 'PATCH',
      body: {
        dueDate: formData.get('dueDate') || undefined,
        invoiceStatus: formData.get('invoiceStatus') || undefined,
        notes: formData.get('notes') || undefined,
      },
    });
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/invoices/${invoiceId}`);
    return { ok: true, message: 'Invoice updated successfully' };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
