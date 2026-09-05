import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polymarket LP Reward Scanner — Live APR, Net of Fees',
  description:
    'Free Polymarket LP reward scanner. Sort active reward pools by realistic APR net of fees and competition, with live spreads, volume, and order book depth.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools/lp-scanner' },
  openGraph: {
    title: 'Polymarket LP Reward Scanner — Live APR, Net of Fees',
    description:
      'Real-time Polymarket LP reward pool scanner with live order book data, sorting, and velocity calculator.',
    type: 'website',
    images: [{ url: '/tools/lp-scanner/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polymarket LP Reward Scanner — Live APR, Net of Fees',
    description:
      'Scan active Polymarket LP reward pools. Daily rewards, spreads, volume, competitiveness, and live order books.',
    images: ['/tools/lp-scanner/og'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Polymarket LP Reward Scanner',
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
        dangerouslySetInnerHTML={{ __html: ldJson(jsonLd)}}
      />
      {children}
    </>
  );
}
