import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import { SITE_URL } from '@/lib/seo-utils';

const PAGE_URL = `${SITE_URL}/tools/kalshi-combo-calculator`;

export const metadata: Metadata = {
  title: 'Kalshi Combo Payout & Blue Arrow (DNP) Calculator — Free Tool',
  description:
    'Free Kalshi combo parlay payout calculator. Calculate multi-leg combo odds, Kalshi fees, net profit, and simulate how a Blue Arrow / DNP scalar settlement changes your payout.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Kalshi Combo Payout & Blue Arrow (DNP) Calculator',
    description:
      'Model 2 to 5 leg Kalshi combo payouts, net-of-fee profit, and Blue Arrow / DNP intermediate scalar settlements instantly.',
    type: 'website',
    url: PAGE_URL,
    images: [{ url: '/tools/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalshi Combo Payout & Blue Arrow (DNP) Calculator',
    description:
      'Simulate Kalshi combo payouts, fees, and Blue Arrow / DNP scalar settlements side-by-side against sportsbook voids.',
    images: ['/tools/og'],
  },
};

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Kalshi Combo Payout & Blue Arrow Simulator',
  url: PAGE_URL,
  description:
    'Free interactive calculator for Kalshi combo payouts, trading fees, and Blue Arrow / DNP intermediate scalar settlements.',
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
    { '@type': 'ListItem', position: 3, name: 'Kalshi Combo Calculator', item: PAGE_URL },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How are Kalshi combo payouts calculated?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each Kalshi combo contract pays $1.00 if every leg settles at YES ($1.00) and $0.00 if any leg settles at NO ($0.00). Your gross payout equals the number of contracts multiplied by the product of each leg settlement value, minus Kalshi trading fees.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does a Blue Arrow or Blue Shield mean on a Kalshi combo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Blue Arrow or Blue Shield indicates that a leg did not resolve cleanly to $1.00 or $0.00 (for example, a player DNP or voided prop) and instead settled at an intermediate scalar value between $0.01 and $0.99. Unlike traditional sportsbooks that void the leg and re-price your remaining parlay legs, Kalshi multiplies your final combo payout per contract by that scalar settlement price.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can you lose money on a Kalshi combo even when all your other legs win?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. If one leg settles at a low scalar value (for instance $0.10 after a player injury or late scratch) while your combo cost $0.15 per contract, your final payout per contract is $0.10 even if every other leg wins, resulting in a net loss.',
      },
    },
  ],
};

export default function KalshiComboCalculatorLayout({
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
