import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import Link from 'next/link';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { StatsBar } from '@/components/pulse/StatsBar';
import { WhaleFeed } from '@/components/pulse/WhaleFeed';
import { ToolShareBar } from '@/components/ToolShareBar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Polymarket Whale Tracker — Live Whale Feed',
  description:
    'Real-time whale intelligence on Polymarket. Track large trades, monitor top wallets, and spot market-moving activity as it happens.',
  alternates: { canonical: 'https://predictionsmarketfans.com/pulse' },
    openGraph: {
      type: 'website',
      title: 'Polymarket Whale Tracker — Live Whale Feed',
      description:
        'Real-time whale intelligence on Polymarket. Track large trades, monitor top wallets, and spot market-moving activity.',
      images: [{ url: '/pulse/og', width: 1200, height: 630, type: 'image/png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Polymarket Whale Tracker — Live Whale Feed',
      description:
        'Real-time whale intelligence on Polymarket. Track large trades, monitor top wallets, and spot market-moving activity.',
      images: ['/pulse/og'],
    },
  };

export default function PulsePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Polymarket Whale Tracker — Live Whale Feed',
    description:
      'Real-time whale intelligence on Polymarket. Track large trades, monitor top wallets, and spot market-moving activity.',
    url: 'https://predictionsmarketfans.com/pulse',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Predictions Market Fans',
      url: 'https://predictionsmarketfans.com',
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://predictionsmarketfans.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Polymarket Whale Tracker',
        item: 'https://predictionsmarketfans.com/pulse',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd)}}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbLd)}}
      />

      <main className="min-h-screen bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <PulseHeader
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: 'Polymarket Whale Tracker' },
            ]}
          />

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Link
                href="/pulse/leaderboard"
                className="text-xs font-bold px-3 py-1.5 rounded-full border-2 border-black bg-white shadow-pop-sm hover:-translate-y-0.5 transition-all"
              >
                Skill Leaderboard →
              </Link>
            </div>
            <ToolShareBar
              url="https://predictionsmarketfans.com/pulse"
              title="Polymarket Whale Tracker — live whale trades, graded by skill"
            />
            <StatsBar stats={null} loading={false} />
            <WhaleFeed />

            {/* Explainer: what the feed shows and how to interpret it */}
            <section className="mt-10 max-w-3xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="heading-chip bg-neon-lime" />
                <h2 className="font-display font-bold text-[24px] text-black">How to read the whale feed</h2>
              </div>
              <div className="space-y-4 text-[15px] leading-relaxed text-ink-secondary">
                <p>
                  <strong className="text-ink">What you&apos;re looking at:</strong> the largest recent trades on
                  Polymarket, pulled live from public blockchain data — every position on Polymarket is on-chain, so
                  large wallets can&apos;t hide. Each row shows the wallet, the market, the side taken, size in dollars,
                  and when the trade happened.
                </p>
                <p>
                  <strong className="text-ink">What conviction and skill scores mean:</strong> a big trade from a wallet
                  with a thin record means less than a medium trade from a wallet with 200 graded positions. The feed
                  shrinks skill scores toward the average when the sample is small, so a lucky streak can&apos;t pose as
                  expertise. <Link href="/pulse/leaderboard" className="text-ink underline font-semibold">See the skill leaderboard →</Link>
                </p>
                <p>
                  <strong className="text-ink">What the feed can&apos;t tell you:</strong> whales lose too — a large position
                  is a bet, not a prediction with a guarantee. Treat unusual size as a starting point for your own
                  research, not as a signal to copy. Nothing here is financial advice.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
