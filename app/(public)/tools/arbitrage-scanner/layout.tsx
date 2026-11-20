import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polymarket × Kalshi Arbitrage Scanner & Calculator — Live Spreads',
  description:
    'Free live Polymarket and Kalshi arbitrage scanner and calculator. Find cross-platform mispricings with real order-book depth, net-of-fee profit math, and instant execution plans.',
  openGraph: {
    title: 'Polymarket × Kalshi Arbitrage Scanner & Calculator — Live Spreads',
    description:
      'Free live Polymarket and Kalshi arbitrage scanner and calculator. Find cross-platform mispricings net of fees and slippage.',
    type: 'website',
    url: 'https://predictionsmarketfans.com/tools/arbitrage-scanner',
    images: [{ url: '/tools/arbitrage-scanner/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polymarket × Kalshi Arbitrage Scanner & Calculator — Live Spreads',
    description:
      'Free live Polymarket and Kalshi arbitrage scanner and calculator. Find cross-platform mispricings net of fees and slippage.',
    images: ['/tools/arbitrage-scanner/og'],
  },
  alternates: {
    canonical: 'https://predictionsmarketfans.com/tools/arbitrage-scanner',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Polymarket × Kalshi Arbitrage Scanner',
  url: 'https://predictionsmarketfans.com/tools/arbitrage-scanner',
  description:
    'Free live arbitrage scanner comparing Polymarket and Kalshi prices on matching prediction market events, with execution plans net of fees and slippage.',
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

export default function ArbitrageScannerLayout({
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
