import Script from 'next/script';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { BackToTop } from '@/components/BackToTop';
import { getSiteSettings, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([
    getSiteSettings(),
    getCategories(),
  ]);

  return (
    <>
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
