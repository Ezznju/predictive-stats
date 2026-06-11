import { Metadata } from 'next';
import { ArticleCard } from '@/components/ArticleCard';
import { articles, categories } from '@/lib/data';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'All articles on prediction markets, forecasting, data analysis, and probabilistic thinking.',
};

export default function ArticlesPage() {
  const published = articles.filter(a => a.status === 'published')
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-display font-bold text-4xl text-white">All Articles</h1>
        <p className="text-slate-400 mt-2">Prediction market analysis, forecasting research, and data-driven commentary.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link href="/articles" className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-brand-red text-white transition-all">
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/category/${cat.slug}`}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-full border border-surface-border text-slate-400 hover:text-white hover:border-brand-red/50 transition-all"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {published.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
