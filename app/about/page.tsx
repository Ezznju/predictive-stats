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
    { icon: Target, title: 'Calibration Over Confidence', desc: 'We track our accuracy. When we get something wrong, we say so and explain what we missed.', color: '#FF2D2D' },
    { icon: Eye, title: 'Show the Math', desc: 'Every claim is backed by data. We pull live API data, run calculations, and show our work.', color: '#FFD60A' },
    { icon: Shield, title: 'Editorial Independence', desc: 'We don\'t accept sponsored content that compromises our analysis. Our readers come first.', color: '#00E676' },
    { icon: BarChart3, title: 'Depth Over Speed', desc: 'We publish fewer articles at higher quality. Every piece goes through rigorous fact-checking.', color: '#00D4FF' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">About {siteSettings.siteName}</h1>
      <p className="text-xl text-slate-400 leading-relaxed mb-10">{siteSettings.siteDescription}</p>

      <div className="prose prose-invert prose-lg max-w-none mb-16">
        <h2 className="font-display">What We Cover</h2>
        <p>PredictaView covers prediction markets, probabilistic forecasting, market sentiment analysis, and data-driven commentary across politics, economics, crypto, sports, and technology. We explain how markets price uncertainty, identify mispricings, and break down the mathematics behind prediction platforms.</p>

        <h2 className="font-display">Our Approach</h2>
        <p>Every article starts with data. We pull live information from Polymarket, Kalshi, Metaculus, and other platforms. We run the calculations ourselves and verify the numbers before publishing. If a strategy claims a 12% return, we show the backtest. If a market price implies a probability, we explain the conversion math.</p>
        <p>We stress-test workflows rather than summarizing press releases. When we review a platform, we use it. When we write about a trading strategy, we model it. When we compare forecasting methods, we pull the calibration data.</p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {values.map((v) => (
          <div key={v.title} className="p-6 bg-surface-raised rounded-xl border border-surface-border">
            <v.icon className="w-6 h-6 mb-3" style={{ color: v.color }} />
            <h3 className="font-display font-bold text-lg text-white">{v.title}</h3>
            <p className="text-sm text-slate-400 mt-2">{v.desc}</p>
          </div>
        ))}
      </div>

      {/* Team */}
      <div className="mb-10">
        <h2 className="font-display font-bold text-2xl text-white mb-6">The Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {authors.map((author) => (
            <Link key={author.id} href={`/author/${author.slug}`} className="p-6 bg-surface-raised rounded-xl border border-surface-border hover:border-brand-red/30 transition-all group">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-4">
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-display font-bold text-white group-hover:text-brand-red transition-colors">{author.name}</h3>
              <p className="text-xs text-brand-yellow mt-1">{author.title}</p>
              <p className="text-sm text-slate-400 mt-3 line-clamp-3">{author.bio}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
