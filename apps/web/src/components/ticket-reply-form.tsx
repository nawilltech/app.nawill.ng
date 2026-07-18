'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { addTicketMessage } from '@/lib/actions/support';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Sending…' : 'Send reply'}
    </Button>
  );
}

export function TicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(addTicketMessage, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="ticketId" value={ticketId} />
      <Textarea name="body" required rows={3} placeholder="Write a reply…" />
      {state.error && <ErrorAlert message={state.error} />}
      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
