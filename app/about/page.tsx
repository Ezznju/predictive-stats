import { Metadata } from 'next';
import { BarChart3, Target, Eye, Shield } from 'lucide-react';
import { authors, siteSettings } from '@/lib/data';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'PredictaView is an editorial publication covering prediction markets, forecasting, and data-driven analysis.',
};

export default function AboutPage() {
  const values = [
    { icon: Target, title: 'Calibration Over Confidence', desc: 'We track our accuracy. When we get something wrong, we say so and explain what we missed.', color: '#FF7900' },
    { icon: Eye, title: 'Show the Math', desc: 'Every claim is backed by data. We pull live API data, run calculations, and show our work.', color: '#FFBF00' },
    { icon: Shield, title: 'Editorial Independence', desc: 'We don\'t accept sponsored content that compromises our analysis. Our readers come first.', color: '#2ECC71' },
    { icon: BarChart3, title: 'Depth Over Speed', desc: 'We publish fewer articles at higher quality. Every piece goes through rigorous fact-checking.', color: '#4A6CF7' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl md:text-5xl text-ink mb-4">About {siteSettings.siteName}</h1>
      <p className="text-xl text-ink-secondary leading-relaxed mb-10">{siteSettings.siteDescription}</p>

      <div className="prose prose-lg max-w-none mb-16 prose-headings:font-display prose-headings:text-ink prose-p:text-ink-secondary prose-a:text-brand-orange">
        <h2>What We Cover</h2>
        <p>PredictaView covers prediction markets, probabilistic forecasting, market sentiment analysis, and data-driven commentary across politics, economics, crypto, sports, and technology. We explain how markets price uncertainty, identify mispricings, and break down the mathematics behind prediction platforms.</p>

        <h2>Our Approach</h2>
        <p>Every article starts with data. We pull live information from Polymarket, Kalshi, Metaculus, and other platforms. We run the calculations ourselves and verify the numbers before publishing. If a strategy claims a 12% return, we show the backtest. If a market price implies a probability, we explain the conversion math.</p>
        <p>We stress-test workflows rather than summarizing press releases. When we review a platform, we use it. When we write about a trading strategy, we model it. When we compare forecasting methods, we pull the calibration data.</p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {values.map((v) => (
          <div key={v.title} className="p-6 bg-surface-raised rounded-2xl border border-surface-border shadow-sm">
            <v.icon className="w-6 h-6 mb-3" style={{ color: v.color }} />
            <h3 className="font-display font-bold text-lg text-ink">{v.title}</h3>
            <p className="text-sm text-ink-secondary mt-2">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div className="mb-10">
        <h2 className="font-display font-bold text-2xl text-ink mb-6">The Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {authors.map((author) => (
            <Link key={author.id} href={`/author/${author.slug}`} className="p-6 bg-surface-raised rounded-2xl border border-surface-border hover:border-brand-amber/40 hover:shadow-md transition-all group">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-display font-bold text-ink group-hover:text-brand-orange transition-colors">{author.name}</h3>
              <p className="text-xs text-brand-amber mt-1">{author.title}</p>
              <p className="text-sm text-ink-secondary mt-3 line-clamp-3">{author.bio}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
