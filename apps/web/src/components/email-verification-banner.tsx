'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { resendVerification } from '@/lib/actions/profile';
import { ActionResult } from '@/lib/action-result';

function ResendButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="font-medium text-amber-900 underline hover:no-underline disabled:opacity-50">
      {pending ? 'Sending…' : 'Resend verification email'}
    </button>
  );
}

export function EmailVerificationBanner() {
  const [state, formAction] = useFormState<ActionResult, FormData>(resendVerification, {});

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <span>Please verify your email address to unlock full access to your account.</span>
      {state.ok ? (
        <span className="font-medium text-amber-900">{state.message}</span>
      ) : (
        <form action={formAction}>
          <ResendButton />
        </form>
      )}
    </div>
  );
}
