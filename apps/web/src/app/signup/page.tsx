'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ClientType = 'individual' | 'corporate';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clientType, setClientType] = useState<ClientType>('individual');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ field?: string; message: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
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
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Already have one?{' '}
          <Link href="/login" className="text-brand hover:underline">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-2"
          />
          <span className="text-xs text-neutral-500">
            At least 8 characters, with uppercase, lowercase, a number, and a special character.
          </span>
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">I am a</legend>
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
          <label className="flex flex-col gap-1 text-sm">
            Organization name
            <input
              required
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2"
            />
          </label>
        )}

        {error && (
          <div className="text-sm text-red-600">
            <p>{error}</p>
            {fieldErrors.length > 0 && (
              <ul className="mt-1 list-inside list-disc">
                {fieldErrors.map((fe, i) => (
                  <li key={i}>
                    {fe.field ? `${fe.field}: ` : ''}
                    {fe.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </main>
  );
}
