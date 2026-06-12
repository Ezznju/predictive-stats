import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getCategoryBySlug, getArticlesByCategory, getAuthors, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await getCategoryBySlug(params.slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: cat.name,
    description: cat.description,
    openGraph: { title: `${cat.name} | Predictions Market Fans`, description: cat.description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) notFound();

  const [categoryArticles, authors, categories] = await Promise.all([
    getArticlesByCategory(category.slug),
    getAuthors(),
    getCategories(),
  ]);

  const authorMap = new Map(authors.map(a => [a.id, a]));
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/articles" className="hover:text-ink transition-colors">Articles</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink-secondary">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
          <h1 className="font-display font-bold text-4xl text-ink">{category.name}</h1>
        </div>
        <p className="text-ink-secondary max-w-2xl">{category.description}</p>
        <p className="text-sm text-ink-muted mt-2">{categoryArticles.length} article{categoryArticles.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Articles */}
      {categoryArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryArticles.map((article) => (
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
          <p className="text-ink-secondary text-lg">No articles in this category yet.</p>
          <Link href="/articles" className="text-black hover:text-black/80 mt-2 inline-block">Browse all articles →</Link>
        </div>
      )}
    </div>
  );
}
