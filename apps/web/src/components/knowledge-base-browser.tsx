'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { KbIcon } from '@/components/kb-icon';
import type { KbCategory } from '@/lib/knowledge-base-types';

export function KnowledgeBaseBrowser({ categories }: { categories: KbCategory[] }) {
  const [query, setQuery] = useState('');

  const filtered = categories.filter((c) => {
    const haystack = `${c.name} ${c.description ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search articles…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-md"
      />

      {filtered.length === 0 && <p className="text-sm text-neutral-500">No categories match your search.</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((category) => (
          <Link key={category.id} href={`/dashboard/support/knowledge-base/${category.slug}`}>
            <Card className="flex h-full gap-3 transition-colors hover:border-brand hover:bg-brand-50">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-brand-100 text-brand">
                <KbIcon name={category.icon} className="h-5 w-5" />
              </div>
              <div>
                <p className="font-heading font-semibold text-neutral-900">{category.name}</p>
                {category.description && <p className="mt-0.5 text-sm text-neutral-600">{category.description}</p>}
                <span className="mt-2 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand">
                  {category.articleCount} {category.articleCount === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
