import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/alert';

interface Project {
  id: string;
  name: string;
  description: string | null;
  phase: string;
  engagementModel: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : '—';
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  let project: Project | null = null;
  let error: string | null = null;

  try {
    project = await apiFetch<Project>(`/projects/${params.id}`);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/dashboard/projects" className="text-sm text-neutral-500 hover:underline">
        ← Back to projects
      </Link>

      {error && <ErrorAlert message={error} />}

      {project && (
        <>
          <div>
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-sm capitalize text-neutral-500">{project.phase.replace(/_/g, ' ')}</p>
          </div>

          {project.description && <p className="text-sm text-neutral-700">{project.description}</p>}

          <Card>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-neutral-500">Engagement model</dt>
                <dd className="capitalize">{project.engagementModel.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Start date</dt>
                <dd>{formatDate(project.startDate)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Due date</dt>
                <dd>{formatDate(project.dueDate)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Completed</dt>
                <dd>{formatDate(project.completedAt)}</dd>
              </div>
            </dl>
          </Card>

          <p className="text-xs text-neutral-500">
            Milestones, change history, and status requests exist in the API design but aren&apos;t built yet — see
            docs/QA.md §7.
          </p>
        </>
      )}
    </div>
  );
}
