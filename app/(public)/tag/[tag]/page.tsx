import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Tag } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getPublishedArticles, getAuthors, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: { tag: string };
}

function decodeTag(raw: string): string {
  return decodeURIComponent(raw).toLowerCase();
}

function displayTag(raw: string): string {
  const decoded = decodeTag(raw);
  return decoded
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = displayTag(params.tag);
  return {
    title: `${tag} Articles`,
    description: `All articles tagged "${tag}" on Predictions Market Fans — analysis, guides, and data-driven commentary.`,
    alternates: { canonical: `/tag/${encodeURIComponent(decodeTag(params.tag))}` },
  };
}

export default async function TagPage({ params }: Props) {
  const tag = decodeTag(params.tag);
  const display = displayTag(params.tag);

  const [allArticles, authors, categories] = await Promise.all([
    getPublishedArticles(),
    getAuthors(),
    getCategories(),
  ]);

  const tagArticles = allArticles.filter((a) =>
    (a.tags ?? []).some((t) => t.toLowerCase() === tag)
  );

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/articles" className="hover:text-ink transition-colors">Articles</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink-secondary">#{display}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <Tag className="w-5 h-5 text-ink-secondary" />
          <h1 className="font-display font-bold text-4xl text-ink">#{display}</h1>
        </div>
        <p className="text-ink-secondary">
          {tagArticles.length} article{tagArticles.length !== 1 ? 's' : ''} tagged &ldquo;{display}&rdquo;
        </p>
      </div>

      {/* Articles */}
      {tagArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tagArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              author={authorMap.get(article.authorId)}
              category={categoryMap.get(article.categorySlug)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-lg">No articles with this tag yet.</p>
          <Link href="/articles" className="text-black hover:text-black/80 mt-2 inline-block">
            Browse all articles →
          </Link>
        </div>
      )}
    </div>
  );
}
