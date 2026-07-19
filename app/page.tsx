import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  FlowerShape,
  DaisyShape,
  UShape,
  BoldCircle,
  HalfCircle,
  DiamondShape,
  ZigzagLine,
  ConcentricArches,
  PinwheelTile,
  QuatrefoilFlower,
  CornerDotSquare,
  ArrowBanner,
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

export const metadata = {
  alternates: { canonical: '/' },
};

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
          {/* Shape marquee — solid, layered, super-bright (reference style) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 relative z-10" aria-hidden="true">
            <div className="flex items-center justify-between gap-4 overflow-hidden h-[88px] sm:h-[104px]">
              <div className="relative flex-shrink-0 w-[120px] h-full">
                <CornerDotSquare size={88} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-1 left-0 -rotate-3" />
                <DiamondShape size={36} color="#D9F24B" className="absolute bottom-0 right-0" />
              </div>
              <div className="relative flex-shrink-0 w-[150px] h-full hidden sm:block">
                <UShape size={96} color="#4845F0" strokeWidth={24} className="absolute top-1 left-2" />
                <QuatrefoilFlower size={64} petalColor="#C9B8F5" holeColor="#FF8C00" className="absolute top-6 right-0" />
              </div>
              <div className="relative flex-shrink-0 w-[130px] h-full hidden md:block">
                <PinwheelTile size={86} bladeColor="#9D5CFF" className="absolute top-2 left-0 rotate-6" />
                <DaisyShape size={48} petalColor="#29C5F6" centerColor="#FFE642" className="absolute bottom-0 right-0" />
              </div>
              <div className="relative flex-shrink-0 w-[160px] h-full hidden lg:block">
                <ArrowBanner width={150} height={58} barColor="#29C5F6" className="absolute top-1/2 -translate-y-1/2 left-0" />
              </div>
              <div className="relative flex-shrink-0 w-[200px] h-full hidden lg:block">
                <ConcentricArches size={150} colors={['#FF00B8', '#FF6B00', '#FF00B8']} className="absolute top-1/2 -translate-y-1/2 right-0" />
              </div>
            </div>
          </div>

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
      <div className="relative h-16 overflow-hidden" aria-hidden="true">
        <ZigzagLine width={2000} height={40} color="#D9F24B" className="absolute top-4 left-0" />
        <div className="absolute left-1/4 top-2">
          <CornerDotSquare size={44} color="#29C5F6" dotColor="#FF00B8" className="rotate-6" />
        </div>
        <div className="absolute right-1/3 top-1">
          <DaisyShape size={44} petalColor="#9D5CFF" centerColor="#FFE642" />
        </div>
        <div className="absolute right-[12%] top-3 hidden md:block">
          <QuatrefoilFlower size={40} petalColor="#C9B8F5" holeColor="#FF8C00" />
        </div>
      </div>

      {/* Latest Articles */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <ConcentricArches size={120} colors={['#4845F0', '#29C5F6', '#4845F0']} className="absolute -right-6 top-8 opacity-80 hidden md:block" />
        <QuatrefoilFlower size={110} petalColor="#C9B8F5" holeColor="#FF8C00" className="absolute -left-8 bottom-10 opacity-90 hidden md:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="heading-chip bg-neon-lime" />
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

      {/* Free Tools */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <CornerDotSquare size={60} color="#29C5F6" dotColor="#FF00B8" className="absolute top-6 -right-4 opacity-70 hidden md:block" />
        <HalfCircle size={80} color="#2BD96E" direction="right" className="absolute -left-10 bottom-8 opacity-70 hidden md:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="heading-chip bg-neon-blue" />
              <h2 className="font-display font-bold text-2xl text-black">Free Tools</h2>
            </div>
            <Link href="/tools" className="text-sm text-black hover:text-white font-medium flex items-center gap-1 transition-colors">
              All tools <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/tools/lp-scanner"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#7B3FE4]/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[#7B3FE4]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink group-hover:text-black transition-colors">LP Reward Scanner</h3>
                  <p className="text-xs text-ink-muted">Polymarket</p>
                </div>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Find the highest-paying liquidity provider rewards across all active Polymarket markets. Real-time data, sorted by yield.
              </p>
            </Link>
            <Link
              href="/tools/arbitrage-scanner"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D395]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#00D395]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink group-hover:text-black transition-colors">Arbitrage Scanner</h3>
                  <p className="text-xs text-ink-muted">Polymarket × Kalshi</p>
                </div>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Spot cross-platform price gaps between Polymarket and Kalshi. See exploitable spreads in real time.
              </p>
            </Link>
            <Link
              href="/pulse"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9F24B]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#D9F24B]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink group-hover:text-black transition-colors">Prediction Pulse</h3>
                  <p className="text-xs text-ink-muted">Whale Tracker</p>
                </div>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed">
                Real-time whale intelligence across prediction markets. Track large trades, monitor top wallets, and spot market-moving activity.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <FlowerShape size={100} color="#FF00B8" className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />
        <UShape size={80} color="#4845F0" strokeWidth={20} className="absolute right-6 top-6 opacity-80 hidden md:block" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="heading-chip bg-neon-magenta" />
            <h2 className="font-display font-bold text-2xl text-black">Browse Topics</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {categories.map((cat, i) => {
              const brights = ['#D9F24B', '#2BD96E', '#29C5F6', '#C9B8F5', '#FF00B8', '#FFE642', '#9D5CFF', '#FF6B00'];
              const bg = brights[i % brights.length];
              const lightBg = ['#D9F24B', '#2BD96E', '#29C5F6', '#C9B8F5', '#FFE642'].includes(bg);
              return (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group rounded-2xl p-4 card-pop card-pop-hover flex items-center gap-3"
                  style={{ backgroundColor: bg }}
                >
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-black" style={{ backgroundColor: cat.color }} />
                  <h3 className={`font-display font-bold text-sm leading-snug ${lightBg ? 'text-black' : 'text-white'}`}>{cat.name}</h3>
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
        <HalfCircle size={100} color="#2BD96E" direction="up" className="absolute -bottom-12 left-20 opacity-80 hidden md:block" />
        <DiamondShape size={60} color="#D9F24B" className="absolute top-10 right-10 opacity-90 hidden md:block" />
        <PinwheelTile size={60} bladeColor="#9D5CFF" className="absolute bottom-4 right-[8%] opacity-90 hidden lg:block rotate-12" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Popular */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="heading-chip bg-neon-cyan" />
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
                <div className="heading-chip bg-neon-green" />
                <h2 className="font-display font-bold text-xl text-black">Our Writers</h2>
              </div>
              <div className="space-y-4">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/author/${author.slug}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-xl card-pop card-pop-hover group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-overlay flex-shrink-0 border-2 border-black">
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
        <BoldCircle size={160} color="#4845F0" className="absolute -top-16 -left-16 opacity-60" />
        <FlowerShape size={110} color="#FF00B8" className="absolute -bottom-8 -right-8 opacity-80" />
        <ArrowBanner width={110} height={44} barColor="#29C5F6" className="absolute top-1/3 right-6 hidden md:block" />
        <CornerDotSquare size={64} color="#2BD96E" dotColor="#9D5CFF" className="absolute bottom-12 left-[10%] -rotate-6 hidden md:block" />
        <QuatrefoilFlower size={64} petalColor="#C9B8F5" holeColor="#FF8C00" className="absolute top-6 left-[28%] hidden lg:block" />

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
