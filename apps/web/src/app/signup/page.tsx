'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Field, Input, Legend } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';

type ClientType = 'individual' | 'corporate';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [clientType, setClientType] = useState<ClientType>('individual');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field?: string; message: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);

    if (password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
          clientType,
          ...(clientType === 'corporate' ? { organizationName } : {}),
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? 'Signup failed');
        setFieldErrors(body.errors ?? []);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div>
        <Link href="/" className="mb-6 inline-block">
          <Image src="/logo.png" alt="Nawill" width={120} height={30} className="h-8 w-auto" />
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Already have one?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Email">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <Field
          label="Password"
          hint="At least 8 characters, with uppercase, lowercase, a number, and a special character."
        >
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        <Field label="Confirm password" hint={passwordMismatch ? 'Passwords do not match' : undefined}>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={passwordMismatch ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}
          />
        </Field>

        <fieldset className="flex flex-col gap-2 text-sm">
          <Legend>I am a</Legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={clientType === 'individual'}
              onChange={() => setClientType('individual')}
            />
            Founder / individual
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={clientType === 'corporate'} onChange={() => setClientType('corporate')} />
            Business / corporate
          </label>
        </fieldset>

        {clientType === 'corporate' && (
          <Field label="Organization name">
            <Input required value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
          </Field>
        )}

        {error && (
          <ErrorAlert
            message={
              fieldErrors.length > 0
                ? `${error}: ${fieldErrors.map((fe) => (fe.field ? `${fe.field} — ${fe.message}` : fe.message)).join('; ')}`
                : error
            }
          />
        )}

        <Button type="submit" disabled={submitting || passwordMismatch}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </main>
  );
}
