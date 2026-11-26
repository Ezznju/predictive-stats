import Script from 'next/script';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BackToTop } from '@/components/BackToTop';
import { getSiteSettings, getCategories } from '@/lib/db';
import { ldJson } from '@/lib/json-ld';
import { SITE_URL, normalizeSocialUrl } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  const baseUrl = (settings.siteUrl || SITE_URL).replace(/\/+$/, '');
  const sameAs = Array.from(
    new Set(
      [
        'https://www.youtube.com/@predictionsmarketfans',
        normalizeSocialUrl(settings.socialTwitter, 'twitter'),
        normalizeSocialUrl(settings.socialLinkedin, 'linkedin'),
        settings.socialGithub?.trim()
          ? /^https?:\/\//i.test(settings.socialGithub.trim())
            ? settings.socialGithub.trim()
            : `https://github.com/${settings.socialGithub.trim().replace(/^@/, '')}`
          : null,
      ].filter((u): u is string => Boolean(u))
    )
  );

  const knowledgeGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: settings.siteName || 'Predictions Market Fans',
        alternateName: 'PMF',
        url: baseUrl,
        description:
          settings.siteDescription ||
          'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, and platform reviews.',
        logo: {
          '@type': 'ImageObject',
          '@id': `${baseUrl}/#logo`,
          url: `${baseUrl}/apple-touch-icon.png`,
          width: 180,
          height: 180,
        },
        sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: settings.siteName || 'Predictions Market Fans',
        url: baseUrl,
        publisher: { '@id': `${baseUrl}/#organization` },
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: ldJson(knowledgeGraph) }}
      />
      {/* Accessible skip link for keyboard & screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-brand-yellow focus:text-black focus:font-display focus:font-bold focus:text-sm focus:px-4 focus:py-2 focus:rounded-xl focus:border-2 focus:border-black focus:shadow-pop-sm"
      >
        Skip to main content
      </a>

      {/* Third-party scripts — public pages only, never /admin. Loaded non-blocking via next/script. */}
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i+"?ref=bwt";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","xu1xkt8j04");`}
      </Script>
      <Script
        id="google-adsense"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4137106305154354"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />

      <Navbar siteName={settings.siteName} categories={categories} />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer settings={settings} categories={categories} />
      <BackToTop />
    </>
  );
}
