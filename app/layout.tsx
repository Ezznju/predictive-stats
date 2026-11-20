import type { Metadata } from 'next';
import { Inter, Sora, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

export const runtime = 'edge';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const SITE_URL = 'https://predictionsmarketfans.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Predictions Market Fans — Polymarket & Kalshi Analysis, Tools & Live Data',
    template: '%s | Predictions Market Fans',
  },
  description:
    'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, LP reward yields, and platform reviews.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-48x48.png', type: 'image/png', sizes: '48x48' },
      { url: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Predictions Market Fans',
    title: 'Predictions Market Fans — Polymarket & Kalshi Analysis, Tools & Live Data',
    description:
      'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, LP reward yields, and platform reviews.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Predictions Market Fans — Polymarket & Kalshi Analysis, Tools & Live Data',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Predictions Market Fans — Polymarket & Kalshi Analysis, Tools & Live Data',
    description:
      'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, LP reward yields, and platform reviews.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  other: {
    'google-adsense-account': 'ca-pub-4137106305154354',
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const knowledgeGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'Predictions Market Fans',
        alternateName: 'PMF',
        url: SITE_URL,
        description:
          'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, and platform reviews.',
        logo: {
          '@type': 'ImageObject',
          '@id': `${SITE_URL}/#logo`,
          url: `${SITE_URL}/apple-touch-icon.png`,
          width: 180,
          height: 180,
        },
        sameAs: ['https://www.youtube.com/@predictionsmarketfans'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'Predictions Market Fans',
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${ibmPlexMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(knowledgeGraph),
          }}
        />
        {/* NOTE: third-party scripts (Clarity, AdSense) live in
            app/(public)/layout.tsx so they never load inside /admin. */}
      </head>
      <body className="font-body min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
