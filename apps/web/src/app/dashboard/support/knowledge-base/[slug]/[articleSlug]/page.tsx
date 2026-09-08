import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ApiError } from '@/lib/types';
import { ErrorAlert } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface KbArticleDetail {
  title: string;
  body: string;
  category: { name: string; slug: string };
}

export default async function KnowledgeBaseArticlePage({ params }: { params: { slug: string; articleSlug: string } }) {
  let article: KbArticleDetail | null = null;
  let error: string | null = null;

  try {
    article = await apiFetch<KbArticleDetail>(`/knowledge-base/articles/${params.articleSlug}`);
  } catch (e) {
    error = e instanceof ApiError ? e.message : 'Could not reach the API';
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Link href={`/dashboard/support/knowledge-base/${params.slug}`} className="text-sm text-neutral-500 hover:underline">
        ← Back to {article?.category.name ?? 'category'}
      </Link>

      {error && <ErrorAlert message={error} />}

      {article && (
        <>
          <h1 className="font-heading text-2xl font-semibold text-neutral-900">{article.title}</h1>
          <Card>
            <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{article.body}</p>
          </Card>
        </>
      )}
    </div>
  );
}
