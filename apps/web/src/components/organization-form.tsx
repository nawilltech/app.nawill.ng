'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateOrganization, submitKycDocument } from '@/lib/actions/organization';
import { Field, Input, Select } from '@/components/ui/input';
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

interface Organization {
  id: string;
  name: string;
  sector: string;
  headOffice: string;
  sizeRange: string;
}

export function OrganizationForm({ organization }: { organization: Organization }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(updateOrganization, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organization.id} />
      <Field label="Name">
        <Input name="name" required defaultValue={organization.name} />
      </Field>
      <Field label="Sector">
        <Input name="sector" defaultValue={organization.sector} />
      </Field>
      <Field label="Head office / address">
        <Input name="headOffice" defaultValue={organization.headOffice} />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Saved'} />}

      <div>
        <SubmitButton label="Save organization" pendingLabel="Saving…" />
      </div>
    </form>
  );
}

export function KycDocumentForm({ organizationId }: { organizationId: string }) {
  const [state, formAction] = useFormState<ActionResult, FormData>(submitKycDocument, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="organizationId" value={organizationId} />
      <Field label="Document type">
        <Select name="docType" required defaultValue="">
          <option value="" disabled>
            Select a document type
          </option>
          <option value="cac_certificate">CAC certificate</option>
          <option value="utility_bill">Utility bill</option>
          <option value="id_card">ID card</option>
          <option value="other">Other</option>
        </Select>
      </Field>
      <Field label="File reference" hint="No file upload in this build — paste a reference id/URL for the already-uploaded document (see docs/QA.md §7).">
        <Input name="fileId" required />
      </Field>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Submitted'} />}

      <div>
        <SubmitButton label="Submit document" pendingLabel="Submitting…" />
      </div>
    </form>
  );
}
