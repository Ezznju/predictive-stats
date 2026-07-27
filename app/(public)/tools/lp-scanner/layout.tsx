import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LP Scanner — Live Polymarket Reward Pools',
  description:
    'Real-time Polymarket LP reward pool scanner. Sort active markets by daily reward, spread, volume, and competitiveness. Live order book depth and velocity calculator.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools/lp-scanner' },
  openGraph: {
    title: 'LP Scanner — Live Polymarket Reward Pools',
    description:
      'Real-time Polymarket LP reward pool scanner with live order book data, sorting, and velocity calculator.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LP Scanner — Live Polymarket Reward Pools',
    description:
      'Scan active Polymarket LP reward pools. Daily rewards, spreads, volume, competitiveness, and live order books.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'LP Scanner — Live Polymarket Reward Pools',
  url: 'https://predictionsmarketfans.com/tools/lp-scanner',
  description:
    'Real-time Polymarket LP reward pool scanner with live order book data and velocity calculator.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  creator: {
    '@type': 'Organization',
    name: 'Predictions Market Fans',
    url: 'https://predictionsmarketfans.com',
  },
};

export default function LPScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
