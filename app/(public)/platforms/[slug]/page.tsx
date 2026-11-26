import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, X as XIcon, ExternalLink, ChevronRight } from 'lucide-react';
import { getPlatforms, getPlatformBySlug, Platform } from '@/lib/platforms';
import { getSiteSettings, getPublishedArticles, getAuthors, getCategories } from '@/lib/db';
import { cachedByKey, slimArticles } from '@/lib/isolate-cache';
import { TOOL_CARDS, ToolKey } from '@/lib/tool-embed';
import { ArticleCard } from '@/components/ArticleCard';
import { AffiliateDisclosure } from '@/components/AffiliateDisclosure';
import { TrackedLink } from '@/components/TrackedLink';
import { RatingBadge, RatingBars } from '@/components/PlatformRating';
import { BoldCircle, DaisyShape, HalfCircle, ZigzagLine } from '@/components/GeometricShapes';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

const PLATFORM_TOOLS: Partial<Record<string, ToolKey[]>> = {
  kalshi: ['kalshi-combo-calculator', 'kalshi-fee-calculator', 'kalshi-smart-money', 'kalshi-trending'],
  polymarket: ['lp-scanner', 'pulse', 'arbitrage-scanner', 'polymarket-trending'],
};

const getCachedPlatformHub = cachedByKey(
  'platform-hub',
  10 * 60 * 1000,
  async (slug: string) => {
    const platform = getPlatformBySlug(slug);
    if (!platform) return null;
    const [settings, allArticles, authors, categories] = await Promise.all([
      getSiteSettings(),
      getPublishedArticles(),
      getAuthors(),
      getCategories(),
    ]);

    const needle = new RegExp(`\\b${platform.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    const matching = allArticles
      .filter((a) => {
        if (platform.articleSlug && `${a.categorySlug}/${a.slug}` === platform.articleSlug) return false;
        const hay = `${a.title} ${a.slug} ${a.tags.join(' ')}`;
        return needle.test(hay);
      })
      .slice(0, 6);

    return {
      settings,
      relatedArticles: slimArticles(matching),
      authors,
      categories,
    };
  }
);

function buildPlatformFaqs(platform: Platform): { q: string; a: string }[] {
  return [
    {
      q: `What fees does ${platform.name} charge?`,
      a: `${platform.fees}. Minimum deposit: ${platform.minDeposit}.`,
    },
    {
      q: `Where is ${platform.name} available and how do you fund an account?`,
      a: `Availability: ${platform.regions}. Accepted funding methods: ${platform.payments}.`,
    },
    {
      q: `Who is ${platform.name} best for?`,
      a: `${platform.name} (${platform.type}, founded ${platform.founded}) is rated ${platform.overallRating}/5 in our hands-on testing and is best for: ${platform.bestFor}.`,
    },
  ];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) return {};
  const title = `${platform.name} Review ${new Date().getFullYear()}: Fees, Liquidity & Verdict`;
  const description = `${platform.name} review: ${platform.tagline} Rated ${platform.overallRating}/5 after hands-on testing. Fees, deposits, regulation, pros and cons.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/platforms/${platform.slug}` },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/platforms/${platform.slug}`,
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/twitter-image'],
    },
  };
}

