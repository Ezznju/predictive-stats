import { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { getPublishedArticles, getCategories, getAuthors } from '@/lib/db';
import Link from 'next/link';
import {
  CornerDotSquare,
  FlowerShape,
  DaisyShape,
  ArrowBanner,
  ConcentricArches,
} from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'All articles on prediction markets, forecasting, data analysis, and probabilistic thinking.',
  alternates: { canonical: 'https://predictionsmarketfans.com/articles' },
};

export default async function ArticlesPage() {
  const [articles, categories, authors] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
    getAuthors(),
  ]);

  const authorMap = new Map(authors.map(a => [a.id, a]));
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative overflow-hidden">
      {/* Geometric decorations */}
      <CornerDotSquare size={72} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-4 right-8 -rotate-3 hidden md:block" />
      <ConcentricArches size={110} colors={['#FF00B8', '#FF6B00', '#FF00B8']} className="absolute -top-4 left-[40%] hidden lg:block" />
      <FlowerShape size={80} color="#FF00B8" className="absolute top-[30%] -right-6 opacity-70 hidden md:block" />
      <DaisyShape size={50} petalColor="#9D5CFF" centerColor="#FFE642" className="absolute bottom-[20%] -left-4 opacity-80 hidden md:block" />
      <ArrowBanner width={90} height={36} barColor="#29C5F6" className="absolute bottom-16 right-[6%] hidden lg:block" />

      {/* Header */}
      <div className="mb-10 relative z-10">
        <h1 className="font-display font-bold text-4xl text-ink">All Articles</h1>
        <p className="text-ink-secondary mt-2">Prediction market analysis, forecasting research, and data-driven commentary.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        <Link href="/articles" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-black text-white transition-all shadow-sm">
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-white/20 text-ink-secondary hover:text-ink hover:border-brand-amber/50 hover:bg-white/15 transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {articles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            author={authorMap.get(article.authorId)}
            category={categoryMap.get(article.categorySlug)}
          />
        ))}
      </div>
    </div>
  );
}
