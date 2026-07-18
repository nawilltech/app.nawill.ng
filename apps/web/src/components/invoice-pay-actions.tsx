'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { payInvoiceWithWallet } from '@/lib/actions/wallet';
import { payInvoiceWithProcessor } from '@/lib/actions/invoices';
import { Button } from '@/components/ui/button';
import { ErrorAlert, SuccessAlert } from '@/components/ui/alert';
import { ActionResult } from '@/lib/action-result';

const INITIAL: ActionResult = {};

function SubmitButton({ children, variant }: { children: React.ReactNode; variant?: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? 'Processing…' : children}
    </Button>
  );
}

export function InvoicePayActions({ invoiceId }: { invoiceId: string }) {
  const [walletState, walletAction] = useFormState(payInvoiceWithWallet, INITIAL);
  const [processorState, processorAction] = useFormState(payInvoiceWithProcessor, INITIAL);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <form action={walletAction}>
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <SubmitButton>Pay from wallet</SubmitButton>
        </form>
        <form action={processorAction}>
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <SubmitButton variant="secondary">Pay with card / bank transfer</SubmitButton>
        </form>
      </div>

      {walletState.error && <ErrorAlert message={walletState.error} />}
      {walletState.ok && <SuccessAlert message={walletState.message ?? 'Paid'} />}

      {processorState.error && <ErrorAlert message={processorState.error} />}
      {processorState.ok && (
        <div className="flex flex-col gap-2">
          <SuccessAlert message={processorState.message ?? 'Payment initiated'} />
          {typeof processorState.data?.paymentLink === 'string' && (
            <a
              href={processorState.data.paymentLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-brand hover:underline"
            >
              Complete payment →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
