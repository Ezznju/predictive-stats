import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arbitrage Scanner — Polymarket vs Kalshi Price Comparison',
  description:
    'Spot price differences between Polymarket and Kalshi on the same prediction market events. Find cross-platform arbitrage opportunities in real time.',
  openGraph: {
    title: 'Arbitrage Scanner — Polymarket vs Kalshi',
    description:
      'Compare prices across Polymarket and Kalshi. Find arbitrage opportunities on matching prediction market events.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arbitrage Scanner — Polymarket vs Kalshi',
    description:
      'Compare prices across Polymarket and Kalshi. Find arbitrage opportunities on matching prediction market events.',
  },
  alternates: {
    canonical: 'https://predictionsmarketfans.com/tools/arbitrage-scanner',
  },
};

export default function ArbitrageScannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
