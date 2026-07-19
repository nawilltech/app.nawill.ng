'use client';

import { useFormState, useFormStatus } from 'react-dom';
import Link from 'next/link';
import { createSupportTicket } from '@/lib/actions/support';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

interface TicketType {
  id: string;
  name: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create ticket'}
    </Button>
  );
}

export function NewTicketForm({ ticketTypes }: { ticketTypes: TicketType[] }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(createSupportTicket, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Type">
        <Select name="ticketTypeId" required defaultValue="">
          <option value="" disabled>
            Select a type
          </option>
          {ticketTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subject">
        <Input name="subject" required minLength={3} />
      </Field>

      <Field label="Priority">
        <Select name="priority" defaultValue="medium">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </Field>

      <Field label="Message">
        <Textarea name="message" required minLength={1} rows={4} placeholder="Describe your issue…" />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}

      <div className="flex gap-3">
        <SubmitButton />
        <Link href="/dashboard/support">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
