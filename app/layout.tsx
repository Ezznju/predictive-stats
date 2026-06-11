import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { siteSettings } from '@/lib/data';

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

export const metadata: Metadata = {
  metadataBase: new URL(siteSettings.siteUrl),
  title: {
    default: `${siteSettings.siteName} — ${siteSettings.siteTagline}`,
    template: `%s | ${siteSettings.siteName}`,
  },
  description: siteSettings.siteDescription,
  openGraph: {
    type: 'website',
    siteName: siteSettings.siteName,
    title: `${siteSettings.siteName} — ${siteSettings.siteTagline}`,
    description: siteSettings.siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteSettings.siteName} — ${siteSettings.siteTagline}`,
    description: siteSettings.siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
              name: siteSettings.siteName,
              url: siteSettings.siteUrl,
              description: siteSettings.siteDescription,
              sameAs: [siteSettings.socialTwitter, siteSettings.socialLinkedin],
            }),
          }}
        />
      </head>
      <body className="font-body min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
