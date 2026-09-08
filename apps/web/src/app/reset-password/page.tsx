'use client';

import { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SuccessAlert, ErrorAlert } from '@/components/ui/alert';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? 'Something went wrong');
        return;
      }
      setMessage(body.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Reset token" hint="Paste the token from the password reset email.">
        <Input required value={token} onChange={(e) => setToken(e.target.value)} />
      </Field>
      <Field label="New password" hint="At least 8 characters, with uppercase, lowercase, a number, and a special character.">
        <Input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      </Field>

      {message && <SuccessAlert message={message} />}
      {error && <ErrorAlert message={error} />}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Resetting…' : 'Reset password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-1 text-sm text-neutral-600">
          <Link href="/login" className="text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </div>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
