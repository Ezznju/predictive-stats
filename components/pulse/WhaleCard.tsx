'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { WhaleFeedItem } from '@/lib/pulse/types';

function formatTime(ts: number): string {
  const diff = Date.now() - ts * 1000;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getAnomalyBadge(score: number): { label: string; color: string } | null {
  if (score >= 0.7) return { label: 'HIGH', color: 'bg-red-500' };
  if (score >= 0.4) return { label: 'MEDIUM', color: 'bg-yellow-400' };
  return null;
}

interface WhaleCardProps {
  trade: WhaleFeedItem;
}

export function WhaleCard({ trade }: WhaleCardProps) {
  const isBuy = trade.side === 'BUY';
  const anomalyBadge = getAnomalyBadge(trade.anomalyScore);

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-pop hover:-translate-y-0.5 transition-all group">
      {/* Header row: wallet + time */}
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/pulse/wallets/${trade.walletAddress}`}
          className="flex items-center gap-2 min-w-0"
        >
          {trade.walletProfileImage ? (
            <img
              src={trade.walletProfileImage}
              alt=""
              className="w-6 h-6 rounded-full border border-black"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neon-lime border border-black flex items-center justify-center text-[8px] font-bold">
              {trade.walletUsername[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-xs font-bold font-display text-ink truncate group-hover:text-black transition-colors">
            {trade.walletUsername || truncateAddress(trade.walletAddress)}
          </span>
        </Link>
        <span className="text-[10px] text-ink-faint font-body whitespace-nowrap">
          {formatTime(trade.timestamp)}
        </span>
      </div>

      {/* Amount + side */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-display font-bold text-ink">
          {formatUSD(trade.usdcSize)}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isBuy
              ? 'bg-neon-green border-black text-black'
              : 'bg-red-100 border-red-300 text-red-700'
          }`}
        >
          {trade.side} {trade.outcome}
        </span>
        {anomalyBadge && (
          <span
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${anomalyBadge.color}`}
          >
            {anomalyBadge.label}
          </span>
        )}
      </div>

      {/* Market */}
      <Link
        href={`/pulse/markets/${trade.conditionId}`}
        className="text-xs text-ink-secondary hover:text-black transition-colors line-clamp-2"
      >
        {trade.marketTitle}
      </Link>

      {/* Footer: price + tx */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
        <span className="text-[10px] text-ink-faint">
          Price: {(trade.price * 100).toFixed(1)}%
        </span>
        {trade.txHash && trade.txHash !== '0x' && (
          <a
            href={`https://polygonscan.com/tx/${trade.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-ink-faint hover:text-black flex items-center gap-1"
          >
            TX <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
