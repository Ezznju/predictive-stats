import { Metadata } from 'next';
import { BarChart3, Target, Eye, Shield, ChevronRight } from 'lucide-react';
import { getAuthors, getSiteSettings } from '@/lib/db';
import { ldJson } from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo-utils';
import Link from 'next/link';
import {
  FlowerShape,
  BoldCircle,
  CornerDotSquare,
  HalfCircle,
} from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About Predictions Market Fans',
  description:
    'Predictions Market Fans is an independent editorial publication covering prediction markets, Polymarket, Kalshi, forecasting, and data-driven analysis.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/about`,
    title: 'About Predictions Market Fans',
    description:
      'Independent editorial publication covering prediction markets, forecasting, and data-driven analysis.',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Predictions Market Fans',
    description:
      'Independent editorial publication covering prediction markets, forecasting, and data-driven analysis.',
    images: ['/twitter-image'],
  },
};

export default async function AboutPage() {
  const [authors, settings] = await Promise.all([
    getAuthors(),
    getSiteSettings(),
  ]);

  const values = [
    { icon: Target, title: 'Calibration Over Confidence', desc: 'We track our accuracy. When we get something wrong, we say so and explain what we missed.', color: '#FF7900' },
    { icon: Eye, title: 'Show the Math', desc: 'Every claim is backed by data. We pull live API data, run calculations, and show our work.', color: '#FFBF00' },
    { icon: Shield, title: 'Editorial Independence', desc: "We don't accept sponsored content that compromises our analysis. Our readers come first.", color: '#2ECC71' },
    { icon: BarChart3, title: 'Depth Over Speed', desc: 'We publish fewer articles at higher quality. Every piece goes through rigorous fact-checking.', color: '#4A6CF7' },
  ];

  const baseUrl = (settings.siteUrl || SITE_URL).replace(/\/+$/, '');
  const aboutJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${settings.siteName || 'Predictions Market Fans'}`,
    url: `${baseUrl}/about`,
    description: settings.siteDescription,
    mainEntity: { '@id': `${baseUrl}/#organization` },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'About', item: `${baseUrl}/about` },
    ],
  };

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(aboutJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />

      {/* Top decorative band */}
      <div className="relative overflow-hidden bg-black/5 py-14 sm:py-16 border-b-2 border-black">
        <CornerDotSquare size={72} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-6 left-6 -rotate-3 opacity-50 hidden lg:block pointer-events-none" />
        <BoldCircle size={120} color="#4845F0" className="absolute -top-10 right-[14%] opacity-45 hidden md:block pointer-events-none" />
        <FlowerShape size={80} color="#FF00B8" className="absolute bottom-2 right-10 opacity-50 hidden md:block pointer-events-none" />
        <HalfCircle size={72} color="#D9F24B" direction="left" className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-50 hidden md:block pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-5">
            <Link href="/" className="hover:text-black hover:underline transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
            <span className="text-black font-bold">About</span>
          </nav>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-ink mb-4">About {settings.siteName}</h1>
          <p className="text-lg sm:text-xl text-black/85 font-medium leading-relaxed max-w-2xl">{settings.siteDescription}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* White reading sheet for long-form editorial copy */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-pop-lg p-6 sm:p-10">
          <div className="prose prose-lg max-w-[66ch] mx-auto prose-headings:font-display prose-headings:font-bold prose-headings:text-ink prose-p:text-ink-secondary prose-p:leading-relaxed prose-a:text-black prose-a:underline prose-a:decoration-brand-orange prose-a:decoration-2 prose-a:underline-offset-4">
            <h2>What We Cover</h2>
            <p>
              Predictions Market Fans covers prediction markets, probabilistic forecasting, market sentiment analysis, and data-driven commentary across politics, economics, crypto, sports, and technology. We explain how markets price uncertainty, identify mispricings, and break down the mathematics behind prediction platforms. Explore our <Link href="/platforms">platform reviews</Link> or browse all <Link href="/articles">articles</Link>.
            </p>

            <h2>Our Approach</h2>
            <p>
              Every article starts with data. We pull live information from <Link href="/platforms/polymarket">Polymarket</Link>, <Link href="/platforms/kalshi">Kalshi</Link>, Metaculus, and other platforms. We run the calculations ourselves and verify the numbers before publishing. If a strategy claims a 12% return, we show the backtest. If a market price implies a probability, we explain the conversion math.
            </p>
            <p>
              We stress-test workflows rather than summarizing press releases. When we review a platform, we use it. When we write about a trading strategy, we model it. When we compare forecasting methods, we pull the calibration data. Try our free <Link href="/tools/lp-scanner">LP Reward Scanner</Link> and <Link href="/tools/arbitrage-scanner">Arbitrage Scanner</Link> to see this approach in action.
            </p>
          </div>
        </div>

        {/* Values */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="heading-chip bg-neon-cyan" />
            <h2 className="font-display font-bold text-2xl text-ink">Our Editorial Standards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v) => (
              <div key={v.title} className="p-6 bg-white rounded-2xl border-2 border-black shadow-pop">
                <div className="w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center mb-3" style={{ backgroundColor: `${v.color}26` }}>
                  <v.icon className="w-5 h-5 text-black" aria-hidden="true" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink">{v.title}</h3>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="heading-chip bg-neon-green" />
            <h2 className="font-display font-bold text-2xl text-ink">The Team</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {authors.map((author) => (
              <Link
                key={author.id}
                href={`/author/${author.slug}`}
                className="p-6 bg-white rounded-2xl border-2 border-black shadow-pop hover:-translate-y-0.5 hover:shadow-pop-lg transition-all group"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={author.avatar}
                    alt={author.name}
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display font-bold text-ink group-hover:text-brand-orange transition-colors">{author.name}</h3>
                <p className="text-xs font-semibold text-ink-muted mt-1">{author.title}</p>
                <p className="text-sm text-ink-secondary mt-3 line-clamp-3 leading-relaxed">
                  {author.bio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
