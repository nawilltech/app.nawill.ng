import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/session';
import { getCurrentUser } from '@/lib/current-user';
import { DashboardShell, NavGroup } from '@/components/dashboard-shell';
import { EmailVerificationBanner } from '@/components/email-verification-banner';

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
    <DashboardShell navGroups={navGroups} user={user}>
      {user && !user.emailVerifiedAt && (
        <div className="mb-6">
          <EmailVerificationBanner />
        </div>
      )}
      {children}
    </DashboardShell>
  );
}
