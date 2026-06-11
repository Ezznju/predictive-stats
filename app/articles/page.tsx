import { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { articles, categories } from '@/lib/data';
import Link from 'next/link';
import {
  DottedSquare,
  BoldCircle,
  FlowerShape,
  DaisyShape,
  ArrowShape,
} from '@/components/GeometricShapes';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'All articles on prediction markets, forecasting, data analysis, and probabilistic thinking.',
};

export default function ArticlesPage() {
  const published = articles.filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative overflow-hidden">
      {/* Geometric decorations */}
      <DottedSquare size={70} color="#2ECC71" dotColor="#EC4899" className="absolute top-4 right-8 opacity-20" />
      <BoldCircle size={100} color="#4A6CF7" className="absolute -top-8 left-[15%] opacity-10" />
      <FlowerShape size={80} color="#7C3AED" className="absolute top-[30%] -right-6 opacity-10" />
      <DaisyShape size={50} className="absolute bottom-[20%] -left-4 opacity-15" />
      <ArrowShape width={80} height={30} className="absolute bottom-16 right-[10%] opacity-10" />

      {/* Header */}
      <div className="mb-10 relative z-10">
        <h1 className="font-display font-bold text-4xl text-ink">All Articles</h1>
        <p className="text-ink-secondary mt-2">Prediction market analysis, forecasting research, and data-driven commentary.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8 relative z-10">
        <Link href="/articles" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-brand-orange text-white transition-all shadow-sm">
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-surface-border text-ink-secondary hover:text-ink hover:border-brand-amber/50 hover:bg-surface-overlay transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {published.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
