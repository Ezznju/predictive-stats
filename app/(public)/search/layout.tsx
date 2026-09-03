import type { Metadata } from 'next';

// Internal search UI — useful for visitors, thin for crawlers.
// Keep it out of the index (but follow its links to articles).
export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: true },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
