import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, TrendingUp, Zap, BarChart3, Activity } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  FlowerShape, UShape, BoldCircle, HalfCircle,
  DiamondShape, ConcentricArches, PinwheelTile,
  QuatrefoilFlower, CornerDotSquare, ArrowBanner,
} from '@/components/GeometricShapes';
import {
  getFeaturedArticles, getPublishedArticles,
  getCategories, getAuthors, getSiteSettings,
} from '@/lib/db';
import { buildHomepageContent } from '@/lib/homepage-content';
import { DecisionLabStrip } from '@/components/golden/DecisionLabStrip';
import { MascotBand } from '@/components/MascotBand';

export const revalidate = 300;
export const metadata = { alternates: { canonical: 'https://predictionsmarketfans.com/' } };

export default async function Home() {
  let featured: Awaited<ReturnType<typeof getFeaturedArticles>> = [];
  let allArticles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let authors: Awaited<ReturnType<typeof getAuthors>> = [];
  let settings: Awaited<ReturnType<typeof getSiteSettings>> = {
    siteName: 'Predictions Market Fans',
    siteTagline: 'Sharp analysis for uncertain markets',
    siteDescription: '',
    siteUrl: '',
    newsletterHeading: '',
    newsletterBody: '',
    missionHeading: '',
    missionBody: '',
    socialTwitter: '',
    socialLinkedin: '',
    socialGithub: '',
  };
  try {
    [featured, allArticles, categories, authors, settings] = await Promise.all([
      getFeaturedArticles(),
      getPublishedArticles(),
      getCategories(),
      getAuthors(),
      getSiteSettings(),
    ]);
  } catch (e) {
    console.warn('[home] Supabase unavailable (quota?), serving stale/empty', e);
  }

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
          <MascotBand />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* LEFT — 2 featured stories (hidden on mobile, shown on desktop) */}
              <div className="hidden lg:flex lg:col-span-3 flex-col gap-5">
                <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-1">
                  <Zap className="w-3.5 h-3.5 text-black" />
                  <span className="text-xs font-bold tracking-widest uppercase text-black">Today&apos;s Picks</span>
                </div>
                {subFeatured.map((article) => (
                  <Link key={article.id} href={`/${article.categorySlug}/${article.slug}`}
                    className="group block flex-1">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden border-2 border-black shadow-[3px_3px_0_#000] mb-2">
                      {article.featuredImage && (
                        <Image src={article.featuredImage} alt={article.title} fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="250px" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    {(() => {
                      const cat = categoryMap.get(article.categorySlug);
                      return cat ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">{cat.name}</span>
                      ) : null;
                    })()}
                    <h3 className="font-display font-bold text-sm text-black leading-snug group-hover:text-brand-orange transition-colors line-clamp-3">
                      {article.title}
                    </h3>
                    <span className="text-[11px] text-black/50 mt-1 block">
                      {authorMap.get(article.authorId)?.name} · {article.readTime} min
                    </span>
                  </Link>
                ))}
              </div>

              {/* CENTER — main featured story */}
              <div className="lg:col-span-6 flex flex-col">
                <ArticleCard article={heroArticle} variant="featured"
                  author={authorMap.get(heroArticle.authorId)}
                  category={categoryMap.get(heroArticle.categorySlug)} />
              </div>

              {/* RIGHT — trending stories (2 on mobile, 5 on desktop) */}
              <div className="lg:col-span-3 flex flex-col">
                <div className="flex items-center gap-2 border-b-2 border-black pb-2 mb-4">
                  <TrendingUp className="w-3.5 h-3.5 text-black" />
                  <span className="text-xs font-bold tracking-widest uppercase text-black">Trending Stories</span>
                </div>
                <div className="flex-1 flex flex-col justify-between space-y-0">
                  {trending.slice(0, 5).map((article, i) => {
                    const cat = categoryMap.get(article.categorySlug);
                    return (
                      <Link key={article.id} href={`/${article.categorySlug}/${article.slug}`}
                        className={`group block py-3 border-b border-black/10 last:border-b-0 flex-1 ${i >= 3 ? 'hidden lg:block' : ''}`}>
                        <h4 className="font-display font-bold text-[20px] text-black leading-snug group-hover:text-brand-orange transition-colors line-clamp-3">
                          {article.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          {cat && <span className="text-[10px] font-bold uppercase tracking-wider text-black/50">{cat.name}</span>}
                          <span className="text-[14px] font-medium text-black/40">by {authorMap.get(article.authorId)?.name}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
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
              <h2 className="font-display font-bold text-[28px] text-black">Free Tools</h2>
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
                  <h3 className="font-display font-bold text-[22px] text-ink group-hover:text-black transition-colors">LP Reward Scanner</h3>
                  <p className="text-[14px] font-medium text-ink-muted">Polymarket</p>
                </div>
              </div>
              <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3">
                <p className="text-sm font-bold text-black">
                  This tool answers: &ldquo;Does providing liquidity here actually pay, once hidden costs are counted?&rdquo;
                </p>
              </div>
            </Link>
            <Link href="/tools/arbitrage-scanner"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D395]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#00D395]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[22px] text-ink group-hover:text-black transition-colors">Arbitrage Scanner</h3>
                  <p className="text-[14px] font-medium text-ink-muted">Polymarket × Kalshi</p>
                </div>
              </div>
              <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3">
                <p className="text-sm font-bold text-black">
                  This tool answers: &ldquo;Is anything mispriced right now, and could I actually fill it?&rdquo;
                </p>
              </div>
            </Link>
            <Link href="/pulse"
              className="group bg-white rounded-2xl border-2 border-black p-5 card-pop card-pop-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9F24B]/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-[#D9F24B]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-[22px] text-ink group-hover:text-black transition-colors">Prediction Pulse</h3>
                  <p className="text-[14px] font-medium text-ink-muted">Whale Tracker</p>
                </div>
              </div>
              <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3">
                <p className="text-sm font-bold text-black">
                  This tool answers: &ldquo;When a big wallet moves, is it a signal worth following or just noise?&rdquo;
                </p>
              </div>
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
                <h2 className="font-display font-bold text-[28px] text-black">Latest Analysis</h2>
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
            <h2 className="font-display font-bold text-[28px] text-black">Browse Topics</h2>
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
                  <h2 className="font-display font-bold text-[28px] text-black">Popular Reads</h2>
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
