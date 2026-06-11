import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  FlowerShape,
  DaisyShape,
  UShape,
  DottedSquare,
  ArrowShape,
  BoldCircle,
  HalfCircle,
  ConcentricRings,
  DiamondShape,
  ZigzagLine,
  BlobShape,
} from '@/components/GeometricShapes';
import {
  getFeaturedArticles,
  getLatestArticles,
  getPublishedArticles,
  getCategories,
  getAuthors,
  getSiteSettings,
  getAuthorById,
  getCategoryBySlug,
  formatDate,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [featured, allArticles, categories, authors, settings] = await Promise.all([
    getFeaturedArticles(),
    getPublishedArticles(),
    getCategories(),
    getAuthors(),
    getSiteSettings(),
  ]);

  const heroArticle = featured[0];
  const subFeatured = featured.slice(1, 3);
  const latest = allArticles.filter((a) => a.id !== heroArticle?.id).slice(0, 8);
  const trending = allArticles.slice(0, 5);
  const popularReads = allArticles.slice(3, 7);

  // Build lookup maps
  const authorMap = new Map(authors.map(a => [a.id, a]));
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  return (
    <div>
      {/* Hero Section */}
      {heroArticle && (
        <section className="border-b border-surface-border relative overflow-hidden">
          {/* Bold geometric shapes — bright & vivid */}
          <DottedSquare size={90} className="absolute top-6 left-6 opacity-60" />
          <BoldCircle size={180} color="#0055FF" className="absolute -top-12 right-[30%] opacity-40" />
          <DaisyShape size={70} className="absolute top-4 right-[35%] opacity-55" />
          <HalfCircle size={140} color="#FF0066" direction="left" className="absolute -right-10 top-1/4 opacity-45" />
          <ArrowShape width={120} height={45} className="absolute bottom-16 right-[20%] opacity-40" />
          <FlowerShape size={80} color="#E01FFF" className="absolute bottom-8 left-[15%] opacity-50" />
          <DiamondShape size={50} color="#FFE642" className="absolute top-1/3 left-[8%] opacity-60" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main featured */}
              <div className="lg:col-span-2">
                <ArticleCard
                  article={heroArticle}
                  variant="featured"
                  author={authorMap.get(heroArticle.authorId)}
                  category={categoryMap.get(heroArticle.categorySlug)}
                />
              </div>

              {/* Sidebar */}
              <div className="flex flex-col gap-6">
                {/* Sub-featured */}
                <div>
                  <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                    <Zap className="w-3.5 h-3.5 text-black" />
                    <span className="text-xs font-bold tracking-widest uppercase text-black">Featured</span>
                  </div>
                  <div className="space-y-5">
                    {subFeatured.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        variant="horizontal"
                        author={authorMap.get(article.authorId)}
                        category={categoryMap.get(article.categorySlug)}
                      />
                    ))}
                  </div>
                </div>

                {/* Trending */}
                <div className="mt-auto">
                  <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                    <TrendingUp className="w-3.5 h-3.5 text-black" />
                    <span className="text-xs font-bold tracking-widest uppercase text-black">Trending Now</span>
                  </div>
                  <div className="space-y-4">
                    {trending.slice(0, 4).map((article, i) => {
                      const cat = categoryMap.get(article.categorySlug);
                      return (
                        <Link key={article.id} href={`/articles/${article.slug}`} className="flex items-start gap-3 group">
                          <span className="text-2xl font-display font-bold text-black/30 leading-none mt-0.5">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <div>
                            {cat && (
                              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-black">
                                {cat.name}
                              </span>
                            )}
                            <h4 className="text-sm font-display font-semibold text-black leading-snug group-hover:text-white transition-colors line-clamp-2">
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

      {/* Geometric Divider */}
      <div className="relative h-16 overflow-hidden">
        <ZigzagLine width={2000} height={40} color="#FFE642" className="absolute top-4 left-0 opacity-50" />
        <div className="absolute left-1/4 top-2">
          <DottedSquare size={40} color="#00E676" dotColor="#E01FFF" className="opacity-60" />
        </div>
        <div className="absolute right-1/3 top-1">
          <DaisyShape size={40} petalColor="#00E5FF" className="opacity-55" />
        </div>
      </div>

      {/* Latest Articles */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <ConcentricRings size={100} className="absolute -right-8 top-8 opacity-40" />
        <BlobShape size={120} color="#FFE642" className="absolute -left-10 bottom-10 opacity-35" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-black rounded-full" />
              <h2 className="font-display font-bold text-2xl text-black">Latest Analysis</h2>
            </div>
            <Link href="/articles" className="text-sm text-black hover:text-white font-medium flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latest.slice(0, 6).map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                author={authorMap.get(article.authorId)}
                category={categoryMap.get(article.categorySlug)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <FlowerShape size={100} color="#FF0066" className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-35" />
        <UShape size={80} color="#0055FF" className="absolute right-10 top-6 opacity-40" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-black rounded-full" />
            <h2 className="font-display font-bold text-2xl text-black">Browse Topics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = allArticles.filter((a) => a.categorySlug === cat.slug).length;
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group bg-white border border-white/30 rounded-2xl p-4 hover:border-black/30 hover:shadow-md transition-all card-hover"
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: cat.color }} />
                  <h3 className="font-display font-semibold text-black text-sm group-hover:text-ink-secondary transition-colors">{cat.name}</h3>
                  <p className="text-xs text-ink-muted mt-1">{count} article{count !== 1 ? 's' : ''}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <NewsletterBlock
        variant="banner"
        heading={settings.newsletterHeading}
        body={settings.newsletterBody}
      />

      {/* Popular Reads + Writers */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <HalfCircle size={100} color="#00E676" direction="up" className="absolute -bottom-12 left-20 opacity-40" />
        <DiamondShape size={60} color="#FFE642" className="absolute top-10 right-16 opacity-55" />
        <DaisyShape size={55} petalColor="#00E5FF" centerColor="#FFE642" className="absolute bottom-6 right-1/3 opacity-45" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Popular */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-black rounded-full" />
                <h2 className="font-display font-bold text-2xl text-black">Popular Reads</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {popularReads.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    author={authorMap.get(article.authorId)}
                    category={categoryMap.get(article.categorySlug)}
                  />
                ))}
              </div>
            </div>

            {/* Writers */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 bg-black rounded-full" />
                <h2 className="font-display font-bold text-xl text-black">Our Writers</h2>
              </div>
              <div className="space-y-4">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/author/${author.slug}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-white/30 hover:border-black/20 hover:shadow-sm transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-overlay flex-shrink-0">
                      <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm text-black group-hover:text-ink-secondary transition-colors">{author.name}</h4>
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
        {/* Bold decorative shapes */}
        <BoldCircle size={160} color="#0055FF" className="absolute -top-16 -left-16 opacity-30" />
        <FlowerShape size={110} color="#E01FFF" className="absolute -bottom-8 -right-8 opacity-40" />
        <ArrowShape width={100} height={38} className="absolute top-1/3 right-8 opacity-35" />
        <DottedSquare size={65} color="#00E676" dotColor="#FF0066" className="absolute bottom-12 left-[10%] opacity-50" />
        <UShape size={70} color="#FFE642" strokeWidth={14} className="absolute top-8 left-1/2 -translate-x-1/2 opacity-35" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-1.5 rounded-full mb-6">
              <BarChart3 className="w-3.5 h-3.5 text-black" />
              <span className="text-xs font-bold uppercase tracking-wider text-black">Our Mission</span>
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-black">{settings.missionHeading}</h2>
            <p className="text-black/80 mt-4 leading-relaxed">{settings.missionBody}</p>
            <Link href="/about" className="inline-flex items-center gap-2 mt-6 text-black hover:text-white font-medium transition-colors">
              Read our story <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
