import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { LogoutButton } from '@/components/logout-button';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/invoices', label: 'Invoices' },
  { href: '/dashboard/wallet', label: 'Wallet' },
  { href: '/dashboard/support', label: 'Support' },
  { href: '/dashboard/organization', label: 'Organization' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Presence-only check — the actual JWT is validated by the API on every request.
  // A page whose token has expired mid-session will get a failed fetch, not a
  // client-side redirect; see docs/ARCHITECTURE.md §10 for what's deferred here.
  if (!isAuthenticated()) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col justify-between border-r border-neutral-200 bg-white px-4 py-6">
        <div>
          <p className="mb-6 px-2 text-sm font-semibold">Nawill</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <LogoutButton />
      </aside>
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
