'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { TimeAgo } from './TimeAgo';
import type { WhaleFeedItem, AggregatedWhaleCard } from '@/lib/pulse/types';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Clean display name — never show "0" or raw hash */
function displayName(username: string | undefined, address: string): string {
  const clean = (username ?? '').trim();
  if (!clean || clean === '0' || /^\d+$/.test(clean) || clean.length < 2) {
    return truncateAddress(address);
  }
  return clean;
}

function getAnomalyBadge(score: number): { label: string; color: string } | null {
  if (score >= 0.7) return { label: 'HIGH', color: 'bg-red-500' };
  if (score >= 0.4) return { label: 'MEDIUM', color: 'bg-yellow-400' };
  return null;
}

function getConvictionBadge(score: number): { label: string; color: string } | null {
  if (score >= 0.8) return { label: 'STRONG', color: 'bg-neon-green text-black' };
  if (score >= 0.6) return { label: 'MODERATE', color: 'bg-neon-lime text-black' };
  if (score >= 0.4) return { label: 'WEAK', color: 'bg-brand-yellow text-black' };
  return null;
}

interface WhaleCardProps {
  trade: WhaleFeedItem;
}

export function WhaleCard({ trade }: WhaleCardProps) {
  const isBuy = trade.side === 'BUY';
  const anomalyBadge = getAnomalyBadge(trade.anomalyScore);
  const convictionBadge = trade.convictionScore != null ? getConvictionBadge(trade.convictionScore) : null;
  const name = displayName(trade.walletUsername, trade.walletAddress);

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
              {name[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-xs font-bold font-display text-ink truncate group-hover:text-black transition-colors">
            {name}
          </span>
        </Link>
          <TimeAgo ts={trade.timestamp} className="text-[10px] text-ink-faint font-body whitespace-nowrap" />
      </div>

      {/* Amount + side + badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
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
        {trade.isParking && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink">
            PARKING · {(trade.edgeRoom ?? 0).toFixed(1)}% edge
          </span>
        )}
        {convictionBadge && (
          <span
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-black ${convictionBadge.color}`}
          >
            {convictionBadge.label}
          </span>
        )}
        {anomalyBadge && (
          <span
            className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white ${anomalyBadge.color}`}
          >
            {anomalyBadge.label}
          </span>
        )}
      </div>

      {/* Risk flags */}
      {trade.riskFlags && trade.riskFlags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {trade.riskFlags.slice(0, 2).map((flag, i) => (
            <span
              key={i}
              className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-brand-orange/10 border border-brand-orange/30 text-brand-orange"
            >
              {flag}
            </span>
          ))}
        </div>
      )}

      {/* Market */}
      <Link
        href={`/pulse/markets/${trade.conditionId}`}
        className="text-xs text-ink-secondary hover:text-black transition-colors line-clamp-2"
      >
        {trade.marketTitle}
      </Link>

      {/* Footer: entry + tx */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
        <span className="text-[10px] text-ink-faint">
          Entry: {(trade.price * 100).toFixed(1)}%
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

/* ── Aggregated Card ─────────────────────────────────────────── */

export function AggregatedCard({ card }: { card: AggregatedWhaleCard }) {
  const isBuy = card.side === 'BUY';
  const name = displayName(card.walletUsername, card.walletAddress);
  const timeSpanMinutes = Math.round((card.firstTimestamp - card.lastTimestamp) / 60);

  return (
    <div className="bg-white border-2 border-black rounded-xl p-4 shadow-pop hover:-translate-y-0.5 transition-all group">
      {/* Header: wallet + trade count */}
      <div className="flex items-center justify-between mb-2">
        <Link
          href={`/pulse/wallets/${card.walletAddress}`}
          className="flex items-center gap-2 min-w-0"
        >
          {card.walletProfileImage ? (
            <img
              src={card.walletProfileImage}
              alt=""
              className="w-6 h-6 rounded-full border border-black"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neon-lime border border-black flex items-center justify-center text-[8px] font-bold">
              {name[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-xs font-bold font-display text-ink truncate group-hover:text-black transition-colors">
            {name}
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          {card.isRapidRepeat && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-brand-pink text-white border border-black">
              RAPID ×{card.tradeCount}
            </span>
          )}
          <span className="text-[10px] font-bold text-ink-faint bg-black/5 rounded px-1.5 py-0.5">
            {card.tradeCount} trade{card.tradeCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Total size + side */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg font-display font-bold text-ink">
          {formatUSD(card.totalUsdcSize)}
        </span>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isBuy
              ? 'bg-neon-green border-black text-black'
              : 'bg-red-100 border-red-300 text-red-700'
          }`}
        >
          ACCUMULATING {card.side}
        </span>
        {card.isParking && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-brand-pink/20 border border-brand-pink/40 text-brand-pink">
            PARKING
          </span>
        )}
      </div>

      {/* Price range + conviction */}
      <div className="flex items-center gap-3 text-[11px] text-ink-faint mb-2 flex-wrap">
        <span>Avg entry: <strong className="text-ink font-mono">{(card.avgPrice * 100).toFixed(1)}¢</strong></span>
        {card.tradeCount > 1 && (
          <span>Range: <strong className="text-ink font-mono">{(card.minPrice * 100).toFixed(0)}–{(card.maxPrice * 100).toFixed(0)}¢</strong></span>
        )}
        <span>Conv: <strong className="text-ink font-mono">{card.avgConviction.toFixed(2)}</strong></span>
      </div>

      {/* Time span */}
      <div className="text-[10px] text-ink-faint mb-2">
        {timeSpanMinutes > 0 ? (
          <span>Accumulated over {timeSpanMinutes < 60 ? `${timeSpanMinutes}m` : `${Math.round(timeSpanMinutes / 60)}h`}</span>
        ) : (
          <span>Single trade</span>
        )}
        {' · '}Last: <TimeAgo ts={card.lastTimestamp} />
      </div>

      {/* Market */}
      <Link
        href={`/pulse/markets/${card.conditionId}`}
        className="text-xs text-ink-secondary hover:text-black transition-colors line-clamp-2"
      >
        {card.marketTitle}
      </Link>
    </div>
  );
}
