'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SuccessAlert, ErrorAlert, InfoAlert } from '@/components/ui/alert';

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>(token ? 'pending' : 'error');
  const [message, setMessage] = useState<string | null>(token ? null : 'Missing verification token.');

  useEffect(() => {
    if (!token) return;
    (async () => {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      setStatus(res.ok && body.success ? 'success' : 'error');
      setMessage(body.message ?? (res.ok ? 'Email verified successfully' : 'Verification failed'));
    })();
  }, [token]);

  if (status === 'pending') return <InfoAlert message="Verifying your email…" />;
  if (status === 'success') return <SuccessAlert message={message ?? 'Email verified successfully'} />;
  return <ErrorAlert message={message ?? 'This verification link is invalid or has expired.'} />;
}

export default function VerifyEmailPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <Image src="/logo.png" alt="Nawill" width={120} height={30} className="h-8 w-auto" />
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">Email verification</h1>
      <div className="w-full">
        <Suspense>
          <VerifyEmailStatus />
        </Suspense>
      </div>
      <Link href="/dashboard" className="text-sm text-brand hover:underline">
        Go to dashboard
      </Link>
    </main>
  );
}
