import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteSettings, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(settings.siteUrl || 'https://predictive-stats.vercel.app'),
    title: {
      default: `${settings.siteName} — ${settings.siteTagline}`,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.siteDescription,
    openGraph: {
      type: 'website',
      siteName: settings.siteName,
      title: `${settings.siteName} — ${settings.siteTagline}`,
      description: settings.siteDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${settings.siteName} — ${settings.siteTagline}`,
      description: settings.siteDescription,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: settings.siteName,
              url: settings.siteUrl,
              description: settings.siteDescription,
              sameAs: [settings.socialTwitter, settings.socialLinkedin].filter(Boolean),
            }),
          }}
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <Navbar siteName={settings.siteName} categories={categories} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} categories={categories} />
        <Analytics />
      </body>
    </html>
  );
}
