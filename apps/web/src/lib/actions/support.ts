'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { actionErrorFrom, ActionResult } from '@/lib/action-result';

interface SupportTicket {
  id: string;
}

export async function createSupportTicket(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  let ticket: SupportTicket;
  try {
    ticket = await apiFetch<SupportTicket>('/support-tickets', {
      method: 'POST',
      body: {
        ticketTypeId: formData.get('ticketTypeId'),
        subject: formData.get('subject'),
        priority: formData.get('priority') || undefined,
      },
    });
  } catch (e) {
    return actionErrorFrom(e);
  }
  revalidatePath('/dashboard/support');
  redirect(`/dashboard/support/${ticket.id}`);
}

export async function addTicketMessage(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ticketId = String(formData.get('ticketId'));
  try {
    await apiFetch(`/support-tickets/${ticketId}/messages`, {
      method: 'POST',
      body: { body: formData.get('body') },
    });
    revalidatePath(`/dashboard/support/${ticketId}`);
    return { ok: true };
  } catch (e) {
    return actionErrorFrom(e);
  }
}
