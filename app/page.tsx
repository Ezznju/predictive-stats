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
        <section className="border-b border-surface-border relative overflow-hidden">
          {/* Decorative background shapes */}
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full bg-brand-yellow opacity-[0.06]" />
          <div className="absolute -bottom-16 left-10 w-48 h-48 rounded-full bg-brand-amber opacity-[0.05]" />
          <div className="absolute top-32 left-1/2 w-20 h-20 rounded-2xl bg-brand-orange opacity-[0.04] rotate-12" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
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
                    <Zap className="w-3.5 h-3.5 text-brand-amber" />
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-amber">Featured</span>
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
                    <TrendingUp className="w-3.5 h-3.5 text-brand-orange" />
                    <span className="text-xs font-bold tracking-widest uppercase text-brand-orange">Trending Now</span>
                  </div>
                  <div className="space-y-4">
                    {trending.slice(0, 4).map((article, i) => {
                      const cat = getCategoryBySlug(article.categorySlug);
                      return (
                        <Link key={article.id} href={`/articles/${article.slug}`} className="flex items-start gap-3 group">
                          <span className="text-2xl font-display font-bold text-surface-border-strong leading-none mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            {cat && (
                              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5" style={{ color: cat.color }}>
                                {cat.name}
                              </span>
                            )}
                            <h4 className="text-sm font-display font-semibold text-ink leading-snug group-hover:text-brand-orange transition-colors line-clamp-2">
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
              <div className="w-1 h-6 bg-brand-orange rounded-full" />
              <h2 className="font-display font-bold text-2xl text-ink">Latest Analysis</h2>
            </div>
            <Link href="/articles" className="text-sm text-brand-orange hover:text-brand-orange/80 font-medium flex items-center gap-1 transition-colors">
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
            <div className="w-1 h-6 bg-brand-amber rounded-full" />
            <h2 className="font-display font-bold text-2xl text-ink">Browse Topics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = articles.filter((a) => a.categorySlug === cat.slug).length;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group bg-surface-raised border border-surface-border rounded-2xl p-4 hover:border-brand-amber/40 hover:shadow-md transition-all card-hover"
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: cat.color }} />
                  <h3 className="font-display font-semibold text-ink text-sm group-hover:text-brand-orange transition-colors">{cat.name}</h3>
                  <p className="text-xs text-ink-muted mt-1">{count} article{count !== 1 ? 's' : ''}</p>
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
                <h2 className="font-display font-bold text-2xl text-ink">Popular Reads</h2>
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
                <div className="w-1 h-6 bg-brand-blue rounded-full" />
                <h2 className="font-display font-bold text-xl text-ink">Our Writers</h2>
              </div>
              <div className="space-y-4">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/author/${author.slug}`}
                    className="flex items-center gap-3 p-3 bg-surface-raised rounded-xl border border-surface-border hover:border-brand-amber/40 hover:shadow-sm transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-overlay flex-shrink-0">
                      <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-ink group-hover:text-brand-orange transition-colors">{author.name}</h4>
                      <p className="text-xs text-ink-muted">{author.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 relative overflow-hidden">
        {/* Decorative shapes */}
        <div className="absolute top-8 left-1/4 w-16 h-16 rounded-full bg-brand-amber opacity-[0.07]" />
        <div className="absolute bottom-12 right-1/3 w-24 h-24 rounded-2xl bg-brand-orange opacity-[0.05] rotate-45" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-amber/10 px-4 py-1.5 rounded-full mb-6">
              <BarChart3 className="w-3.5 h-3.5 text-brand-amber" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-amber">Our Mission</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink">{siteSettings.missionHeading}</h2>
            <p className="text-ink-secondary mt-4 leading-relaxed">{siteSettings.missionBody}</p>
            <Link href="/about" className="inline-flex items-center gap-2 mt-6 text-brand-orange hover:text-brand-orange/80 font-medium transition-colors">
              Read our story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
