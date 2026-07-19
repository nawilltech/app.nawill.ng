'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { closeTicket } from '@/lib/actions/support';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? 'Closing…' : 'Close ticket'}
    </Button>
  );
}

export function CloseTicketButton({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(closeTicket, {});

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <SubmitButton />
      {state.error && <ErrorAlert message={state.error} />}
    </form>
  );
}
