import { Metadata } from 'next';
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
    </div>
  );
}
