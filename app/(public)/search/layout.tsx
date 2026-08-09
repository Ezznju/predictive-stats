import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search all Predictions Market Fans articles on prediction markets, forecasting, and probabilistic analysis.',
  alternates: { canonical: 'https://predictionsmarketfans.com/search' },
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
