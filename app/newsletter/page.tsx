import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NewsletterBlock } from '@/components/NewsletterBlock';

export const metadata: Metadata = {
  title: 'Newsletter',
  description: 'Subscribe to The Weekly Signal — prediction market analysis, forecasting insights, and data-driven commentary delivered every Friday.',
  alternates: { canonical: '/newsletter' },
};

export default function NewsletterPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-ink mb-4">The Weekly Signal</h1>
      <p className="text-ink-secondary mb-8 leading-relaxed">
        Every Friday, we distill the week&apos;s most important prediction market movements, calibration research, and analytical commentary into a concise, signal-rich briefing. No noise. No filler. Just the analysis that matters.
      </p>

      <NewsletterBlock variant="inline" />

      <div className="mt-12 space-y-6">
        <h2 className="font-display font-bold text-xl text-ink">What you&apos;ll get</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Market Movers', desc: 'The biggest price movements across Polymarket, Kalshi, and Metaculus.' },
            { title: 'Research Digest', desc: 'New papers and studies on forecasting accuracy and calibration.' },
            { title: 'Strategy Insights', desc: 'Trading patterns, arbitrage windows, and risk management updates.' },
            { title: 'Platform Updates', desc: 'New features, regulatory changes, and market launches.' },
          ].map((item) => (
            <div key={item.title} className="p-4 bg-white rounded-xl border border-white/20 shadow-sm">
              <h3 className="font-display font-semibold text-ink text-sm">{item.title}</h3>
              <p className="text-xs text-ink-secondary mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Explore while you wait */}
      <div className="mt-12 pt-8 border-t border-white/20">
        <h2 className="font-display font-bold text-xl text-ink mb-4">Explore while you wait</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/articles" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Latest Articles <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">Read our latest prediction market analysis.</p>
          </Link>
          <Link href="/tools" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Free Tools <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">LP reward scanner &amp; arbitrage finder.</p>
          </Link>
          <Link href="/platforms" className="p-4 bg-white rounded-xl border border-white/20 shadow-sm hover:border-black/20 hover:shadow-md transition-all group">
            <h3 className="font-display font-semibold text-sm text-ink group-hover:text-black transition-colors flex items-center gap-2">Platform Reviews <ArrowRight className="w-3 h-3" /></h3>
            <p className="text-xs text-ink-secondary mt-1">Compare Polymarket, Kalshi &amp; more.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
