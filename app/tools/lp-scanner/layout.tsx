import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polymarket LP Reward Scanner — Find the Best Liquidity Farming Opportunities',
  description:
    'Free live scanner that finds the most profitable Polymarket liquidity-provider reward farming opportunities. See daily rewards, competition, entry costs, and order book depth — updated every 5 minutes.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools/lp-scanner' },
  openGraph: {
    title: 'Polymarket LP Reward Scanner',
    description:
      'Find the best Polymarket LP reward farming opportunities. Live data, sorted by profitability.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Polymarket LP Reward Scanner',
    description:
      'Free tool: scan every Polymarket reward market and find the best LP farming opportunities.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Polymarket LP Reward Scanner',
  url: 'https://predictionsmarketfans.com/tools/lp-scanner',
  description:
    'Free live scanner that finds the most profitable Polymarket liquidity-provider reward farming opportunities.',
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
