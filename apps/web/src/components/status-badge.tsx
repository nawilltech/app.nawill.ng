const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  partially_paid: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-700',
  cancelled: 'bg-neutral-100 text-neutral-500',
  draft: 'bg-neutral-100 text-neutral-500',
};

export function InvoiceStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${INVOICE_STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const TICKET_STATUS_STYLES: Record<string, string> = {
  open: 'bg-brand-50 text-brand',
  in_progress: 'bg-amber-50 text-amber-700',
  awaiting_customer: 'bg-amber-50 text-amber-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-neutral-100 text-neutral-500',
};

export function TicketStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TICKET_STATUS_STYLES[status] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const TICKET_PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-neutral-100 text-neutral-500',
  medium: 'bg-amber-50 text-amber-700',
  high: 'bg-orange-50 text-orange-700',
  urgent: 'bg-red-50 text-red-700',
};

export function TicketPriorityBadge({ priority }: { priority: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TICKET_PRIORITY_STYLES[priority] ?? 'bg-neutral-100 text-neutral-600'}`}>
      {priority}
    </span>
  );
}
