import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';

interface Organization {
  id: string;
  name: string;
  sector: string;
  sizeRange: string;
  kycStatus: string;
  headOffice: string;
}

const KYC_BADGE: Record<string, string> = {
  approved: 'bg-green-50 text-green-700',
  submitted: 'bg-brand-50 text-brand',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
};

export default async function AdminOrganizationsPage() {
  let items: Organization[] = [];
  let error: string | null = null;

  try {
    ({ items } = await apiFetchPage<Organization>('/organizations?limit=50'));
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">Organizations</h1>

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No organizations yet.</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Sector</th>
              <th className="pb-2 font-medium">Size</th>
              <th className="pb-2 font-medium">Head office</th>
              <th className="pb-2 font-medium">KYC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((org) => (
              <tr key={org.id}>
                <td className="py-2 font-medium text-neutral-900">{org.name}</td>
                <td className="py-2 capitalize">{org.sector}</td>
                <td className="py-2 uppercase">{org.sizeRange.replace('s', '')}</td>
                <td className="py-2">{org.headOffice || '—'}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${KYC_BADGE[org.kycStatus] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {org.kycStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
