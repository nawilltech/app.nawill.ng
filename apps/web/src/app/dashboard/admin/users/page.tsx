import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  userType: string;
  status: boolean;
}

export default async function AdminUsersPage() {
  let items: AdminUser[] = [];
  let error: string | null = null;

  try {
    ({ items } = await apiFetchPage<AdminUser>('/users?limit=50'));
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">Users</h1>

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No users yet.</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Email</th>
              <th className="pb-2 font-medium">Role</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((u) => (
              <tr key={u.id}>
                <td className="py-2">
                  <Link href={`/dashboard/admin/users/${u.id}`} className="font-medium text-brand hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="py-2 text-neutral-600">{u.email}</td>
                <td className="py-2 capitalize">{u.userType}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.status ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {u.status ? 'Active' : 'Inactive'}
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
