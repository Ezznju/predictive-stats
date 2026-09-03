import { Metadata } from 'next';
import Link from 'next/link';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { StatsBar } from '@/components/pulse/StatsBar';
import { WhaleFeed } from '@/components/pulse/WhaleFeed';

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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polymarket Whale Tracker — Live Whale Feed',
    description:
      'Real-time whale intelligence on Polymarket. Track large trades, monitor top wallets, and spot market-moving activity.',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
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
            <StatsBar stats={null} loading={false} />
            <WhaleFeed />
          </div>
        </div>
      </main>
    </>
  );
}