export default async function PlatformReviewPage({ params }: PageProps) {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) notFound();

  const hub = await getCachedPlatformHub(platform.slug);
  const settings = hub?.settings;
  const relatedArticles = hub?.relatedArticles ?? [];
  const authorMap = new Map((hub?.authors ?? []).map((a) => [a.id, a]));
  const categoryMap = new Map((hub?.categories ?? []).map((c) => [c.slug, c]));

  const baseUrl = (settings?.siteUrl || SITE_URL).replace(/\/+$/, '');
  const pageUrl = `${baseUrl}/platforms/${platform.slug}`;
  const others = getPlatforms().filter((p) => p.slug !== platform.slug);
  const faqs = buildPlatformFaqs(platform);
  const toolKeys = PLATFORM_TOOLS[platform.slug] ?? [];

  const reviewJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'WebApplication',
      name: platform.name,
      url: platform.websiteUrl,
      applicationCategory: 'FinanceApplication',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: platform.overallRating,
      bestRating: 5,
      worstRating: 0,
    },
    author: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: settings?.siteName || 'Predictions Market Fans',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: settings?.siteName || 'Predictions Market Fans',
      url: baseUrl,
    },
    url: pageUrl,
    reviewBody: platform.verdict,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Platforms', item: `${baseUrl}/platforms` },
      { '@type': 'ListItem', position: 3, name: `${platform.name} Review`, item: pageUrl },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const facts: { label: string; value: string }[] = [
    { label: 'Type', value: platform.type },
    { label: 'Founded', value: String(platform.founded) },
    { label: 'Fees', value: platform.fees },
    { label: 'Minimum deposit', value: platform.minDeposit },
    { label: 'Payments', value: platform.payments },
    { label: 'Availability', value: platform.regions },
  ];

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(reviewJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd) }} />

      {/* Header band */}
      <div className="relative overflow-hidden bg-black/5 py-14">
        <BoldCircle size={130} color={platform.brandColor} className="absolute -top-10 right-[12%] opacity-60 hidden md:block" />
        <DaisyShape size={70} petalColor="#FFE642" centerColor="#FF00B8" className="absolute bottom-2 right-8 opacity-80 hidden md:block" />
        <HalfCircle size={70} color="#D9F24B" direction="right" className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-5">
            <Link href="/" className="hover:text-black hover:underline transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
            <Link href="/platforms" className="hover:text-black hover:underline transition-colors">Platforms</Link>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
            <span className="text-black font-bold">{platform.name} Review</span>
          </nav>
          <div className="flex flex-wrap items-center gap-4 mb-3">
            <h1 className="font-display font-bold text-4xl md:text-5xl text-ink">{platform.name} Review</h1>
            <RatingBadge rating={platform.overallRating} size="lg" />
          </div>
          <p className="text-xl text-ink-secondary leading-relaxed max-w-3xl">{platform.tagline}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <AffiliateDisclosure className="mb-10" />

        {/* Facts + ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6">
            <h2 className="font-display font-bold text-lg text-ink mb-4">Key facts</h2>
            <dl className="space-y-3">
              {facts.map((f) => (
                <div key={f.label} className="flex items-start justify-between gap-4">
                  <dt className="text-sm font-medium text-ink-faint flex-shrink-0">{f.label}</dt>
                  <dd className="text-sm text-ink text-right">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6">
            <h2 className="font-display font-bold text-lg text-ink mb-4">Our scores</h2>
            <RatingBars ratings={platform.ratings} color={platform.brandColor} />
          </div>
        </div>

        {/* Pros & cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6">
            <h2 className="font-display font-bold text-lg text-ink mb-4">What we like</h2>
            <ul className="space-y-2.5">
              {platform.pros.map((pro) => (
                <li key={pro} className="flex items-start gap-2 text-sm text-ink-secondary">
                  <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6">
            <h2 className="font-display font-bold text-lg text-ink mb-4">What could be better</h2>
            <ul className="space-y-2.5">
              {platform.cons.map((con) => (
                <li key={con} className="flex items-start gap-2 text-sm text-ink-secondary">
                  <XIcon className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" aria-hidden="true" />
                  {con}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Review body — white reading sheet for comfortable long-form reading */}
        <div className="bg-white rounded-2xl border-2 border-black shadow-pop-lg p-6 sm:p-10 mb-12">
          <div className="prose prose-lg max-w-[66ch] mx-auto prose-headings:font-display prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-secondary prose-p:leading-relaxed">
            {platform.review.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </div>

        {/* Full hands-on review article, when one exists */}
        {platform.articleSlug && (
          <Link
            href={`/${platform.articleSlug}`}
            className="flex items-center justify-between gap-4 bg-brand-yellow rounded-2xl border-2 border-black shadow-pop p-5 mb-12 hover:-translate-y-0.5 transition-transform"
          >
            <span>
              <span className="font-display font-bold text-ink block">
                Read the full hands-on review of {platform.name}
              </span>
              <span className="text-sm text-ink-muted">
                Sign-up, deposits, a live trade, a withdrawal and every fee, tested on a real account.
              </span>
            </span>
            <ArrowRight className="w-5 h-5 text-black flex-shrink-0" aria-hidden="true" />
          </Link>
        )}

        {/* Free Platform Tools Hub */}
        {toolKeys.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="heading-chip bg-[#FFE642]" />
              <h2 className="font-display font-bold text-2xl text-ink">Free {platform.name} Tools &amp; Calculators</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {toolKeys.map((key) => {
                const tool = TOOL_CARDS[key];
                return (
                  <Link
                    key={key}
                    href={tool.href}
                    className="group bg-[#FFFDF9] rounded-2xl border-2 border-black shadow-pop-sm p-5 hover:-translate-y-0.5 hover:shadow-pop transition-all flex flex-col justify-between"
                  >
                    <div>
                      <span
                        className="inline-block font-mono font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border border-black text-black mb-2"
                        style={{ backgroundColor: tool.color }}
                      >
                        {tool.badge}
                      </span>
                      <h3 className="font-display font-bold text-base text-ink group-hover:text-brand-orange transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed">{tool.description}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-display font-bold text-black">
                      Open free tool <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Verdict + CTA */}
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-black shadow-pop-lg p-6 sm:p-8 mb-12">
          <ZigzagLine width={90} className="absolute top-4 right-4 opacity-40 hidden sm:block" />
          <h2 className="font-display font-bold text-2xl text-ink mb-3">Our verdict</h2>
          <p className="text-ink-secondary leading-relaxed mb-2 max-w-3xl">{platform.verdict}</p>
          <p className="text-sm text-ink-muted mb-6">
            <strong className="text-ink">Best for:</strong> {platform.bestFor}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <TrackedLink
              platform={platform.slug}
              ctx="review-cta"
              className="inline-flex items-center gap-2 font-bold text-black bg-neon-cyan border-2 border-black rounded-xl px-5 py-2.5 shadow-pop hover:-translate-y-0.5 transition-transform"
            >
              Visit {platform.name} <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </TrackedLink>
            <Link
              href="/platforms"
              className="inline-flex items-center gap-2 font-bold text-black bg-brand-yellow border-2 border-black rounded-xl px-5 py-2.5 shadow-pop hover:-translate-y-0.5 transition-transform"
            >
              Compare alternatives <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <AffiliateDisclosure variant="compact" className="mt-4" />
        </div>

        {/* Platform FAQ (matches FAQPage JSON-LD) */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <div className="heading-chip bg-neon-magenta" />
            <h2 className="font-display font-bold text-2xl text-ink">{platform.name} FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <div key={f.q} className="bg-white rounded-2xl border-2 border-black shadow-pop-sm p-5">
                <h3 className="font-display font-bold text-base text-ink mb-1.5">{f.q}</h3>
                <p className="text-sm text-ink-secondary leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pillar Hub: Latest Articles Covering This Platform */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="heading-chip bg-neon-green" />
                <h2 className="font-display font-bold text-2xl text-ink">
                  Latest {platform.name} Guides &amp; Analysis
                </h2>
              </div>
              <Link
                href="/articles"
                className="text-xs font-display font-bold text-black hover:underline inline-flex items-center gap-1"
              >
                All articles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  author={authorMap.get(article.authorId)}
                  category={categoryMap.get(article.categorySlug)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Other platforms */}
        <h2 className="font-display font-bold text-xl text-ink mb-4">How the others compare</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {others.map((p) => (
            <Link
              key={p.slug}
              href={`/platforms/${p.slug}`}
              className="flex items-center justify-between gap-3 p-4 bg-white rounded-2xl border-2 border-black shadow-pop-sm hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <span className="font-display font-bold text-ink block">{p.name}</span>
                <span className="text-xs text-ink-faint">{p.type}</span>
              </div>
              <RatingBadge rating={p.overallRating} size="sm" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
