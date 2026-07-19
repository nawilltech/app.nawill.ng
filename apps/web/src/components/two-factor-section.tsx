'use client';

import { useState, useTransition } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  setupTotp,
  confirmTotp,
  requestEmailTwoFactorCode,
  enableEmailTwoFactor,
  disableTwoFactor,
} from '@/lib/actions/two-factor';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Verifying…' : children}
    </Button>
  );
}

function TotpSetup() {
  const [setup, setSetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [starting, startTransition] = useTransition();
  const [startError, setStartError] = useState<string | null>(null);
  const [state, formAction] = useFormState<ActionResult, FormData>(confirmTotp, {});

  function start() {
    setStartError(null);
    startTransition(async () => {
      const result = await setupTotp();
      if (result.error) {
        setStartError(result.error);
        return;
      }
      setSetup(result.data as { secret: string; qrCodeDataUrl: string });
    });
  }

  if (state.ok) {
    return <SuccessAlert message={state.message ?? 'Authenticator app enabled'} />;
  }

  if (!setup) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={start} disabled={starting}>
          {starting ? 'Starting…' : 'Set up authenticator app'}
        </Button>
        {startError && <ErrorAlert message={startError} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={setup.qrCodeDataUrl} alt="TOTP QR code" className="h-40 w-40" />
      <p className="text-xs text-neutral-500">
        Can&apos;t scan? Enter this secret manually: <code className="font-mono">{setup.secret}</code>
      </p>
      <form action={formAction} className="flex items-end gap-3">
        <Field label="6-digit code">
          <Input name="code" required inputMode="numeric" maxLength={6} className="w-32" />
        </Field>
        <SubmitButton>Confirm</SubmitButton>
      </form>
      {state.error && <ErrorAlert message={state.error} />}
    </div>
  );
}

function EmailTwoFactorSetup() {
  const [requested, setRequested] = useState(false);
  const [requesting, startTransition] = useTransition();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [state, formAction] = useFormState<ActionResult, FormData>(enableEmailTwoFactor, {});

  function request() {
    setRequestError(null);
    startTransition(async () => {
      const result = await requestEmailTwoFactorCode();
      if (result.error) {
        setRequestError(result.error);
        return;
      }
      setRequested(true);
    });
  }

  if (state.ok) {
    return <SuccessAlert message={state.message ?? 'Email two-factor authentication enabled'} />;
  }

  if (!requested) {
    return (
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={request} disabled={requesting}>
          {requesting ? 'Sending…' : 'Set up email codes'}
        </Button>
        {requestError && <ErrorAlert message={requestError} />}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-end gap-3">
      <Field label="Code from your email">
        <Input name="code" required inputMode="numeric" maxLength={6} className="w-32" />
      </Field>
      <SubmitButton>Confirm</SubmitButton>
      {state.error && <ErrorAlert message={state.error} />}
    </form>
  );
}

function DisableTwoFactor() {
  const [state, formAction] = useFormState<ActionResult, FormData>(disableTwoFactor, {});
  return (
    <form action={formAction} className="flex items-end gap-3">
      <div className="w-56">
        <Field label="Confirm password to disable">
          <Input name="password" type="password" required />
        </Field>
      </div>
      <SubmitButton>Disable 2FA</SubmitButton>
      {state.error && <ErrorAlert message={state.error} />}
      {state.ok && <SuccessAlert message={state.message ?? 'Disabled'} />}
    </form>
  );
}

export function TwoFactorSection({ currentMethod }: { currentMethod: 'none' | 'email' | 'totp' }) {
  if (currentMethod !== 'none') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-neutral-700">
          Two-factor authentication is enabled via <span className="font-medium">{currentMethod}</span>.
        </p>
        <DisableTwoFactor />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Authenticator app (TOTP)</p>
        <TotpSetup />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-neutral-700">Email codes</p>
        <EmailTwoFactorSetup />
      </div>
    </div>
  );
}
