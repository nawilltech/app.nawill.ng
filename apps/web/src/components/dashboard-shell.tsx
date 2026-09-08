'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserMenu } from '@/components/user-menu';

export interface NavItem {
  href: string;
  label: string;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

export function DashboardShell({
  navGroups,
  user,
  children,
}: {
  navGroups: NavGroup[];
  user: { name: string; email: string; userType: string } | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const nav = (
    <nav className="flex flex-col gap-4">
      {navGroups.map((group, index) => (
        <div key={group.heading ?? `group-${index}`} className="flex flex-col gap-1">
          {group.heading && (
            <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">{group.heading}</p>
          )}
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-brand-50 hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col justify-between border-r border-neutral-200 bg-white px-4 py-6 transition-transform duration-200 ease-in-out md:static md:z-auto md:w-56 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <Link href="/dashboard" className="mb-6 block px-2">
            <Image src="/logo.png" alt="Nawill" width={120} height={30} className="h-7 w-auto" />
          </Link>
          {nav}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 sm:px-6 md:justify-end md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex h-9 w-9 items-center justify-center rounded-md text-neutral-700 hover:bg-neutral-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          {user && <UserMenu name={user.name} email={user.email} userType={user.userType} />}
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
