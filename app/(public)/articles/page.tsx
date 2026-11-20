import { Metadata } from 'next';
import { ldJson } from '@/lib/json-ld';
import { ArticleCard } from '@/components/ArticleCard';
import { getPublishedArticles, getCategories, getAuthors } from '@/lib/db';
import { cachedByKey, slimArticles } from '@/lib/isolate-cache';
import { DEFAULT_OG_IMAGE, SITE_URL, stripHtml } from '@/lib/seo-utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  CornerDotSquare,
  FlowerShape,
  ArrowBanner,
} from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 18;

export const metadata: Metadata = {
  title: 'All Articles — Prediction Market Analysis & Guides',
  description:
    'All articles on prediction markets, Polymarket, Kalshi, forecasting, data analysis, and probabilistic thinking.',
  alternates: { canonical: `${SITE_URL}/articles` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/articles`,
    title: 'All Articles — Prediction Market Analysis & Guides',
    description:
      'All articles on prediction markets, Polymarket, Kalshi, forecasting, data analysis, and probabilistic thinking.',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'All Articles — Prediction Market Analysis & Guides',
    description:
      'All articles on prediction markets, Polymarket, Kalshi, forecasting, data analysis, and probabilistic thinking.',
    images: ['/twitter-image'],
  },
};

const getCachedArticlesPage = cachedByKey(
  'articles-page',
  10 * 60 * 1000,
  async () => {
    const [articles, categories, authors] = await Promise.all([
      getPublishedArticles(),
      getCategories(),
      getAuthors(),
    ]);
    return { articles: slimArticles(articles), categories, authors };
  }
);

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const { articles, categories, authors } = await getCachedArticlesPage();

  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const rawPage = Number(searchParams?.page ?? '1');
  const page = Number.isFinite(rawPage) ? Math.min(Math.max(1, Math.floor(rawPage)), totalPages) : 1;
  const start = (page - 1) * PAGE_SIZE;
  const visibleArticles = articles.slice(start, start + PAGE_SIZE);

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Articles — Predictions Market Fans',
    url: `${SITE_URL}/articles`,
    description: 'Prediction market analysis, forecasting research, and data-driven commentary.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: visibleArticles.map((a, idx) => ({
        '@type': 'ListItem',
        position: start + idx + 1,
        url: `${SITE_URL}/${a.categorySlug}/${a.slug}`,
        name: stripHtml(a.title),
      })),
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative overflow-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(collectionJsonLd) }} />

      {/* Subtle edge geometric accents */}
      <CornerDotSquare size={64} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-6 -right-4 -rotate-3 opacity-45 hidden lg:block pointer-events-none" />
      <FlowerShape size={70} color="#FF00B8" className="absolute top-[40%] -right-8 opacity-35 hidden lg:block pointer-events-none" />
      <ArrowBanner width={90} height={36} barColor="#29C5F6" className="absolute bottom-16 -right-4 opacity-45 hidden lg:block pointer-events-none" />

      {/* Header */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="heading-chip bg-neon-lime" />
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">All Articles</h1>
        </div>
        <p className="text-black/80 font-medium max-w-2xl">
          Prediction market analysis, forecasting research, and data-driven commentary.
          <span className="ml-2 font-mono text-xs font-bold bg-white border-2 border-black rounded-full px-2.5 py-0.5 align-middle">
            {articles.length} pieces
          </span>
        </p>
      </div>

      {/* Category filters */}
      <nav aria-label="Filter by topic" className="flex flex-wrap gap-2 mb-8 relative z-10">
        <Link
          href="/articles"
          aria-current="page"
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-black text-brand-yellow border-2 border-black shadow-pop-sm"
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-white text-black border-2 border-black shadow-pop-sm hover:bg-brand-yellow hover:-translate-y-0.5 transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {visibleArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            author={authorMap.get(article.authorId)}
            category={categoryMap.get(article.categorySlug)}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Articles pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2 relative z-10">
          {page > 1 ? (
            <Link
              href={page === 2 ? '/articles' : `/articles?page=${page - 1}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white text-black border-2 border-black rounded-xl shadow-pop-sm hover:bg-brand-yellow hover:-translate-y-0.5 transition-all"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white/50 text-black/40 border-2 border-black/30 rounded-xl cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Previous
            </span>
          )}

          <div className="flex items-center gap-1.5 px-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Link
                key={n}
                href={n === 1 ? '/articles' : `/articles?page=${n}`}
                aria-current={n === page ? 'page' : undefined}
                className={`w-9 h-9 inline-flex items-center justify-center text-sm font-mono font-bold rounded-xl border-2 border-black transition-all ${
                  n === page
                    ? 'bg-black text-brand-yellow shadow-pop-sm'
                    : 'bg-white text-black hover:bg-brand-yellow'
                }`}
              >
                {n}
              </Link>
            ))}
          </div>

          {page < totalPages ? (
            <Link
              href={`/articles?page=${page + 1}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white text-black border-2 border-black rounded-xl shadow-pop-sm hover:bg-brand-yellow hover:-translate-y-0.5 transition-all"
            >
              Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-white/50 text-black/40 border-2 border-black/30 rounded-xl cursor-not-allowed">
              Next <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </span>
          )}
        </nav>
      )}
    </div>
  );
}
