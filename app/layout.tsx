import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

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

export const metadata: Metadata = {
  metadataBase: new URL('https://predictionsmarketfans.com'),
  title: {
    default: 'PMF — Sharp analysis for uncertain markets',
    template: '%s | PMF',
  },
  description: 'Sharp analysis for prediction markets. Covering Polymarket, Kalshi, Metaculus, and more.',
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
    url: 'https://predictionsmarketfans.com',
    siteName: 'Predictions Market Fans',
    title: 'PMF — Sharp analysis for uncertain markets',
    description: 'Sharp analysis for prediction markets. Covering Polymarket, Kalshi, Metaculus, and more.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Predictions Market Fans — Sharp analysis for uncertain markets',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PMF — Sharp analysis for uncertain markets',
    description: 'Sharp analysis for prediction markets. Covering Polymarket, Kalshi, Metaculus, and more.',
    images: ['/twitter-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Predictions Market Fans',
              url: 'https://predictionsmarketfans.com',
              description: 'Sharp analysis for prediction markets.',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Predictions Market Fans',
              url: 'https://predictionsmarketfans.com',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://predictionsmarketfans.com/search?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* NOTE: third-party scripts (Clarity, AdSense) live in
            app/(public)/layout.tsx so they never load inside /admin. */}
      </head>
      <body className="font-body min-h-screen flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
