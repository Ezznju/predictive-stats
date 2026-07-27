import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SIDE·TWO — Esports Second-Half LP Desk',
  description:
    'Live esports LP desk: track maker decay, pool share, and the second-half window across CS2, Valorant, LoL, and Dota 2 markets. Velocity calculator, playbook, and real-time simulation.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools/lp-scanner' },
  openGraph: {
    title: 'SIDE·TWO — Esports Second-Half LP Desk',
    description:
      'Track the esports LP lifecycle: maker decay, pool share, and the second-half window. Velocity calculator and live simulation.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIDE·TWO — Esports Second-Half LP Desk',
    description:
      'Live esports LP desk with maker decay tracking, velocity calculator, and second-half playbook.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SIDE·TWO — Esports Second-Half LP Desk',
  url: 'https://predictionsmarketfans.com/tools/lp-scanner',
  description:
    'Live esports LP desk: track maker decay, pool share, and the second-half window across CS2, Valorant, LoL, and Dota 2 markets.',
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
