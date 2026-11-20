import { Metadata } from 'next';
import { ldJson } from '@/lib/json-ld';
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
  DollarSign,
} from 'lucide-react';
import {
  FlowerShape,
  UShape,
  BoldCircle,
  CornerDotSquare,
} from '@/components/GeometricShapes';
import { SITE_URL } from '@/lib/seo-utils';

export const metadata: Metadata = {
  title: 'Free Prediction Market Tools — Polymarket & Kalshi Scanners',
  description:
    'Free live tools for prediction market traders — scan Polymarket LP rewards, find Polymarket × Kalshi arbitrage, track whale wallets, and monitor trending markets.',
  alternates: { canonical: `${SITE_URL}/tools` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/tools`,
    title: 'Free Prediction Market Tools — Polymarket & Kalshi Scanners',
    description:
      'Free live tools for prediction market traders — scan Polymarket LP rewards, find Polymarket × Kalshi arbitrage, track whale wallets, and monitor trending markets.',
    images: [{ url: '/tools/og', width: 1200, height: 630, type: 'image/png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Prediction Market Tools — Polymarket & Kalshi Scanners',
    description:
      'Free live tools for prediction market traders — scan Polymarket LP rewards, find Polymarket × Kalshi arbitrage, track whale wallets, and monitor trending markets.',
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
      'Spot persistent cross-platform mispricings with real order-book depth and execution plans net of fees and slippage.',
    highlights: ['Live order-book depth', 'Net-of-fee profit math', 'CSV export'],
    icon: ArrowLeftRight,
    color: '#FF00B8',
    ctaLabel: 'OPEN SCANNER',
  },
  {
    slug: 'lp-scanner',
    href: '/tools/lp-scanner',
    name: 'LP Reward Scanner',
    platform: 'Polymarket',
    question: 'Does providing liquidity here actually pay, once hidden costs are counted?',
    description:
      'We strip headline APR down to realistic net yield—ranked by daily reward pool, competition, and minimum capital.',
    highlights: ['Realistic net APR', 'Live spread & min size', 'Velocity calculator'],
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
      'Real-time whale trades graded by historical wallet skill, win rate, P&L, and conviction—not raw size alone.',
    highlights: ['Skill-graded wallets', 'Live whale feed', 'Leaderboard'],
    icon: Activity,
    color: '#2BD96E',
    ctaLabel: 'OPEN FEED',
  },
  {
    slug: 'trending-markets',
    href: '/polymarket-trending-markets',
    name: 'Polymarket Trending',
    platform: 'Polymarket · Live',
    question: 'Which Polymarket markets are traders piling into right now?',
    description:
      'The most active Polymarket contracts ranked purely by 24-hour volume, with live YES/NO odds, liquidity, and 24h movers.',
    highlights: ['Top 25 by 24h volume', 'Biggest daily movers', 'No signup'],
    icon: Flame,
    color: '#FF7900',
    ctaLabel: 'OPEN BOARD',
  },
  {
    slug: 'kalshi-trending',
    href: '/kalshi-trending-markets',
    name: 'Kalshi Trending',
    platform: 'Kalshi · Live',
    question: 'Which Kalshi markets are seeing the heaviest trading today?',
    description:
      'Live board of Kalshi’s most active regulated event contracts ranked by 24-hour volume, spreads, and time to expiration.',
    highlights: ['Top 25 Kalshi markets', 'Live bid/ask spreads', 'Expiry countdown'],
    icon: BarChart3,
    color: '#29C5F6',
    ctaLabel: 'OPEN BOARD',
  },
  {
    slug: 'kalshi-smart-money',
    href: '/kalshi-smart-money',
    name: 'Kalshi Smart Money',
    platform: 'Kalshi · Live',
    question: 'Where is serious capital resting in the Kalshi order book right now?',
    description:
      'Track large resting order-book walls, biggest 24h momentum shifts, and high-stakes contracts expiring this week.',
    highlights: ['Order-book walls', '24h momentum moves', 'Decision week'],
    icon: DollarSign,
    color: '#00A36C',
    ctaLabel: 'OPEN SIGNALS',
  },
];

export default function ToolsPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Free Prediction Market Tools',
    url: `${SITE_URL}/tools`,
    description: 'Free live utilities and scanners for Polymarket and Kalshi traders.',
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: TOOLS.length,
      itemListElement: TOOLS.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${t.href}`,
        name: t.name,
      })),
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Free Tools', item: `${SITE_URL}/tools` },
    ],
  };

  return (
    <div className="relative">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />

      {/* Hero */}
      <div className="relative overflow-hidden bg-black/5 py-14 sm:py-16 border-b-2 border-black">
        <FlowerShape
          size={90}
          color="#FF00B8"
          className="absolute -top-6 right-[12%] opacity-50 hidden md:block pointer-events-none"
        />
        <UShape
          size={70}
          color="#4845F0"
          strokeWidth={16}
          className="absolute bottom-4 left-[4%] opacity-45 hidden md:block pointer-events-none"
        />
        <CornerDotSquare
          size={54}
          color="#2BD96E"
          dotColor="#9D5CFF"
          className="absolute top-1/3 -right-4 opacity-60 pointer-events-none"
        />
        <BoldCircle
          size={80}
          color="#D9F24B"
          className="absolute -bottom-10 right-[38%] opacity-45 pointer-events-none"
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-5">
            <Link href="/" className="hover:text-black hover:underline transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
            <span className="text-black font-bold">Tools</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-7 h-7 text-black" aria-hidden="true" />
            <h1 className="font-display font-extrabold text-4xl md:text-5xl text-ink">
              Free Tools
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-black/85 font-medium leading-relaxed max-w-2xl">
            Data-driven utilities for prediction market traders. Real-time data,
            zero cost, no signup required.
          </p>
        </div>
      </div>

      {/* Tool Cards — balanced 3x2 grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TOOLS.map((tool) => (
            <Link
              key={tool.slug}
              href={tool.href}
              className="group bg-white rounded-2xl border-2 border-black p-6 shadow-pop hover:-translate-y-1 hover:shadow-pop-lg transition-all flex flex-col"
            >
              {/* Icon + Title */}
              <div className="flex items-center gap-3.5 mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-black"
                  style={{ backgroundColor: `${tool.color}26` }}
                >
                  <tool.icon className="w-6 h-6 text-black" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-xl text-ink group-hover:text-brand-orange transition-colors leading-tight">
                    {tool.name}
                  </h2>
                  <p className="text-xs font-mono font-semibold text-ink-muted mt-0.5">{tool.platform}</p>
                </div>
              </div>

              {/* This tool answers */}
              <div className="bg-[#C6F23A] rounded-xl border-2 border-black p-3 mb-4">
                <p className="text-xs sm:text-sm font-bold text-black leading-snug">
                  &ldquo;{tool.question}&rdquo;
                </p>
              </div>

              {/* Description */}
              <p className="text-sm text-ink-secondary leading-relaxed mb-4">
                {tool.description}
              </p>

              {/* Feature highlight chips (replaces empty dashed placeholder) */}
              <div className="flex flex-wrap gap-1.5 mb-6 mt-auto">
                {tool.highlights.map((h) => (
                  <span
                    key={h}
                    className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg bg-[#FFF7E6] border border-black/25 text-ink"
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <span className="inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-black text-white font-display font-bold text-xs tracking-wider uppercase btn-pop">
                {tool.ctaLabel}
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>

        {/* Bottom info */}
        <div className="mt-12 bg-white rounded-2xl border-2 border-black shadow-pop p-6 flex items-start gap-4">
          <Shield className="w-5 h-5 text-black flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-1">
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
        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link
            href="/platforms"
            className="text-sm font-bold text-black bg-white border-2 border-black rounded-xl px-4 py-2 shadow-pop-sm hover:bg-brand-yellow transition-colors"
          >
            Compare platforms →
          </Link>
          <Link
            href="/articles"
            className="text-sm font-bold text-black bg-white border-2 border-black rounded-xl px-4 py-2 shadow-pop-sm hover:bg-brand-yellow transition-colors"
          >
            Read our analysis →
          </Link>
          <Link
            href="/newsletter"
            className="text-sm font-bold text-black bg-white border-2 border-black rounded-xl px-4 py-2 shadow-pop-sm hover:bg-brand-yellow transition-colors"
          >
            Get weekly updates →
          </Link>
        </div>
      </div>
    </div>
  );
}
