import { Metadata } from 'next';
import { PulseHeader } from '@/components/pulse/PulseHeader';
import { StatsBar } from '@/components/pulse/StatsBar';
import { WhaleFeed } from '@/components/pulse/WhaleFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Prediction Pulse — Live Whale Tracker',
  description:
    'Real-time whale intelligence across Polymarket and Kalshi. Track large trades, monitor top wallets, and spot market-moving activity as it happens.',
  alternates: { canonical: '/pulse' },
  openGraph: {
    type: 'website',
    title: 'Prediction Pulse — Live Whale Tracker',
    description:
      'Real-time whale intelligence across prediction markets. Track large trades, monitor top wallets, and spot market-moving activity.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prediction Pulse — Live Whale Tracker',
    description:
      'Real-time whale intelligence across prediction markets.',
  },
};

export default function PulsePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Prediction Pulse — Live Whale Tracker',
    description:
      'Real-time whale intelligence across prediction markets. Track large trades, monitor top wallets, and spot market-moving activity.',
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
        name: 'Prediction Pulse',
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
              { label: 'Prediction Pulse' },
            ]}
          />

          <div className="space-y-6">
            <StatsBar stats={null} loading={false} />
            <WhaleFeed />
          </div>
        </div>
      </main>
    </>
  );
}
