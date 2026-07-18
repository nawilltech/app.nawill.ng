import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';

interface Invoice {
  id: string;
  invoiceNo: string;
  currency: string;
  totalMinor: string;
  invoiceStatus: string;
  dueDate: string;
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function InvoicesPage() {
  let items: Invoice[] = [];
  let error: string | null = null;

  try {
    ({ items } = await apiFetchPage<Invoice>('/invoices?limit=20'));
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Invoices</h1>

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
                <td className="py-2 capitalize">{invoice.invoiceStatus.replace(/_/g, ' ')}</td>
                <td className="py-2">{new Date(invoice.dueDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
