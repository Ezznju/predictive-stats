import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, X as XIcon, ExternalLink } from 'lucide-react';
import { getPlatforms, getPlatformBySlug } from '@/lib/platforms';
import { getSiteSettings } from '@/lib/db';
import { AffiliateDisclosure } from '@/components/AffiliateDisclosure';
import { TrackedLink } from '@/components/TrackedLink';
import { RatingBadge, RatingBars } from '@/components/PlatformRating';
import { BoldCircle, DaisyShape, HalfCircle, ZigzagLine } from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) return {};
  return {
    title: `${platform.name} Review ${new Date().getFullYear()}: Fees, Liquidity & Verdict`,
    description: `${platform.name} review — ${platform.tagline} Rated ${platform.overallRating}/5 after hands-on testing. Fees, deposits, regulation, pros and cons.`,
    alternates: { canonical: `https://predictionsmarketfans.com/platforms/${platform.slug}` },
  };
}

export default async function PlatformReviewPage({ params }: PageProps) {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) notFound();

  const settings = await getSiteSettings();
  const baseUrl = settings.siteUrl || 'https://predictionsmarketfans.com';
  const others = getPlatforms().filter((p) => p.slug !== platform.slug);

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
    author: { '@type': 'Organization', name: settings.siteName || 'Predictions Market Fans', url: baseUrl },
    publisher: { '@type': 'Organization', name: settings.siteName || 'Predictions Market Fans', url: baseUrl },
    url: `${baseUrl}/platforms/${platform.slug}`,
    reviewBody: platform.verdict,
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(reviewJsonLd)}}
      />

      {/* Header band */}
      <div className="relative overflow-hidden bg-black/5 py-14">
        <BoldCircle size={130} color={platform.brandColor} className="absolute -top-10 right-[12%] opacity-60 hidden md:block" />
        <DaisyShape size={70} petalColor="#FFE642" centerColor="#FF00B8" className="absolute bottom-2 right-8 opacity-80 hidden md:block" />
        <HalfCircle size={70} color="#D9F24B" direction="right" className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <Link
            href="/platforms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-black/70 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All platforms
          </Link>
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

        {/* Review body */}
        <div className="prose prose-lg max-w-none mb-12 prose-headings:font-display prose-headings:text-ink prose-p:text-ink-secondary">
          {platform.review.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

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
