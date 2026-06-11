import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  articles,
  categories,
  authors,
  getFeaturedArticles,
  getLatestArticles,
  siteSettings,
  formatDate,
  getAuthorById,
  getCategoryBySlug,
} from '@/lib/data';

export default function Home() {
  const featured = getFeaturedArticles();
  const heroArticle = featured[0];
  const subFeatured = featured.slice(1, 3);
  const latest = getLatestArticles(8).filter((a) => a.id !== heroArticle?.id);
  const trending = articles.slice(0, 5);
  const popularReads = articles.slice(3, 7);

  return (
    <div>
      {/* Hero Section */}
      {heroArticle && (
        <section className="border-b border-surface-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main featured */}
              <div className="lg:col-span-2">
                <ArticleCard article={heroArticle} variant="featured" />
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {/* Sub-featured */}
                <div>
                  <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-brand-yellow" />
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-yellow">Featured</span>
                  </div>
                  <div className="space-y-5">
                    {subFeatured.map((article) => (
                      <ArticleCard key={article.id} article={article} variant="horizontal" />
                    ))}
                  </div>
                </div>

                {/* Trending */}
                <div className="mt-auto">
                  <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                    <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-green">Trending Now</span>
                  </div>
                  <div className="space-y-4">
                    {trending.slice(0, 4).map((article, i) => {
                      const cat = getCategoryBySlug(article.categorySlug);
                      return (
                        <Link key={article.id} href={`/articles/${article.slug}`} className="flex items-start gap-3 group">
                          <span className="text-2xl font-display font-bold text-surface-border leading-none mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            {cat && (
                              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: cat.color }}>
                                {cat.name}
                              </span>
                            )}
                            <h4 className="text-sm font-display font-semibold text-white leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
                              {article.title}
                            </h4>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles */}
      <section className="py-12 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-brand-red rounded-full" />
              <h2 className="font-display font-bold text-2xl text-white">Latest Analysis</h2>
            </div>
            <Link href="/articles" className="text-sm text-brand-red hover:text-brand-red/80 font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-brand-yellow rounded-full" />
            <h2 className="font-display font-bold text-2xl text-white">Browse Topics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = articles.filter((a) => a.categorySlug === cat.slug).length;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group bg-surface-raised border border-surface-border rounded-xl p-4 hover:border-opacity-50 transition-all card-hover"
                  style={{ '--hover-color': cat.color } as React.CSSProperties}
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: cat.color }} />
                  <h3 className="font-display font-semibold text-white text-sm group-hover:text-brand-red transition-colors">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{count} article{count !== 1 ? 's' : ''}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterBlock variant="banner" />

      {/* Popular Reads + Writers */}
      <section className="py-12 border-b border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Popular */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-brand-green rounded-full" />
                <h2 className="font-display font-bold text-2xl text-white">Popular Reads</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {popularReads.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </div>

            {/* Writers */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-brand-cyan rounded-full" />
                <h2 className="font-display font-bold text-xl text-white">Our Writers</h2>
              </div>
              <div className="space-y-4">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/author/${author.slug}`}
                    className="flex items-center gap-3 p-3 bg-surface-raised rounded-xl border border-surface-border hover:border-brand-red/30 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-overlay flex-shrink-0">
                      <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-white group-hover:text-brand-red transition-colors">{author.name}</h4>
                      <p className="text-xs text-slate-500">{author.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-surface-overlay px-4 py-1.5 rounded-full mb-6">
              <BarChart3 className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Our Mission</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white">{siteSettings.missionHeading}</h2>
            <p className="text-slate-400 mt-4 leading-relaxed">{siteSettings.missionBody}</p>
            <Link href="/about" className="inline-flex items-center gap-2 mt-6 text-brand-red hover:text-brand-red/80 font-medium transition-colors">
              Read our story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
