'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initialsOf } from '@/lib/initials';

const USER_TYPE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  staff: 'Staff',
  client: 'Client',
};

export function UserMenu({ name, email, userType }: { name: string; email: string; userType: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition-transform hover:scale-105"
      >
        {initialsOf(name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="truncate text-sm font-medium text-neutral-900">{name}</p>
            <p className="truncate text-xs text-neutral-500">{email}</p>
            <p className="mt-1 text-xs font-medium text-brand">{USER_TYPE_LABEL[userType] ?? userType}</p>
          </div>
          <Link
            href="/dashboard/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand"
          >
            Settings
          </Link>
          {userType === 'admin' && (
            <Link
              href="/dashboard/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand"
            >
              Admin console
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
