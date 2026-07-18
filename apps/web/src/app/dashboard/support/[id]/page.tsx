import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';
import { TicketReplyForm } from '@/components/ticket-reply-form';

interface TicketMessage {
  id: string;
  senderId: string;
  body: string;
  isInternalNote: boolean;
  createdAt: string;
}

interface SupportTicket {
  id: string;
  ticketNo: string;
  subject: string;
  ticketStatus: string;
  priority: string;
  messages: TicketMessage[];
}

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  let ticket: SupportTicket | null = null;
  let error: string | null = null;

  try {
    ticket = await apiFetch<SupportTicket>(`/support-tickets/${params.id}`);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/dashboard/support" className="text-sm text-neutral-500 hover:underline">
        ← Back to support
      </Link>

      {error && <ErrorAlert message={error} />}

      {ticket && (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{ticket.subject}</h1>
            <p className="mt-1 text-sm capitalize text-neutral-500">
              {ticket.ticketNo} · {ticket.ticketStatus.replace(/_/g, ' ')} · {ticket.priority} priority
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {ticket.messages
              .filter((m) => !m.isInternalNote)
              .map((message) => (
                <Card key={message.id}>
                  <p className="text-sm">{message.body}</p>
                  <p className="mt-2 text-xs text-neutral-400">{new Date(message.createdAt).toLocaleString()}</p>
                </Card>
              ))}
            {ticket.messages.length === 0 && <p className="text-sm text-neutral-500">No messages yet.</p>}
          </div>

          <TicketReplyForm ticketId={ticket.id} />
        </>
      )}
    </div>
  );
}
