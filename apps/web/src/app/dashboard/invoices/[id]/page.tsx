import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert, InfoAlert } from '@/components/ui/alert';
import { InvoicePayActions } from '@/components/invoice-pay-actions';
import { InvoiceDownloadButton } from '@/components/invoice-download-button';
import { InvoiceStatusBadge } from '@/components/status-badge';
import { getCurrentUser } from '@/lib/current-user';
import { EditInvoiceForm } from '@/components/admin/edit-invoice-form';

interface InvoiceItem {
  id: string;
  itemName: string;
  period: string | null;
  quantity: number;
  unitAmountMinor: string;
  actualAmountMinor: string;
  isCancelled: boolean;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  currency: string;
  subtotalMinor: string;
  discountMinor: string;
  vatEnabled: boolean;
  vatRate: number | null;
  taxMinor: string;
  totalMinor: string;
  invoiceStatus: string;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  organization: { name: string; headOffice: string } | null;
  items: InvoiceItem[];
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  const canManage = user?.userType === 'staff' || user?.userType === 'admin';

  let invoice: Invoice | null = null;
  let error: string | null = null;

  try {
    invoice = await apiFetch<Invoice>(`/invoices/${params.id}`);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/dashboard/invoices" className="text-sm text-neutral-500 hover:underline">
        ← Back to invoices
      </Link>

      {error && <ErrorAlert message={error} />}

      {invoice && (
        <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{invoice.invoiceNo}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                <InvoiceStatusBadge status={invoice.invoiceStatus} />
                <span>Due {new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <InvoiceDownloadButton invoice={invoice} />
          </div>

          <Card>
            <table className="w-full text-left text-sm">
              <thead className="text-neutral-500">
                <tr>
                  <th className="pb-2 font-medium">Item</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      {item.itemName}
                      {item.isCancelled && <span className="ml-2 text-xs text-neutral-400">(cancelled)</span>}
                    </td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{formatMinor(item.actualAmountMinor, invoice!.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex flex-col items-end gap-1 text-sm">
              <p>
                Subtotal: <span className="font-medium">{formatMinor(invoice.subtotalMinor, invoice.currency)}</span>
              </p>
              {Number(invoice.discountMinor) > 0 && (
                <p>
                  Discount:{' '}
                  <span className="font-medium">−{formatMinor(invoice.discountMinor, invoice.currency)}</span>
                </p>
              )}
              {invoice.vatEnabled && (
                <p>
                  VAT ({invoice.vatRate ?? 0}%): <span className="font-medium">{formatMinor(invoice.taxMinor, invoice.currency)}</span>
                </p>
              )}
              <p className="text-base">
                Total: <span className="font-semibold">{formatMinor(invoice.totalMinor, invoice.currency)}</span>
              </p>
            </div>
          </Card>

          {invoice.invoiceStatus === 'paid' ? (
            <InfoAlert message={`Paid on ${invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '—'}`} />
          ) : (
            <InvoicePayActions invoiceId={invoice.id} />
          )}

          {canManage && (
            <Card>
              <p className="mb-4 font-heading text-lg font-semibold text-neutral-900">Manage invoice</p>
              <EditInvoiceForm
                invoiceId={invoice.id}
                dueDate={invoice.dueDate}
                invoiceStatus={invoice.invoiceStatus}
                notes={invoice.notes}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
