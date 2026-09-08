'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateInvoice } from '@/lib/actions/admin';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  );
}

export function EditInvoiceForm({
  invoiceId,
  dueDate,
  invoiceStatus,
  notes,
}: {
  invoiceId: string;
  dueDate: string;
  invoiceStatus: string;
  notes?: string | null;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(updateInvoice, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      <Field label="Due date">
        <Input name="dueDate" type="date" defaultValue={dueDate.slice(0, 10)} />
      </Field>

      <Field label="Status">
        <Select name="invoiceStatus" defaultValue={invoiceStatus}>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="partially_paid">Partially paid</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
          <option value="overdue">Overdue</option>
        </Select>
      </Field>

      <Field label="Notes" hint="Shown on the invoice PDF">
        <Textarea name="notes" rows={2} defaultValue={notes ?? ''} />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Saved'} />}

      <div>
        <SaveButton />
      </div>
    </form>
  );
}
