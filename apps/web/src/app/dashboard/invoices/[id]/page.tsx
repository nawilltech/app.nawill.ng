import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert, InfoAlert } from '@/components/ui/alert';
import { InvoicePayActions } from '@/components/invoice-pay-actions';

interface InvoiceItem {
  id: string;
  itemName: string;
  quantity: number;
  unitAmountMinor: string;
  actualAmountMinor: string;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  currency: string;
  subtotalMinor: string;
  taxMinor: string;
  totalMinor: string;
  invoiceStatus: string;
  dueDate: string;
  paidAt: string | null;
  items: InvoiceItem[];
}

function formatMinor(minor: string, currency: string): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(minor) / 100);
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
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
          <div>
            <h1 className="text-2xl font-semibold">{invoice.invoiceNo}</h1>
            <p className="mt-1 text-sm capitalize text-neutral-500">
              {invoice.invoiceStatus.replace(/_/g, ' ')} · Due {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
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
                    <td className="py-2">{item.itemName}</td>
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
              <p>
                Tax: <span className="font-medium">{formatMinor(invoice.taxMinor, invoice.currency)}</span>
              </p>
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
        </>
      )}
    </div>
  );
}
