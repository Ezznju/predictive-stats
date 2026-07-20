import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  FlowerShape, DaisyShape, UShape, BoldCircle, HalfCircle,
  DiamondShape, ZigzagLine, ConcentricArches, PinwheelTile,
  QuatrefoilFlower, CornerDotSquare, ArrowBanner,
} from '@/components/GeometricShapes';
import {
  getFeaturedArticles, getPublishedArticles,
  getCategories, getAuthors, getSiteSettings,
} from '@/lib/db';
import { buildHomepageContent } from '@/lib/homepage-content';

export const dynamic = 'force-dynamic';
export const metadata = { alternates: { canonical: '/' } };

export default async function Home() {
  const [featured, allArticles, categories, authors, settings] = await Promise.all([
    getFeaturedArticles(),
    getPublishedArticles(),
    getCategories(),
    getAuthors(),
    getSiteSettings(),
  ]);

  const { hero, subFeatured, trending, latest, popularReads } =
    buildHomepageContent(featured, allArticles);
  const heroArticle = hero;

  const authorMap = new Map(authors.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  return (
    <div>
      {/* ── HERO ────────────────────────────────────────────────────── */}
      {heroArticle && (
        <section className="border-b border-surface-border relative overflow-hidden">
          {/* Shape band: normal-flow visible strip (NOT a background layer).
              pointer-events-none so it never intercepts clicks. */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 relative z-10 pointer-events-none" aria-hidden="true">
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
              <div className="lg:col-span-2">
                <ArticleCard article={heroArticle} variant="featured"
                  author={authorMap.get(heroArticle.authorId)}
                  category={categoryMap.get(heroArticle.categorySlug)} />
              </div>
              <div className="flex flex-col gap-6">
                {subFeatured.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                      <Zap className="w-3.5 h-3.5 text-black" />
                      <span className="text-xs font-bold tracking-widest uppercase text-black">Featured</span>
                    </div>
                    <div className="space-y-5">
                      {subFeatured.map((article) => (
                        <ArticleCard key={article.id} article={article} variant="horizontal"
                          author={authorMap.get(article.authorId)}
                          category={categoryMap.get(article.categorySlug)} />
                      ))}
                    </div>
                  </div>
                )}
                {trending.length > 0 && (
                  <div className="mt-auto">
                    <div className="flex items-center gap-2 border-b border-surface-border pb-2 mb-4">
                      <TrendingUp className="w-3.5 h-3.5 text-black" />
                      <span className="text-xs font-bold tracking-widest uppercase text-black">Trending Now</span>
                    </div>
                    <div className="space-y-4">
                      {trending.slice(0, 4).map((article, i) => {
                        const cat = categoryMap.get(article.categorySlug);
                        return (
                          <Link key={article.id} href={`/${article.categorySlug}/${article.slug}`}
                            className="flex items-start gap-3 group">
                            <span className="text-2xl font-display font-bold text-black/30 leading-none mt-0.5">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div>
                              {cat && <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5 text-black">{cat.name}</span>}
                              <h4 className="text-sm font-display font-semibold text-black leading-snug group-hover:text-white transition-colors line-clamp-2">
                                {article.title}
                              </h4>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── DECISION LAB STRIP ──────────────────────────────────────── */}
      <DecisionLabStrip />

      {/* ── FREE TOOLS (promoted up — the product leads) ─────────────── */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <CornerDotSquare size={60} color="#29C5F6" dotColor="#FF00B8" className="absolute top-6 -right-4 opacity-70 hidden md:block" />
          <HalfCircle size={80} color="#2BD96E" direction="right" className="absolute -left-10 bottom-8 opacity-70 hidden md:block" />
        </div>
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
            <Link href="/tools/lp-scanner"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover">
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
                See what LP farming <em>actually</em> pays. We strip out the headline-APR fantasy and rank markets by realistic lifetime earnings — net of competition, adverse selection, and time to resolution.
              </p>
            </Link>
            <Link href="/tools/arbitrage-scanner"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover">
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
                Not just price gaps — <em>executable</em> profit. Every spread is shown net of fees, slippage, and orderbook depth, with a confidence score and the exact legs to place.
              </p>
            </Link>
            <Link href="/pulse"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover">
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
                Whale trades, <em>judged</em>. We aggregate each wallet&apos;s positions, score conviction by edge and track record, and grade every call against the outcome — so you can see who&apos;s actually sharp.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ── LATEST ANALYSIS (collapses if nothing fresh) ─────────────── */}
      {latest.length > 0 && (
        <section className="py-12 border-b border-surface-border relative overflow-hidden">
          <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <ConcentricArches size={120} colors={['#4845F0', '#29C5F6', '#4845F0']} className="absolute -right-6 top-8 opacity-80 hidden md:block" />
            <QuatrefoilFlower size={110} petalColor="#C9B8F5" holeColor="#FF8C00" className="absolute -left-8 bottom-10 opacity-90 hidden md:block" />
          </div>
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
                <ArticleCard key={article.id} article={article}
                  author={authorMap.get(article.authorId)}
                  category={categoryMap.get(article.categorySlug)} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CATEGORIES ───────────────────────────────────────────────── */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <FlowerShape size={100} color="#FF00B8" className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />
          <UShape size={80} color="#4845F0" strokeWidth={20} className="absolute right-6 top-6 opacity-80 hidden md:block" />
        </div>
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
                <Link key={cat.id} href={`/category/${cat.slug}`}
                  className="group rounded-2xl p-4 card-pop card-pop-hover flex items-center gap-3"
                  style={{ backgroundColor: bg }}>
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-black" style={{ backgroundColor: cat.color }} />
                  <h3 className={`font-display font-bold text-sm leading-snug ${lightBg ? 'text-black' : 'text-white'}`}>{cat.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ───────────────────────────────────────────────── */}
      <NewsletterBlock variant="banner" heading={settings.newsletterHeading} body={settings.newsletterBody} />

      {/* ── POPULAR READS + WRITERS (popular collapses if nothing fresh) ── */}
      <section className="py-12 border-b border-surface-border relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <HalfCircle size={100} color="#2BD96E" direction="up" className="absolute -bottom-12 left-20 opacity-80 hidden md:block" />
          <DiamondShape size={60} color="#D9F24B" className="absolute top-10 right-10 opacity-90 hidden md:block" />
          <PinwheelTile size={60} bladeColor="#9D5CFF" className="absolute bottom-4 right-[8%] opacity-90 hidden lg:block rotate-12" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          {popularReads.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="heading-chip bg-neon-cyan" />
                  <h2 className="font-display font-bold text-2xl text-black">Popular Reads</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularReads.map((article) => (
                    <ArticleCard key={article.id} article={article}
                      author={authorMap.get(article.authorId)}
                      category={categoryMap.get(article.categorySlug)} />
                  ))}
                </div>
              </div>
              <WritersRail authors={authors} />
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <WritersRail authors={authors} />
            </div>
          )}
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────────── */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
          <BoldCircle size={160} color="#4845F0" className="absolute -top-16 -left-16 opacity-60" />
          <FlowerShape size={110} color="#FF00B8" className="absolute -bottom-8 -right-8 opacity-80" />
          <ArrowBanner width={110} height={44} barColor="#29C5F6" className="absolute top-1/3 right-6 hidden md:block" />
          <CornerDotSquare size={64} color="#2BD96E" dotColor="#9D5CFF" className="absolute bottom-12 left-[10%] -rotate-6 hidden md:block" />
          <QuatrefoilFlower size={64} petalColor="#C9B8F5" holeColor="#FF8C00" className="absolute top-6 left-[28%] hidden lg:block" />
        </div>
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

function DecisionLabStrip() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      {/* your shapes, kept as faint texture so the band still feels on-brand */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.16]" aria-hidden="true">
        <ZigzagLine width={2000} height={40} color="#D9F24B" className="absolute -top-1 left-0" />
        <CornerDotSquare size={70} color="#29C5F6" dotColor="#FF00B8" className="absolute -left-3 bottom-2 rotate-6" />
        <ConcentricArches size={150} colors={['#FF00B8', '#FF6B00', '#FF00B8']} className="absolute -right-8 -bottom-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7 relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="inline-block w-4 h-7 rounded-md bg-neon-lime border-2 border-white shrink-0 mt-1" aria-hidden="true" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-cyan">The Decision Lab</span>
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight mt-1">
              Three free tools. Zero paywall. One honest number.
            </h2>
            <p className="text-white/70 text-sm mt-1.5 max-w-xl leading-relaxed">
              LP rewards, cross-venue arbitrage, and whale intelligence — professor-grade and free,
              each showing the <span className="text-white font-medium">realistic</span> figure instead of the headline fantasy.
            </p>
          </div>
        </div>

        <Link href="/tools"
          className="inline-flex items-center gap-2 self-start md:self-auto bg-neon-lime text-black font-display font-bold text-sm px-5 py-3 rounded-xl border-2 border-white shadow-[4px_4px_0_0_#FF00B8] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#FF00B8] active:translate-x-0 active:translate-y-0 active:shadow-[4px_4px_0_0_#FF00B8] focus-visible:outline-white transition-all whitespace-nowrap">
          Open the tools <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function WritersRail({ authors }: { authors: Awaited<ReturnType<typeof getAuthors>> }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="heading-chip bg-neon-green" />
        <h2 className="font-display font-bold text-xl text-black">Our Writers</h2>
      </div>
      <div className="space-y-4">
        {authors.map((author) => (
          <Link key={author.id} href={`/author/${author.slug}`}
            className="flex items-center gap-3 p-3 bg-white rounded-xl card-pop card-pop-hover group">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-overlay flex-shrink-0 border-2 border-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
  );
}
