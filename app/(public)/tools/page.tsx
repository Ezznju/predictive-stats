import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeftRight,
  ChevronRight,
  Zap,
  Shield,
  Activity,
  Flame,
  BarChart3,
} from 'lucide-react';
import {
  FlowerShape,
  UShape,
  BoldCircle,
  CornerDotSquare,
} from '@/components/GeometricShapes';

export const metadata: Metadata = {
  title: 'Free Prediction Market Tools',
  description:
    'Free tools for prediction market traders — scan LP rewards on Polymarket and find cross-platform arbitrage between Polymarket and Kalshi.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools' },
  openGraph: {
    type: 'website',
    title: 'Free Prediction Market Tools',
    description:
      'Free tools for prediction market traders — scan LP rewards on Polymarket and find cross-platform arbitrage between Polymarket and Kalshi.',
    images: [{ url: '/tools/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Prediction Market Tools',
    description:
      'Free tools for prediction market traders — scan LP rewards on Polymarket and find cross-platform arbitrage between Polymarket and Kalshi.',
    images: ['/tools/og'],
  },
};

const TOOLS = [
  {
    slug: 'arbitrage-scanner',
    href: '/tools/arbitrage-scanner',
    name: 'Arbitrage Scanner',
    platform: 'Polymarket × Kalshi',
    question: 'Is anything mispriced right now, and could I actually fill it?',
    description:
      'Not the millisecond lock—the <em>persistent</em> mispricing. Real MECE partitions live; cross-venue basis illustrated.',
    icon: ArrowLeftRight,
    color: '#FF69B4',
    ctaLabel: 'OPEN SCANNER',
  },
  {
    slug: 'lp-scanner',
    href: '/tools/lp-scanner',
    name: 'LP Reward Scanner',
    platform: 'Polymarket',
    question: 'Does providing liquidity here actually pay, once hidden costs are counted?',
    description:
      '<em>A rate, not a gap</em>—so it doesn\'t decay. We strip the headline APR down to the honest net.',
    icon: TrendingUp,
    color: '#7B3FE4',
    ctaLabel: 'OPEN SCANNER',
  },
  {
    slug: 'pulse',
    href: '/pulse',
    name: 'Polymarket Whale Tracker',
    platform: 'Smart Money',
    question: 'When a big wallet moves, is it a signal worth following or just noise?',
    description:
      'Whale trades, <em>judged</em>. Conviction as a five-axis radar; skill shrunk toward the average so a thin record can\'t lie.',
    icon: Activity,
    color: '#00D395',
    ctaLabel: 'OPEN FEED',
  },
  {
    slug: 'trending-markets',
    href: '/polymarket-trending-markets',
    name: 'Trending Markets',
    platform: 'Polymarket · Live',
    question: 'Which Polymarket markets are traders piling into right now?',
    description:
      'The most active markets by 24-hour volume, <em>live</em>. Prices, liquidity and momentum — updated every minute.',
    icon: Flame,
    color: '#FF7900',
    ctaLabel: 'OPEN BOARD',
  },
  {
    slug: 'kalshi-trending-markets',
    href: '/kalshi-trending-markets',
    name: 'Kalshi Trending Markets',
    platform: 'Kalshi · Live',
    question: 'Which Kalshi markets are traders piling into right now?',
    description:
      'The most active Kalshi markets by 24-hour volume, <em>live</em>. Prices, spreads and momentum — updated every few minutes.',
    icon: BarChart3,
    color: '#00A36C',
    ctaLabel: 'OPEN BOARD',
  },
];

export default function ToolsPage() {
  return (
    <div className="relative">
      {/* Hero */}
      <div className="relative overflow-hidden bg-black/5 py-16">
        <FlowerShape
          size={90}
          color="#FF00B8"
          className="absolute -top-6 right-[15%] opacity-70 hidden md:block"
        />
        <UShape
          size={70}
          color="#4845F0"
          strokeWidth={16}
          className="absolute bottom-4 left-[8%] opacity-60 hidden md:block"
        />
        <CornerDotSquare
          size={54}
          color="#2BD96E"
          dotColor="#9D5CFF"
          className="absolute top-1/3 -right-4 opacity-80"
        />
        <BoldCircle
          size={80}
          color="#D9F24B"
          className="absolute -bottom-10 right-[40%] opacity-60"
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-secondary">Tools</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-black" />
            <h1 className="font-display font-bold text-4xl md:text-5xl text-ink">
              Free Tools
            </h1>
          </div>
          <p className="text-xl text-ink-secondary leading-relaxed max-w-2xl">
            Data-driven utilities for prediction market traders. Real-time data,
            zero cost, no signup required.
          </p>
        </div>
      </div>

      {/* Tool Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group bg-white rounded-2xl border-2 border-black p-6 shadow-pop hover:-translate-y-1 transition-transform flex flex-col"
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-black"
                  style={{ backgroundColor: `${tool.color}30` }}
                >
                  <tool.icon className="w-7 h-7" style={{ color: tool.color }} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-ink group-hover:text-black transition-colors leading-tight">
                    {tool.name}
                  </h2>
                  <p className="text-sm text-ink-muted font-medium">{tool.platform}</p>
                </div>
              </div>

              {/* This tool answers */}
              <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3 mb-4">
                <p className="text-sm font-bold text-black">
                  This tool answers: &ldquo;{tool.question}&rdquo;
                </p>
              </div>

              {/* Description */}
              <p
                className="text-sm text-ink-secondary leading-relaxed mb-4"
                dangerouslySetInnerHTML={{ __html: tool.description }}
              />

              {/* Dashed placeholder */}
              <div className="flex-1 border-2 border-dashed border-black/20 rounded-xl mb-5 min-h-[80px]" />

              {/* CTA */}
              <span className="inline-flex items-center gap-2 text-sm font-bold text-black mt-auto">
                {tool.ctaLabel}
                <span className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform">
                  <ChevronRight className="w-4 h-4" />
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-12 bg-black/5 rounded-2xl border border-black/10 p-6 flex items-start gap-4">
          <Shield className="w-5 h-5 text-ink-muted flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-display font-semibold text-sm text-ink mb-1">
              100% free &amp; transparent
            </h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Our tools pull live data directly from Polymarket and Kalshi public
              APIs. No account needed, no hidden fees. Data may be cached for
              performance. These tools are for informational purposes only and do
              not constitute financial advice.
            </p>
          </div>
        </div>

        {/* Cross-links */}
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/platforms"
            className="text-sm text-ink-secondary hover:text-black transition-colors"
          >
            Compare platforms →
          </Link>
          <Link
            href="/articles"
            className="text-sm text-ink-secondary hover:text-black transition-colors"
          >
            Read our analysis →
          </Link>
          <Link
            href="/newsletter"
            className="text-sm text-ink-secondary hover:text-black transition-colors"
          >
            Get weekly updates →
          </Link>
        </div>
      </div>
    </div>
  );
}
