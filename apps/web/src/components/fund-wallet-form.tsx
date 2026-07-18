'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { fundWallet } from '@/lib/actions/wallet';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Starting…' : 'Fund wallet'}
    </Button>
  );
}

export function FundWalletForm() {
  const [state, formAction] = useFormState<ActionResult, FormData>(fundWallet, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <Field label="Amount (NGN)">
          <Input name="amount" type="number" min="1" step="0.01" required className="w-40" />
        </Field>
        <SubmitButton />
      </div>

      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && (
        <div className="flex flex-col gap-1">
          <SuccessAlert message={state.message ?? 'Funding initiated'} />
          {typeof state.data?.paymentLink === 'string' && (
            <a href={state.data.paymentLink} target="_blank" rel="noreferrer" className="text-sm text-brand hover:underline">
              Complete payment →
            </a>
          )}
        </div>
      )}
    </form>
  );
}
