import { Metadata } from 'next';
import { BarChart3, Target, Eye, Shield } from 'lucide-react';
import { getAuthors, getSiteSettings } from '@/lib/db';
import Link from 'next/link';
import {
  FlowerShape,
    UShape,
  BoldCircle,
  DaisyShape,
  ArrowBanner,
  CornerDotSquare,
  HalfCircle,
  ConcentricRings,
} from '@/components/GeometricShapes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'About',
  description: 'Predictions Market Fans is an editorial publication covering prediction markets, forecasting, and data-driven analysis.',
};

export default async function AboutPage() {
  const [authors, settings] = await Promise.all([
    getAuthors(),
    getSiteSettings(),
  ]);

  const values = [
    { icon: Target, title: 'Calibration Over Confidence', desc: 'We track our accuracy. When we get something wrong, we say so and explain what we missed.', color: '#FF7900' },
    { icon: Eye, title: 'Show the Math', desc: 'Every claim is backed by data. We pull live API data, run calculations, and show our work.', color: '#FFBF00' },
    { icon: Shield, title: 'Editorial Independence', desc: 'We don\'t accept sponsored content that compromises our analysis. Our readers come first.', color: '#2ECC71' },
    { icon: BarChart3, title: 'Depth Over Speed', desc: 'We publish fewer articles at higher quality. Every piece goes through rigorous fact-checking.', color: '#4A6CF7' },
  ];

  return (
    <div className="relative">
      {/* Top decorative band */}
      <div className="relative overflow-hidden bg-black/5 py-16">
        <CornerDotSquare size={80} color="#2BD96E" dotColor="#9D5CFF" className="absolute top-4 left-8 -rotate-3 hidden md:block" />
        <BoldCircle size={140} color="#4845F0" className="absolute -top-10 right-[20%] opacity-70 hidden md:block" />
        <FlowerShape size={90} color="#FF00B8" className="absolute bottom-2 right-12 opacity-80 hidden md:block" />
        <UShape size={70} color="#4845F0" strokeWidth={16} className="absolute top-6 left-[35%] opacity-80 hidden lg:block" />
        <ArrowBanner width={100} height={40} barColor="#29C5F6" className="absolute bottom-6 left-[15%] hidden lg:block" />
        <HalfCircle size={80} color="#D9F24B" direction="left" className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-80 hidden md:block" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="font-display font-bold text-4xl md:text-5xl text-ink mb-4">About {settings.siteName}</h1>
          <p className="text-xl text-ink-secondary leading-relaxed">{settings.siteDescription}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="prose prose-lg max-w-none mb-16 prose-headings:font-display prose-headings:text-ink prose-p:text-ink-secondary prose-a:text-black">
          <h2>What We Cover</h2>
          <p>Predictions Market Fans covers prediction markets, probabilistic forecasting, market sentiment analysis, and data-driven commentary across politics, economics, crypto, sports, and technology. We explain how markets price uncertainty, identify mispricings, and break down the mathematics behind prediction platforms.</p>

          <h2>Our Approach</h2>
          <p>Every article starts with data. We pull live information from Polymarket, Kalshi, Metaculus, and other platforms. We run the calculations ourselves and verify the numbers before publishing. If a strategy claims a 12% return, we show the backtest. If a market price implies a probability, we explain the conversion math.</p>
          <p>We stress-test workflows rather than summarizing press releases. When we review a platform, we use it. When we write about a trading strategy, we model it. When we compare forecasting methods, we pull the calibration data.</p>
        </div>

        {/* Values */}
        <div className="relative overflow-hidden mb-16">
          <DaisyShape size={50} className="absolute -top-2 -right-2 opacity-50" />
          <ConcentricRings size={60} className="absolute bottom-4 -left-4 opacity-35" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            {values.map((v) => (
              <div key={v.title} className="p-6 bg-white rounded-2xl border border-white/20 shadow-sm">
                <v.icon className="w-6 h-6 mb-3" style={{ color: v.color }} />
                <h3 className="font-display font-bold text-lg text-ink">{v.title}</h3>
                <p className="text-sm text-ink-secondary mt-2">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mb-10 relative overflow-hidden">
          <FlowerShape size={70} color="#E01FFF" className="absolute -bottom-6 -right-6 opacity-40" />
          <h2 className="font-display font-bold text-2xl text-ink mb-6">The Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {authors.map((author) => (
              <Link key={author.id} href={`/author/${author.slug}`} className="p-6 bg-white rounded-2xl border border-white/20 hover:border-black/20 hover:shadow-md transition-all group">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-display font-bold text-ink group-hover:text-black transition-colors">{author.name}</h3>
                <p className="text-xs text-black mt-1">{author.title}</p>
                <p className="text-sm text-ink-secondary mt-3 line-clamp-3">{author.bio}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
