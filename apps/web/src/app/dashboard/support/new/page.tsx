import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { NewTicketForm } from '@/components/new-ticket-form';

interface TicketType {
  id: string;
  name: string;
}

export default async function NewTicketPage() {
  let ticketTypes: TicketType[] = [];
  let error: string | null = null;

  try {
    ticketTypes = await apiFetch<TicketType[]>('/ticket-types');
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <Link href="/dashboard/support" className="text-sm text-neutral-500 hover:underline">
        ← Back to support
      </Link>
      <h1 className="text-2xl font-semibold">New support ticket</h1>

      {error && <ErrorAlert message={error} />}
      {!error && <NewTicketForm ticketTypes={ticketTypes} />}
    </div>
  );
}
