import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { KnowledgeBaseBrowser } from '@/components/knowledge-base-browser';
import type { KbCategory } from '@/lib/knowledge-base-types';

export default async function KnowledgeBasePage() {
  let categories: KbCategory[] = [];
  let error: string | null = null;

  try {
    categories = await apiFetch<KbCategory[]>('/knowledge-base/categories');
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-neutral-900">Knowledge Base</h1>
        <p className="mt-1 text-sm text-neutral-600">Find answers to frequently asked questions</p>
      </div>

      {error && <ErrorAlert message={error} />}

      {!error && <KnowledgeBaseBrowser categories={categories} />}
    </div>
  );
}
