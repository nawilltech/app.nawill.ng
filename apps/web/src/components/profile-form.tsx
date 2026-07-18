'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateProfile, changePassword } from '@/lib/actions/profile';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function ProfileForm({ name, phoneNo }: { name: string; phoneNo: string | null }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(updateProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Name">
        <Input name="name" required defaultValue={name} />
      </Field>
      <Field label="Phone number">
        <Input name="phoneNo" defaultValue={phoneNo ?? ''} placeholder="+234..." />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Saved'} />}

      <div>
        <SubmitButton label="Save profile" pendingLabel="Saving…" />
      </div>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(changePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Current password">
        <Input name="currentPassword" type="password" required />
      </Field>
      <Field
        label="New password"
        hint="At least 8 characters, with uppercase, lowercase, a number, and a special character."
      >
        <Input name="newPassword" type="password" required />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Password changed'} />}

      <div>
        <SubmitButton label="Change password" pendingLabel="Changing…" />
      </div>
    </form>
  );
}
