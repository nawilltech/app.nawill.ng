'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createProject } from '@/lib/actions/admin';
import { Field, Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

interface Option {
  id: string;
  label: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating…' : 'Create project'}
    </Button>
  );
}

export function NewProjectForm({ organizations, owners }: { organizations: Option[]; owners: Option[] }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(createProject, {});

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Project name">
        <Input name="name" required minLength={2} />
      </Field>

      <Field label="Due date">
        <Input name="dueDate" type="date" />
      </Field>

      <Field label="Organization">
        <Select name="organizationId" required defaultValue="">
          <option value="" disabled>
            Select an organization
          </option>
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Owner (project manager)">
        <Select name="ownerId" required defaultValue="">
          <option value="" disabled>
            Select an owner
          </option>
          {owners.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="sm:col-span-2">
        <Field label="Description">
          <Input name="description" />
        </Field>
      </div>

      {state.error && (
        <div className="sm:col-span-2">
          <ErrorAlert message={state.error} />
        </div>
      )}
      {state.ok && (
        <div className="sm:col-span-2">
          <SuccessAlert message={state.message ?? 'Created'} />
        </div>
      )}

      <div className="flex gap-3">
        <SubmitButton />
        <Button type="reset" variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
}
