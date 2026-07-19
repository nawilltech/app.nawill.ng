import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { getCurrentUser } from '@/lib/current-user';
import { UserMenu } from '@/components/user-menu';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  heading?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/dashboard', label: 'Overview' },
      { href: '/dashboard/projects', label: 'Projects' },
      { href: '/dashboard/organization', label: 'Organization' },
    ],
  },
  {
    heading: 'Billing',
    items: [
      { href: '/dashboard/wallet', label: 'Add Funds' },
      { href: '/dashboard/invoices', label: 'Invoices' },
    ],
  },
  {
    heading: 'Support',
    items: [
      { href: '/dashboard/support', label: 'Tickets' },
      { href: '/dashboard/support/knowledge-base', label: 'Knowledge Base' },
    ],
  },
  {
    items: [{ href: '/dashboard/settings', label: 'Settings' }],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Presence-only check — the actual JWT is validated by the API on every request.
  // A page whose token has expired mid-session will get a failed fetch, not a
  // client-side redirect; see docs/ARCHITECTURE.md §10 for what's deferred here.
  if (!isAuthenticated()) {
    redirect('/login');
  }

  const user = await getCurrentUser();
  const navGroups: NavGroup[] =
    user?.userType === 'admin'
      ? [...NAV_GROUPS, { heading: 'Admin', items: [{ href: '/dashboard/admin', label: 'Console' }] }]
      : NAV_GROUPS;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col justify-between border-r border-neutral-200 bg-white px-4 py-6">
        <div>
          <Link href="/dashboard" className="mb-6 block px-2">
            <Image src="/logo.png" alt="Nawill" width={120} height={30} className="h-7 w-auto" />
          </Link>
          <nav className="flex flex-col gap-4">
            {navGroups.map((group, index) => (
              <div key={group.heading ?? `group-${index}`} className="flex flex-col gap-1">
                {group.heading && (
                  <p className="px-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    {group.heading}
                  </p>
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
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-neutral-200 bg-white px-8">
          {user && <UserMenu name={user.name} email={user.email} userType={user.userType} />}
        </header>
        <main className="flex-1 px-8 py-6">
          {user && !user.emailVerifiedAt && (
            <div className="mb-6">
              <EmailVerificationBanner />
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
