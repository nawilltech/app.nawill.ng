import Link from 'next/link';
import { Card } from '@/components/ui/card';

const SECTIONS = [
  { href: '/dashboard/admin/users', label: 'Users', description: 'View every account, change roles, activate or deactivate.' },
  { href: '/dashboard/admin/organizations', label: 'Organizations', description: 'Browse all client organizations and their KYC status.' },
  { href: '/dashboard/admin/health', label: 'System health', description: 'Live status of the API and its database connection.' },
  { href: '/dashboard/projects', label: 'Projects', description: 'Create, edit, and remove projects (staff/admin controls appear inline).' },
  { href: '/dashboard/invoices', label: 'Invoices', description: 'Create and update invoices (staff/admin controls appear inline).' },
  { href: '/dashboard/support', label: 'Support tickets', description: 'All tickets across every organization are visible here for staff/admin.' },
];

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Admin console</h1>
        <p className="mt-1 text-sm text-neutral-600">Super-admin tools for managing the whole platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="h-full transition-colors hover:border-brand hover:bg-brand-50">
              <p className="font-heading text-lg font-semibold text-brand">{section.label}</p>
              <p className="mt-1 text-sm text-neutral-600">{section.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
