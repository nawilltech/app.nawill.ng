import Link from 'next/link';
import { apiFetchPage } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';

interface Project {
  id: string;
  name: string;
  phase: string;
  dueDate: string | null;
}

export default async function ProjectsPage() {
  let items: Project[] = [];
  let error: string | null = null;

  try {
    ({ items } = await apiFetchPage<Project>('/projects?limit=20'));
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Projects</h1>

      {error && <ErrorAlert message={error} />}

      {!error && items.length === 0 && <p className="text-sm text-neutral-500">No projects yet.</p>}

      {items.length > 0 && (
        <table className="w-full text-left text-sm">
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
      )}
    </div>
  );
}
