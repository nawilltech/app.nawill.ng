import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  ticketStatus: string;
  priority: string;
}

export default async function SupportPage() {
  let items: SupportTicket[] = [];
  let error: string | null = null;

  try {
    ({ items } = await apiFetchPage<SupportTicket>('/support-tickets?limit=20'));
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Support</h1>
        <Link href="/dashboard/support/new">
          <Button>New ticket</Button>
        </Link>
      </div>

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No support tickets yet.</p>}

      {items.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Ticket</th>
              <th className="pb-2 font-medium">Subject</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((ticket) => (
              <tr key={ticket.id}>
                <td className="py-2">
                  <Link href={`/dashboard/support/${ticket.id}`} className="text-brand hover:underline">
                    {ticket.ticketNo}
                  </Link>
                </td>
                <td className="py-2">{ticket.subject}</td>
                <td className="py-2 capitalize">{ticket.ticketStatus.replace(/_/g, ' ')}</td>
                <td className="py-2 capitalize">{ticket.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
