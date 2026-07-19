'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateUser } from '@/lib/actions/admin';
import { Field, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Save changes'}
    </Button>
  );
}

export function UserEditForm({
  userId,
  userType,
  status,
}: {
  userId: string;
  userType: string;
  status: boolean;
}) {
  const [state, formAction] = useFormState<ActionResult, FormData>(updateUser, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="userId" value={userId} />

      <Field label="Role">
        <Select name="userType" defaultValue={userType}>
          <option value="client">Client</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </Select>
      </Field>

      <Field label="Status">
        <Select name="status" defaultValue={String(status)}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Saved'} />}

      <div>
        <SubmitButton />
      </div>
    </form>
  );
}
