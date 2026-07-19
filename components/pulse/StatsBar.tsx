'use client';

import { TrendingUp, TrendingDown, Activity, Users, DollarSign, Target } from 'lucide-react';
import type { PulseStats } from '@/lib/pulse/types';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface StatsBarProps {
  stats: PulseStats | null;
  loading?: boolean;
}

export function StatsBar({ stats, loading }: StatsBarProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border-2 border-black rounded-xl p-3 shadow-pop-sm animate-pulse"
          >
            <div className="h-3 bg-black/10 rounded w-16 mb-2" />
            <div className="h-5 bg-black/10 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { icon: Users, label: 'Tracked Whales', value: stats.totalWhales.toLocaleString(), color: 'bg-neon-lime' },
    { icon: Activity, label: 'Active 24h', value: stats.activeWhales24h.toLocaleString(), color: 'bg-neon-cyan' },
    { icon: DollarSign, label: 'Volume 24h', value: formatUSD(stats.totalVolume24h), color: 'bg-neon-green' },
    { icon: TrendingUp, label: 'Whale Volume', value: formatUSD(stats.whaleVolume24h), color: 'bg-neon-magenta' },
    { icon: Target, label: 'Avg Whale Size', value: formatUSD(stats.avgWhaleSize), color: 'bg-neon-purple' },
    { icon: TrendingDown, label: 'Top Market', value: stats.topMarket || 'N/A', color: 'bg-neon-orange' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="bg-white border-2 border-black rounded-xl p-3 shadow-pop-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`${item.color} w-5 h-5 rounded border border-black flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-black" />
              </div>
              <span className="text-[10px] font-bold text-ink-faint uppercase tracking-wider">
                {item.label}
              </span>
            </div>
            <div className="text-sm font-display font-bold text-ink truncate">
              {item.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
