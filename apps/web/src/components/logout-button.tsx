'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function onClick() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button onClick={onClick} className="text-sm text-neutral-600 hover:text-neutral-900">
      Log out
    </button>
  );
}
