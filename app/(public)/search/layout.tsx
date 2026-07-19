import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search',
  description:
    'Search all Predictions Market Fans articles on prediction markets, forecasting, and probabilistic analysis.',
  alternates: { canonical: '/search' },
  robots: { index: true, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
