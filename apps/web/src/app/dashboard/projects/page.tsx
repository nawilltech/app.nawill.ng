import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/current-user';
import { NewProjectForm } from '@/components/admin/new-project-form';

interface Project {
  id: string;
  name: string;
  phase: string;
  dueDate: string | null;
}

interface Organization {
  id: string;
  name: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const canManage = user?.userType === 'staff' || user?.userType === 'admin';

  let items: Project[] = [];
  let error: string | null = null;
  let organizations: Organization[] = [];
  let owners: UserOption[] = [];

  try {
    ({ items } = await apiFetchPage<Project>('/projects?limit=20'));
    if (canManage) {
      const [orgsPage, usersPage] = await Promise.all([
        apiFetchPage<Organization>('/organizations?limit=100'),
        apiFetchPage<UserOption>('/users?limit=100'),
      ]);
      organizations = orgsPage.items;
      owners = usersPage.items;
    }
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold text-neutral-900">Projects</h1>

      {canManage && (
        <Card>
          <p className="mb-4 font-heading text-lg font-semibold text-neutral-900">New project</p>
          <NewProjectForm
            organizations={organizations.map((o) => ({ id: o.id, label: o.name }))}
            owners={owners.map((u) => ({ id: u.id, label: `${u.name} (${u.email})` }))}
          />
        </Card>
      )}

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No projects yet.</p>}

      {items.length > 0 && (
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-neutral-500">
            <tr>
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Phase</th>
              <th className="pb-2 font-medium">Due</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((project) => (
              <tr key={project.id}>
                <td className="py-2">
                  <Link href={`/dashboard/projects/${project.id}`} className="text-brand hover:underline">
                    {project.name}
                  </Link>
                </td>
                <td className="py-2 capitalize">{project.phase.replace(/_/g, ' ')}</td>
                <td className="py-2">{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
