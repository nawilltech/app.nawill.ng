'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { InvoicePdfData } from '@/lib/pdf/invoice-document';

export function InvoiceDownloadButton({ invoice }: { invoice: InvoicePdfData }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const [{ pdf }, { InvoiceDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/lib/pdf/invoice-document'),
      ]);
      const blob = await pdf(<InvoiceDocument invoice={invoice} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoice.invoiceNo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant="secondary" onClick={onClick} disabled={busy}>
      {busy ? 'Preparing PDF…' : invoice.invoiceStatus === 'paid' ? 'Download receipt (PDF)' : 'Download invoice (PDF)'}
    </Button>
  );
}
