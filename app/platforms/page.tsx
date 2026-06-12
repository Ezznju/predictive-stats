import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, X as XIcon, ExternalLink } from 'lucide-react';
import { getPlatforms } from '@/lib/platforms';
import { getSiteSettings } from '@/lib/db';
import { AffiliateDisclosure } from '@/components/AffiliateDisclosure';
import { TrackedLink } from '@/components/TrackedLink';
import { RatingBadge } from '@/components/PlatformRating';
import {
  BoldCircle,
  FlowerShape,
  UShape,
  HalfCircle,
  CornerDotSquare,
  ArrowBanner,
  DiamondShape,
} from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Best Prediction Market Platforms Compared (Polymarket vs Kalshi & More)',
  description:
    'Independent reviews and side-by-side comparison of the top prediction market platforms — Polymarket, Kalshi, PredictIt, Manifold, and Metaculus. Fees, liquidity, regulation, and who each one is best for.',
};

export default async function PlatformsPage() {
  const [platforms, settings] = await Promise.all([getPlatforms(), getSiteSettings()]);
  const baseUrl = settings.siteUrl || 'https://predictionsmarketfans.com';

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Best Prediction Market Platforms',
    itemListElement: platforms.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${baseUrl}/platforms/${p.slug}`,
      name: p.name,
    })),
  };

  return (
    <div className="relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Header band */}
      <div className="relative overflow-hidden bg-black/5 py-16">
        <CornerDotSquare size={80} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-4 left-8 -rotate-3 hidden md:block" />
        <BoldCircle size={140} color="#4845F0" className="absolute -top-10 right-[18%] opacity-70 hidden md:block" />
        <FlowerShape size={90} color="#FF00B8" className="absolute bottom-2 right-12 opacity-80 hidden md:block" />
        <UShape size={70} color="#4845F0" strokeWidth={16} className="absolute top-6 left-[38%] opacity-80 hidden lg:block" />
        <ArrowBanner width={100} height={40} barColor="#29C5F6" className="absolute bottom-6 left-[15%] hidden lg:block" />
        <HalfCircle size={80} color="#D9F24B" direction="left" className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-ink mb-4">
            Prediction Market Platforms, Compared
          </h1>
          <p className="text-xl text-ink-secondary leading-relaxed">
            We trade on these platforms ourselves. Here&apos;s how Polymarket, Kalshi, PredictIt, Manifold,
            and Metaculus stack up on fees, liquidity, regulation, and usability — and which one fits you.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <AffiliateDisclosure className="mb-10" />

        {/* Comparison table */}
        <h2 className="font-display font-bold text-2xl text-ink mb-4">At a glance</h2>
        <div className="overflow-x-auto rounded-2xl border-2 border-black shadow-pop bg-white mb-12">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-black text-white text-left">
                <th className="px-4 py-3 font-display">Platform</th>
                <th className="px-4 py-3 font-display">Type</th>
                <th className="px-4 py-3 font-display">Fees</th>
                <th className="px-4 py-3 font-display">Regions</th>
                <th className="px-4 py-3 font-display">Rating</th>
                <th className="px-4 py-3 font-display"></th>
              </tr>
            </thead>
            <tbody>
              {platforms.map((p, i) => (
                <tr key={p.slug} className={i % 2 === 0 ? 'bg-white' : 'bg-black/5'}>
                  <td className="px-4 py-3">
                    <Link href={`/platforms/${p.slug}`} className="font-display font-bold text-ink hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-secondary">{p.type}</td>
                  <td className="px-4 py-3 text-ink-secondary">{p.fees}</td>
                  <td className="px-4 py-3 text-ink-secondary">{p.regions}</td>
                  <td className="px-4 py-3">
                    <RatingBadge rating={p.overallRating} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <TrackedLink
                      platform={p.slug}
                      ctx="hub-table"
                      className="inline-flex items-center gap-1 text-xs font-bold text-black bg-neon-cyan border-2 border-black rounded-lg px-2.5 py-1.5 shadow-pop-sm hover:-translate-y-0.5 transition-transform whitespace-nowrap"
                    >
                      Visit <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </TrackedLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Platform cards */}
        <h2 className="font-display font-bold text-2xl text-ink mb-6">The full breakdown</h2>
        <div className="space-y-8 mb-14">
          {platforms.map((p, i) => (
            <article
              key={p.slug}
              className="relative overflow-hidden bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8"
            >
              <DiamondShape size={26} color={p.brandColor} className="absolute top-5 right-5 opacity-60 hidden sm:block" />
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className="font-display font-bold text-xs text-white rounded-lg px-2.5 py-1 border-2 border-black"
                  style={{ backgroundColor: p.brandColor }}
                >
                  #{i + 1}
                </span>
                <h3 className="font-display font-bold text-2xl text-ink">
                  <Link href={`/platforms/${p.slug}`} className="hover:underline">
                    {p.name}
                  </Link>
                </h3>
                <RatingBadge rating={p.overallRating} size="sm" />
                <span className="text-xs font-medium text-ink-faint bg-black/5 rounded-lg px-2 py-1">{p.type}</span>
              </div>

              <p className="text-ink-secondary mb-5 max-w-3xl">{p.tagline}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <h4 className="font-display font-semibold text-sm text-ink mb-2">Pros</h4>
                  <ul className="space-y-1.5">
                    {p.pros.slice(0, 3).map((pro) => (
                      <li key={pro} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <Check className="w-4 h-4 text-brand-green flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-display font-semibold text-sm text-ink mb-2">Cons</h4>
                  <ul className="space-y-1.5">
                    {p.cons.slice(0, 3).map((con) => (
                      <li key={con} className="flex items-start gap-2 text-sm text-ink-secondary">
                        <XIcon className="w-4 h-4 text-brand-pink flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-sm text-ink-muted mb-5">
                <strong className="text-ink">Best for:</strong> {p.bestFor}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/platforms/${p.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-brand-yellow border-2 border-black rounded-xl px-4 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                >
                  Read full review <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <TrackedLink
                  platform={p.slug}
                  ctx="hub-card"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-neon-cyan border-2 border-black rounded-xl px-4 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                >
                  Visit {p.name} <ExternalLink className="w-4 h-4" aria-hidden="true" />
                </TrackedLink>
              </div>
            </article>
          ))}
        </div>

        {/* Methodology */}
        <div className="relative overflow-hidden bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8 mb-6">
          <FlowerShape size={60} color="#FFE642" className="absolute -bottom-4 -right-4 opacity-50" />
          <h2 className="font-display font-bold text-xl text-ink mb-3">How we rate platforms</h2>
          <p className="text-sm text-ink-secondary leading-relaxed max-w-3xl">
            Every platform is scored on five criteria — liquidity, fees &amp; costs, market variety, ease of
            use, and trust &amp; regulation — based on our own accounts, real trades, and published fee
            schedules. We re-check fees and availability when platforms change their terms. Affiliate
            partnerships never affect scores: ratings are set before any commercial relationship exists.
          </p>
        </div>

        <AffiliateDisclosure variant="compact" />
      </div>
    </div>
  );
}
