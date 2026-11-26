import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo-utils';

const PAGE_URL = `${SITE_URL}/tools/kalshi-fee-calculator`;

export const metadata: Metadata = {
  title: 'Kalshi Fee & Break-Even Calculator (vs. Polymarket) — Free Tool',
  description:
    'Calculate exact Kalshi taker and maker trading fees using Kalshi’s quadratic formula 0.07 × C × P × (1 − P). See break-even win rate, round-trip fee drag, and Polymarket 0% fee savings.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Kalshi Fee & Break-Even Calculator (vs. Polymarket)',
    description:
      'Exact Kalshi taker & maker fee calculator with quadratic fee curve, break-even win probability, and side-by-side Polymarket comparison.',
    type: 'website',
    url: PAGE_URL,
    images: [{ url: '/tools/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalshi Fee & Break-Even Calculator (vs. Polymarket)',
    description:
      'Find exact Kalshi taker vs. maker fees, break-even probability, and how much you save on 0% fee venues like Polymarket.',
    images: ['/tools/og'],
  },
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Kalshi Fee & Break-Even Calculator',
  url: PAGE_URL,
  description:
    'Interactive fee and break-even win-rate calculator for Kalshi taker/maker orders compared side-by-side with Polymarket and Pronostyx.',
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
    url: SITE_URL,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Free Tools', item: `${SITE_URL}/tools` },
    { '@type': 'ListItem', position: 3, name: 'Kalshi Fee Calculator', item: PAGE_URL },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How are Kalshi trading fees calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Kalshi charges a quadratic fee rounded up to the nearest cent: Standard Taker Fee = ceil(0.07 × Contracts × P × (1 − P)) and Standard Maker Fee = ceil(0.0175 × Contracts × P × (1 − P)), where P is the contract price in dollars (e.g., 0.50 for 50¢).',
      },
    },
    {
      '@type': 'Question',
      name: 'Why are Kalshi fees highest at 50 cents?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Because P × (1 − P) reaches its maximum value of 0.25 at P = 0.50. A 50¢ contract costs 1.75¢ per contract in taker fees, whereas a 10¢ or 90¢ contract costs only 0.63¢ per contract.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do Kalshi fees compare to Polymarket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Polymarket charges 0% trading fees on standard order-book trades (only minimal Polygon network gas), while Kalshi charges per-contract trading fees that peak at 1.75¢ per contract for takers and 0.44¢ per contract for makers at 50¢.',
      },
    },
  ],
};

export default function KalshiFeeCalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(webAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd) }} />
      {children}
    </>
  );
}
