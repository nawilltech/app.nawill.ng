import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/current-user';
import { NewInvoiceForm } from '@/components/admin/new-invoice-form';
import { InvoiceStatusBadge } from '@/components/status-badge';

interface Invoice {
  id: string;
  invoiceNo: string;
  currency: string;
  totalMinor: string;
  invoiceStatus: string;
  dueDate: string;
}

interface Organization {
  id: string;
  name: string;
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  const canManage = user?.userType === 'staff' || user?.userType === 'admin';

  let items: Invoice[] = [];
  let error: string | null = null;
  let organizations: Organization[] = [];

  try {
    ({ items } = await apiFetchPage<Invoice>('/invoices?limit=20'));
    if (canManage) {
      ({ items: organizations } = await apiFetchPage<Organization>('/organizations?limit=100'));
    }
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">Invoices</h1>

      {canManage && (
        <Card>
          <p className="mb-4 font-heading text-lg font-semibold text-neutral-900">New invoice</p>
          <NewInvoiceForm organizations={organizations.map((o) => ({ id: o.id, label: o.name }))} />
        </Card>
      )}

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No invoices yet.</p>}

      {items.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Invoice #</th>
              <th className="pb-2 font-medium">Amount</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((invoice) => (
              <tr key={invoice.id}>
                <td className="py-2">
                  <Link href={`/dashboard/invoices/${invoice.id}`} className="text-brand hover:underline">
                    {invoice.invoiceNo}
                  </Link>
                </td>
                <td className="py-2">{formatMinor(invoice.totalMinor, invoice.currency)}</td>
                <td className="py-2">
                  <InvoiceStatusBadge status={invoice.invoiceStatus} />
                </td>
                <td className="py-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
