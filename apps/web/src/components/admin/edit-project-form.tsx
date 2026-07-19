'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateProject, deleteProject } from '@/lib/actions/admin';
import { Field, Input, Select } from '@/components/ui/input';
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

function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" disabled={pending}>
      {pending ? 'Removing…' : 'Delete project'}
    </Button>
  );
}

export function EditProjectForm({
  projectId,
  name,
  description,
  phase,
  dueDate,
}: {
  projectId: string;
  name: string;
  description: string | null;
  phase: string;
  dueDate: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useFormState<ActionResult, FormData>(updateProject, {});
  const [deleteState, deleteAction] = useFormState<ActionResult, FormData>(deleteProject, {});

  useEffect(() => {
    if (deleteState.ok) router.push('/dashboard/projects');
  }, [deleteState.ok, router]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="projectId" value={projectId} />

        <Field label="Project name">
          <Input name="name" defaultValue={name} required minLength={2} />
        </Field>

        <Field label="Description">
          <Input name="description" defaultValue={description ?? ''} />
        </Field>

        <Field label="Phase">
          <Select name="phase" defaultValue={phase}>
            <option value="pre_project">Pre-project</option>
            <option value="ongoing">Ongoing</option>
            <option value="post_project">Post-project</option>
            <option value="maintenance">Maintenance</option>
          </Select>
        </Field>

        <Field label="Due date">
          <Input name="dueDate" type="date" defaultValue={dueDate ? dueDate.slice(0, 10) : ''} />
        </Field>

        {state.error && <ErrorAlert message={state.error} />}
        {state.ok && <SuccessAlert message={state.message ?? 'Saved'} />}

        <div>
          <SaveButton />
        </div>
      </form>

      <form action={deleteAction} className="border-t border-neutral-200 pt-4">
        <input type="hidden" name="projectId" value={projectId} />
        {deleteState.error && <ErrorAlert message={deleteState.error} />}
        <DeleteButton />
      </form>
    </div>
  );
}
