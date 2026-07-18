'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Crosshair, ExternalLink } from 'lucide-react';

interface ToolEmbedProps {
  tool: 'lp-scanner' | 'arbitrage-scanner';
}

const TOOLS = {
  'lp-scanner': {
    href: '/tools/lp-scanner',
    title: 'LP Reward Scanner',
    subtitle: 'Polymarket',
    description:
      'Find the highest-paying liquidity provider rewards across all active Polymarket markets. Real-time data, sorted by profitability.',
    icon: Crosshair,
    color: 'bg-neon-lime',
    badge: 'LIVE DATA',
  },
  'arbitrage-scanner': {
    href: '/tools/arbitrage-scanner',
    title: 'Arbitrage Scanner',
    subtitle: 'Polymarket × Kalshi',
    description:
      'Spot cross-platform price gaps between Polymarket and Kalshi. See exploitable spreads in real time.',
    icon: BarChart3,
    color: 'bg-neon-cyan',
    badge: 'LIVE DATA',
  },
};

export function ToolEmbed({ tool }: ToolEmbedProps) {
  const config = TOOLS[tool];
  const Icon = config.icon;

  return (
    <div className="my-8 not-prose">
      <Link
        href={config.href}
        className="group block bg-white rounded-2xl border-2 border-black shadow-pop p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop"
      >
        <div className="flex items-start gap-4">
          <div
            className={`${config.color} w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center flex-shrink-0`}
          >
            <Icon className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-black bg-neon-lime border border-black rounded-full px-2 py-0.5">
                FREE TOOL
              </span>
              <span className="text-[10px] font-bold text-black bg-neon-cyan border border-black rounded-full px-2 py-0.5">
                {config.badge}
              </span>
            </div>
            <h3 className="font-display font-bold text-base text-ink group-hover:text-black transition-colors flex items-center gap-2">
              {config.title}
              <span className="text-xs font-normal text-ink-faint">{config.subtitle}</span>
            </h3>
            <p className="text-sm text-ink-secondary mt-1 leading-relaxed">
              {config.description}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-ink-faint group-hover:text-black flex-shrink-0 mt-1 transition-colors" />
        </div>
      </Link>
    </div>
  );
}
