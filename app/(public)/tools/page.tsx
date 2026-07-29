import { Metadata } from 'next';
import Link from 'next/link';
import {
  TrendingUp,
  ArrowLeftRight,
  ChevronRight,
  Zap,
  BarChart3,
  Shield,
  Activity,
} from 'lucide-react';
import {
  FlowerShape,
  UShape,
  BoldCircle,
  CornerDotSquare,
  DaisyShape,
} from '@/components/GeometricShapes';

export const metadata: Metadata = {
  title: 'Free Prediction Market Tools',
  description:
    'Free tools for prediction market traders — scan LP rewards on Polymarket and find cross-platform arbitrage between Polymarket and Kalshi.',
  alternates: { canonical: 'https://predictionsmarketfans.com/tools' },
};

const TOOLS = [
  {
    slug: 'lp-scanner',
    href: '/tools/lp-scanner',
    name: 'LP Reward Scanner',
    tagline: 'Find the highest-paying liquidity provider rewards on Polymarket',
    description:
      'Scans every active Polymarket market in real time. See daily reward rates, annual yield estimates, and spread metrics — sorted to surface the best LP farming opportunities right now.',
    icon: TrendingUp,
    color: '#7B3FE4',
    highlights: [
      'Real-time Polymarket LP reward data',
      'Daily & annualised yield estimates',
      'Spread and volume metrics',
      'Sort & filter by reward rate',
    ],
  },
  {
    slug: 'arbitrage-scanner',
    href: '/tools/arbitrage-scanner',
    name: 'Arbitrage Scanner',
    tagline: 'Spot price gaps between Polymarket and Kalshi',
    description:
      'Compares YES/NO prices across Polymarket and Kalshi for matched events. Highlights exploitable arbitrage spreads so you can buy cheap on one platform and sell dear on another.',
    icon: ArrowLeftRight,
    color: '#00D395',
    highlights: [
      'Cross-platform price comparison',
      'Arbitrage % calculation',
      'Match quality scoring',
      'Links to both platforms',
    ],
  },
  {
    slug: 'pulse',
    href: '/pulse',
    name: 'Prediction Pulse',
    tagline: 'Real-time whale intelligence across prediction markets',
    description:
      'Track whale trades, monitor top wallets, and spot market-moving activity across Polymarket. Live leaderboard data, wallet intelligence scores, and anomaly detection.',
    icon: Activity,
    color: '#D9F24B',
    highlights: [
      'Live whale trade feed',
      'Top trader leaderboard',
      'Wallet intelligence scores',
      'Market whale activity',
    ],
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
        <DaisyShape
          size={60}
          className="absolute -top-4 -right-4 opacity-40 hidden md:block"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group bg-white rounded-2xl border-2 border-black p-6 shadow-pop hover:-translate-y-1 transition-transform"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${tool.color}20` }}
              >
                <tool.icon className="w-6 h-6" style={{ color: tool.color }} />
              </div>
              <h2 className="font-display font-bold text-xl text-ink group-hover:text-black transition-colors mb-1">
                {tool.name}
              </h2>
              <p className="text-sm text-ink-muted font-medium mb-3">
                {tool.tagline}
              </p>
              <p className="text-sm text-ink-secondary leading-relaxed mb-4">
                {tool.description}
              </p>
              <ul className="space-y-1.5 mb-5">
                {tool.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-xs text-ink-secondary"
                  >
                    <BarChart3 className="w-3 h-3 flex-shrink-0" style={{ color: tool.color }} />
                    {h}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-black">
                Launch tool <ChevronRight className="w-4 h-4" />
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
