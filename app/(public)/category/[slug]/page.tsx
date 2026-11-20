import { Metadata } from 'next';
import { ldJson } from '@/lib/json-ld';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getCategoryBySlug, getArticlesByCategory, getAuthors, getCategories } from '@/lib/db';
import { cachedByKey, slimArticles } from '@/lib/isolate-cache';
import { DEFAULT_OG_IMAGE, SITE_URL, stripHtml } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

const getCachedCategoryPage = cachedByKey(
  'category-page',
  10 * 60 * 1000,
  async (slug: string) => {
    const category = await getCategoryBySlug(slug);
    if (!category) return null;
    const [categoryArticles, authors, categories] = await Promise.all([
      getArticlesByCategory(category.slug),
      getAuthors(),
      getCategories(),
    ]);
    return { category, categoryArticles: slimArticles(categoryArticles), authors, categories };
  }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCachedCategoryPage(params.slug);
  const cat = data?.category;
  if (!cat) return { title: 'Category Not Found' };
  const desc = cat.description || `Prediction market articles and analysis in ${cat.name}.`;
  return {
    title: cat.name,
    description: desc,
    alternates: { canonical: `${SITE_URL}/category/${cat.slug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/category/${cat.slug}`,
      title: `${cat.name} | Predictions Market Fans`,
      description: desc,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cat.name} | Predictions Market Fans`,
      description: desc,
      images: ['/twitter-image'],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const data = await getCachedCategoryPage(params.slug);
  if (!data) notFound();

  const { category, categoryArticles, authors, categories } = data;

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — Predictions Market Fans`,
    description: category.description,
    url: `${SITE_URL}/category/${category.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: categoryArticles.length,
      itemListElement: categoryArticles.slice(0, 30).map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${a.categorySlug}/${a.slug}`,
        name: stripHtml(a.title),
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE_URL}/articles` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${SITE_URL}/category/${category.slug}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(collectionJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-6">
        <Link href="/" className="hover:text-black hover:underline transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <Link href="/articles" className="hover:text-black hover:underline transition-colors">Articles</Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <span className="text-black font-bold">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 rounded-full border-2 border-black shrink-0" style={{ backgroundColor: category.color }} />
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-black/85 font-medium max-w-2xl leading-relaxed">{category.description}</p>
        )}
        <p className="text-xs font-mono font-bold text-black mt-3 inline-block bg-white border-2 border-black rounded-full px-3 py-1 shadow-pop-sm">
          {categoryArticles.length} article{categoryArticles.length !== 1 ? 's' : ''}
        </p>
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
        <div className="text-center py-16 bg-white border-2 border-black rounded-2xl shadow-pop">
          <p className="text-ink-secondary text-lg font-medium">No articles in this category yet.</p>
          <Link href="/articles" className="inline-block mt-4 px-5 py-2.5 bg-brand-yellow border-2 border-black rounded-xl font-bold text-black shadow-pop-sm hover:-translate-y-0.5 transition-transform">
            Browse all articles →
          </Link>
        </div>
      )}
    </div>
  );
}
