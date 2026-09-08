'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Field, Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/alert';

type Stage = { name: 'credentials' } | { name: 'two-factor'; method: 'email' | 'totp'; challengeToken: string };

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>({ name: 'credentials' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmitCredentials(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? 'Login failed');
        return;
      }
      if (body.requiresTwoFactor) {
        setStage({ name: 'two-factor', method: body.method, challengeToken: body.challengeToken });
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function onSubmitCode(e: FormEvent) {
    e.preventDefault();
    if (stage.name !== 'two-factor') return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeToken: stage.challengeToken, code }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? 'Invalid code');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <Link href="/" className="mb-6 inline-block">
          <Image src="/logo.png" alt="Nawill" width={120} height={30} className="h-8 w-auto" />
        </Link>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Log in</h1>
        <p className="mt-1 text-sm text-neutral-600">
          No account?{' '}
          <Link href="/signup" className="text-brand hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {stage.name === 'credentials' && (
        <form onSubmit={onSubmitCredentials} className="flex flex-col gap-4">
          <Field label="Email">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>

          {error && <ErrorAlert message={error} />}

          <div className="flex items-center justify-between">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
            <Link href="/forgot-password" className="text-sm text-neutral-600 hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      )}

      {stage.name === 'two-factor' && (
        <form onSubmit={onSubmitCode} className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600">
            {stage.method === 'totp'
              ? 'Enter the 6-digit code from your authenticator app.'
              : 'Enter the 6-digit code sent to your email.'}
          </p>
          <Field label="Code">
            <Input
              required
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </Field>

          {error && <ErrorAlert message={error} />}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify'}
          </Button>
        </form>
      )}
    </main>
  );
}
