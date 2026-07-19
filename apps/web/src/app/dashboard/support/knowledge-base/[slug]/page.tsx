import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { KbIcon } from '@/components/kb-icon';

interface KbArticle {
  id: string;
  title: string;
  slug: string;
}

interface KbCategoryDetail {
  name: string;
  description: string | null;
  icon: string | null;
  articles: KbArticle[];
}

export default async function KnowledgeBaseCategoryPage({ params }: { params: { slug: string } }) {
  let category: KbCategoryDetail | null = null;
  let error: string | null = null;

  try {
    category = await apiFetch<KbCategoryDetail>(`/knowledge-base/categories/${params.slug}`);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href="/dashboard/support/knowledge-base" className="text-sm text-neutral-500 hover:underline">
        ← Back to Knowledge Base
      </Link>

      {error && <ErrorAlert message={error} />}

      {category && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-100 text-brand">
              <KbIcon name={category.icon} className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-semibold text-neutral-900">{category.name}</h1>
              {category.description && <p className="text-sm text-neutral-600">{category.description}</p>}
            </div>
          </div>

          {category.articles.length === 0 && <p className="text-sm text-neutral-500">No articles in this category yet.</p>}

          <div className="flex flex-col gap-2">
            {category.articles.map((article) => (
              <Link key={article.id} href={`/dashboard/support/knowledge-base/${params.slug}/${article.slug}`}>
                <Card className="transition-colors hover:border-brand hover:bg-brand-50">
                  <p className="font-medium text-neutral-900">{article.title}</p>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
