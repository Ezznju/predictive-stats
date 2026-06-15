'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  Shield,
  AlertTriangle,
  DollarSign,
  BarChart3,
  Crosshair,
  Eye,
  LogOut,
  Info,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface ScannerMarket {
  conditionId: string;
  slug: string;
  eventSlug: string;
  question: string;
  image: string;
  rewardPerDay: number;
  minShares: number;
  maxSpread: number;
  competition: number;
  currentSpread: number;
  yesPrice: number;
  noPrice: number;
  yesTokenId: string;
  noTokenId: string;
  entryCost: number;
  rewardScore: number;
  volume24h: number;
  endDate: string;
}

interface OrderBookLevel {
  price: string;
  size: string;
}

interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

type SortKey =
  | 'rewardScore'
  | 'rewardPerDay'
  | 'minShares'
  | 'competition'
  | 'currentSpread'
  | 'entryCost'
  | 'volume24h';

/* ── Helpers ───────────────────────────────────────────────────────── */

function fmt$(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(decimals)}`;
}

function fmtNum(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

function competitionLabel(c: number): { text: string; color: string } {
  if (c <= 10) return { text: 'Very Low', color: 'bg-neon-green text-black' };
  if (c <= 50) return { text: 'Low', color: 'bg-neon-lime text-black' };
  if (c <= 150) return { text: 'Medium', color: 'bg-brand-yellow text-black' };
  if (c <= 500) return { text: 'High', color: 'bg-brand-orange text-black' };
  return { text: 'Very High', color: 'bg-brand-pink text-white' };
}

function spreadLabel(
  current: number,
  maxSpread: number
): { text: string; color: string } {
  const spreadCents = current * 100;
  if (spreadCents >= maxSpread * 0.8)
    return { text: 'Wide', color: 'text-brand-green font-bold' };
  if (spreadCents >= maxSpread * 0.4)
    return { text: 'Medium', color: 'text-brand-amber font-bold' };
  return { text: 'Tight', color: 'text-brand-pink font-bold' };
}

/* ── Expanded Row: Order Book ──────────────────────────────────────── */

function OrderBookPanel({ market }: { market: ScannerMarket }) {
  const [yesBook, setYesBook] = useState<OrderBook | null>(null);
  const [noBook, setNoBook] = useState<OrderBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetch(`/api/lp-scanner?book=${market.yesTokenId}`).then((r) =>
        r.ok ? r.json() : null
      ),
      fetch(`/api/lp-scanner?book=${market.noTokenId}`).then((r) =>
        r.ok ? r.json() : null
      ),
    ]).then(([yes, no]) => {
      if (cancelled) return;
      setYesBook(yes);
      setNoBook(no);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [market.yesTokenId, market.noTokenId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-ink-faint" />
        <span className="ml-2 text-sm text-ink-faint">Loading order book…</span>
      </div>
    );
  }

  const midpoint = (market.yesPrice + (1 - market.noPrice)) / 2;
  const tickSize = 0.01;
  const suggestedBid = yesBook?.bids?.[0]
    ? (parseFloat(yesBook.bids[0].price) - tickSize).toFixed(2)
    : (midpoint - tickSize).toFixed(2);
  const withinSpread =
    Math.abs(parseFloat(suggestedBid) - midpoint) * 100 <= market.maxSpread;

  return (
    <div className="bg-surface/30 rounded-xl p-4 sm:p-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* YES order book */}
        <div>
          <h4 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-neon-green" />
            YES Order Book
          </h4>
          <MiniBook bids={yesBook?.bids} asks={yesBook?.asks} minShares={market.minShares} />
        </div>

        {/* NO order book */}
        <div>
          <h4 className="font-display font-bold text-sm mb-2 flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-pink" />
            NO Order Book
          </h4>
          <MiniBook bids={noBook?.bids} asks={noBook?.asks} minShares={market.minShares} />
        </div>

        {/* Entry guidance */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-sm flex items-center gap-1.5">
            <Crosshair className="w-4 h-4" />
            Entry Guidance
          </h4>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-faint">Midpoint</span>
              <span className="font-mono font-bold">{midpoint.toFixed(3)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Best YES bid</span>
              <span className="font-mono font-bold">
                {yesBook?.bids?.[0]?.price ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Suggested entry</span>
              <span className="font-mono font-bold text-neon-blue">
                {suggestedBid} (1 tick below)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-faint">Within Max Spread?</span>
              {withinSpread ? (
                <span className="text-xs font-bold text-black bg-neon-green rounded-lg px-2 py-0.5 border border-black">
                  ✓ YES
                </span>
              ) : (
                <span className="text-xs font-bold text-white bg-brand-pink rounded-lg px-2 py-0.5 border border-black">
                  ✗ NO
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-ink-faint">Min order cost</span>
              <span className="font-mono font-bold">
                {fmt$(market.minShares * parseFloat(suggestedBid))}
              </span>
            </div>
          </div>

          <a
            href={`https://polymarket.com/event/${market.eventSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-neon-cyan border-2 border-black rounded-lg px-3 py-1.5 shadow-pop-sm hover:-translate-y-0.5 transition-transform mt-2"
          >
            Open on Polymarket <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}

function MiniBook({
  bids,
  asks,
  minShares,
}: {
  bids?: OrderBookLevel[];
  asks?: OrderBookLevel[];
  minShares: number;
}) {
  const topBids = (bids ?? []).slice(0, 5);
  const topAsks = (asks ?? []).slice(0, 5);

  return (
    <div className="text-xs font-mono">
      {/* Asks (reversed so lowest ask is at bottom) */}
      <div className="space-y-px mb-1">
        {topAsks
          .slice()
          .reverse()
          .map((a, i) => {
            const size = parseFloat(a.size);
            const qualifying = size >= minShares;
            return (
              <div
                key={`a-${i}`}
                className={`flex justify-between px-2 py-0.5 rounded ${
                  qualifying
                    ? 'bg-brand-pink/15 text-brand-pink'
                    : 'bg-brand-pink/5 text-ink-faint'
                }`}
              >
                <span>{parseFloat(a.price).toFixed(2)}</span>
                <span>
                  {fmtNum(size)}{' '}
                  {qualifying && (
                    <span className="text-[10px] opacity-70">★</span>
                  )}
                </span>
              </div>
            );
          })}
      </div>

      <div className="border-t border-dashed border-ink-faint/30 my-1" />

      {/* Bids */}
      <div className="space-y-px">
        {topBids.map((b, i) => {
          const size = parseFloat(b.size);
          const qualifying = size >= minShares;
          return (
            <div
              key={`b-${i}`}
              className={`flex justify-between px-2 py-0.5 rounded ${
                qualifying
                  ? 'bg-neon-green/15 text-neon-green'
                  : 'bg-neon-green/5 text-ink-faint'
              }`}
            >
              <span>{parseFloat(b.price).toFixed(2)}</span>
              <span>
                {fmtNum(size)}{' '}
                {qualifying && (
                  <span className="text-[10px] opacity-70">★</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-ink-faint mt-1">
        ★ = qualifying size (≥ {minShares} shares)
      </p>
    </div>
  );
}

/* ── Sort Header Button ────────────────────────────────────────────── */

function SortButton({
  label,
  sortKey,
  currentSort,
  currentDir,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: 'asc' | 'desc';
  onClick: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1 text-left font-display text-xs ${
        active ? 'text-white' : 'text-white/70 hover:text-white'
      }`}
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 ${active ? 'opacity-100' : 'opacity-40'} ${
          active && currentDir === 'asc' ? 'rotate-180' : ''
        }`}
      />
    </button>
  );
}

/* ── Main Scanner Page ─────────────────────────────────────────────── */

export default function LPScannerPage() {
  const [markets, setMarkets] = useState<ScannerMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>('rewardScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filters
  const [maxMinShares, setMaxMinShares] = useState(250);
  const [minReward, setMinReward] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Expansion
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchMarkets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/lp-scanner');
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMarkets(data.markets ?? []);
      setUpdatedAt(data.updatedAt ?? '');
    } catch {
      setError('Failed to load markets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Sort
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'minShares' || key === 'competition' ? 'asc' : 'desc');
    }
  };

  // Filter & sort
  const filtered = useMemo(() => {
    let list = markets.filter(
      (m) => m.minShares <= maxMinShares && m.rewardPerDay >= minReward
    );
    list.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return list;
  }, [markets, maxMinShares, minReward, sortKey, sortDir]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Stats
  const totalRewardMarkets = markets.length;
  const totalWithRewards = markets.filter((m) => m.rewardPerDay > 0).length;
  const avgCompetition =
    markets.length > 0
      ? markets.reduce((s, m) => s + m.competition, 0) / markets.length
      : 0;

  return (
    <div className="relative">
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-black/5 py-14 sm:py-20">
        {/* Decorative shapes */}
        <div className="absolute top-6 left-8 w-16 h-16 rounded-xl bg-neon-lime border-2 border-black rotate-12 opacity-60 hidden md:block" />
        <div className="absolute -top-8 right-[20%] w-24 h-24 rounded-full bg-neon-blue/40 hidden md:block" />
        <div className="absolute bottom-4 right-10 w-14 h-14 rounded-full bg-neon-magenta/50 hidden md:block" />
        <div className="absolute top-1/2 left-[35%] -translate-y-1/2 w-10 h-10 rounded-lg bg-neon-cyan/40 -rotate-6 hidden lg:block" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block px-3 py-1 text-xs font-bold text-black bg-neon-lime border-2 border-black rounded-full shadow-pop-sm">
              FREE TOOL
            </span>
            <span className="inline-block px-3 py-1 text-xs font-bold text-black bg-neon-cyan border-2 border-black rounded-full shadow-pop-sm">
              LIVE DATA
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink mb-3">
            Polymarket LP Reward Scanner
          </h1>
          <p className="text-lg sm:text-xl text-ink-secondary leading-relaxed max-w-3xl">
            Find the best liquidity-provider reward farming opportunities on
            Polymarket. Live data, sorted by profitability — updated every 5
            minutes.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── What is this / How it helps ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Crosshair,
              color: 'bg-neon-lime',
              title: '1. Find low-cost markets',
              body: 'Polymarket pays daily USDC to anyone providing liquidity. We surface the markets where you can qualify with as little as $25–$250.',
            },
            {
              icon: Shield,
              color: 'bg-neon-cyan',
              title: '2. Provide liquidity, low risk',
              body: 'Place a resting limit order — no directional bet required. While it sits on the book within the spread, you earn rewards every day.',
            },
            {
              icon: DollarSign,
              color: 'bg-brand-yellow',
              title: '3. Earn daily rewards',
              body: 'The lower the competition, the bigger your slice of the reward pool. Sort by Score to find the best bang-for-buck opportunities first.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-2xl border-2 border-black shadow-pop p-5 transition-all duration-200 hover:-translate-y-1"
            >
              <div
                className={`${c.color} w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center mb-3`}
              >
                <c.icon className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-display font-bold text-base text-ink mb-1">
                {c.title}
              </h3>
              <p className="text-sm text-ink-secondary leading-relaxed">
                {c.body}
              </p>
            </div>
          ))}
        </div>

        {/* ── Stats Bar ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Reward Markets',
              value: fmtNum(totalRewardMarkets),
              icon: BarChart3,
              color: 'bg-neon-cyan',
            },
            {
              label: 'Active Rewards',
              value: fmtNum(totalWithRewards),
              icon: DollarSign,
              color: 'bg-neon-lime',
            },
            {
              label: 'Avg Competition',
              value: fmtNum(avgCompetition, 1),
              icon: TrendingUp,
              color: 'bg-brand-yellow',
            },
            {
              label: 'Showing',
              value: `${fmtNum(filtered.length)}/${fmtNum(totalRewardMarkets)}`,
              icon: Filter,
              color: 'bg-neon-green',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 flex items-center gap-3"
            >
              <div
                className={`${s.color} w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0`}
              >
                <s.icon className="w-4 h-4 text-black" />
              </div>
              <div>
                <p className="font-display font-bold text-lg leading-tight">
                  {s.value}
                </p>
                <p className="text-[11px] text-ink-faint">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters((f) => !f)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-white border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {(maxMinShares < 250 || minReward > 0) && (
                <span className="w-2 h-2 rounded-full bg-neon-magenta" />
              )}
            </button>

            <button
              onClick={fetchMarkets}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black bg-neon-cyan border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>
          </div>

          {updatedAt && (
            <span className="text-[11px] text-ink-faint">
              Updated{' '}
              {new Date(updatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        {/* ── Filter Panel ──────────────────────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-display font-bold text-ink mb-1">
                Max Min Shares
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={1000}
                  step={10}
                  value={maxMinShares}
                  onChange={(e) => setMaxMinShares(Number(e.target.value))}
                  className="flex-1 accent-brand-orange"
                />
                <span className="font-mono text-sm font-bold w-14 text-right">
                  {maxMinShares}
                </span>
              </div>
              <p className="text-[10px] text-ink-faint mt-0.5">
                Only show markets where Min Shares ≤ this value
              </p>
            </div>

            <div>
              <label className="block text-xs font-display font-bold text-ink mb-1">
                Min Daily Reward ($)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={5}
                  value={minReward}
                  onChange={(e) => setMinReward(Number(e.target.value))}
                  className="flex-1 accent-brand-orange"
                />
                <span className="font-mono text-sm font-bold w-14 text-right">
                  ${minReward}
                </span>
              </div>
              <p className="text-[10px] text-ink-faint mt-0.5">
                Only show markets paying at least this much per day
              </p>
            </div>
          </div>
        )}

        {/* ── Markets Table ─────────────────────────────────────── */}
        {loading && markets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange mb-3" />
            <p className="text-ink-faint text-sm">
              Scanning Polymarket for reward opportunities…
            </p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto mb-2" />
            <p className="text-ink-secondary">{error}</p>
            <button
              onClick={fetchMarkets}
              className="mt-3 text-sm font-bold text-black bg-neon-cyan border-2 border-black rounded-lg px-4 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border-2 border-black shadow-pop bg-white">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="bg-black text-white text-left">
                    <th className="px-3 py-3 font-display text-xs w-8" />
                    <th className="px-3 py-3 font-display text-xs min-w-[220px]">
                      Market
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Reward/Day"
                        sortKey="rewardPerDay"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Min Shares"
                        sortKey="minShares"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Competition"
                        sortKey="competition"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Spread"
                        sortKey="currentSpread"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Entry Cost"
                        sortKey="entryCost"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3">
                      <SortButton
                        label="Score"
                        sortKey="rewardScore"
                        currentSort={sortKey}
                        currentDir={sortDir}
                        onClick={handleSort}
                      />
                    </th>
                    <th className="px-3 py-3 font-display text-xs">Prices</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-ink-faint"
                      >
                        No markets match your filters. Try increasing Max Min
                        Shares or lowering Min Daily Reward.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((m, i) => {
                      const isExpanded = expanded.has(m.conditionId);
                      const comp = competitionLabel(m.competition);
                      const spr = spreadLabel(m.currentSpread, m.maxSpread);

                      return (
                        <Fragment key={m.conditionId}>
                          <tr
                            className={`${
                              i % 2 === 0 ? 'bg-white' : 'bg-black/[0.03]'
                            } hover:bg-neon-lime/10 cursor-pointer transition-colors`}
                            onClick={() => toggleExpand(m.conditionId)}
                          >
                            {/* Expand icon */}
                            <td className="px-3 py-3 text-ink-faint">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </td>

                            {/* Market name */}
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                {m.image && (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={m.image}
                                    alt=""
                                    className="w-7 h-7 rounded-lg border border-black/10 flex-shrink-0 object-cover"
                                  />
                                )}
                                <span className="font-display font-semibold text-xs leading-tight line-clamp-2">
                                  {m.question}
                                </span>
                              </div>
                            </td>

                            {/* Reward/Day */}
                            <td className="px-3 py-3">
                              <span className="font-mono font-bold text-sm">
                                {m.rewardPerDay > 0 ? fmt$(m.rewardPerDay) : '—'}
                              </span>
                            </td>

                            {/* Min Shares */}
                            <td className="px-3 py-3">
                              <span className="font-mono text-sm">
                                {fmtNum(m.minShares)}
                              </span>
                            </td>

                            {/* Competition */}
                            <td className="px-3 py-3">
                              <span
                                className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border border-black ${comp.color}`}
                              >
                                {comp.text}
                              </span>
                              <span className="block text-[10px] text-ink-faint font-mono mt-0.5">
                                {fmtNum(m.competition, 1)}
                              </span>
                            </td>

                            {/* Spread */}
                            <td className="px-3 py-3">
                              <span className={`text-sm ${spr.color}`}>
                                {(m.currentSpread * 100).toFixed(1)}¢
                              </span>
                              <span className="block text-[10px] text-ink-faint">
                                max {m.maxSpread}¢
                              </span>
                            </td>

                            {/* Entry Cost */}
                            <td className="px-3 py-3">
                              <span className="font-mono text-sm font-semibold">
                                {fmt$(m.entryCost)}
                              </span>
                            </td>

                            {/* Score */}
                            <td className="px-3 py-3">
                              {m.rewardScore > 0 ? (
                                <span className="inline-block font-mono font-bold text-sm text-black bg-neon-lime/60 rounded-lg px-2 py-0.5 border border-black">
                                  {m.rewardScore.toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-ink-faint text-xs">—</span>
                              )}
                            </td>

                            {/* Prices */}
                            <td className="px-3 py-3">
                              <div className="flex gap-1.5">
                                <span className="text-[11px] font-mono bg-neon-green/20 text-neon-green rounded px-1.5 py-0.5 border border-neon-green/30">
                                  Y {m.yesPrice.toFixed(2)}
                                </span>
                                <span className="text-[11px] font-mono bg-brand-pink/15 text-brand-pink rounded px-1.5 py-0.5 border border-brand-pink/30">
                                  N {m.noPrice.toFixed(2)}
                                </span>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={9} className="px-3 py-3 bg-white">
                                <OrderBookPanel market={m} />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-ink-faint mt-3 text-center">
              Data sourced from Polymarket&apos;s public API. Refreshed every 5
              minutes. Not financial advice.
            </p>
          </>
        )}

        {/* ── Strategy Guide ────────────────────────────────────── */}
        <div className="mt-14 space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
              How to Farm Polymarket LP Rewards
            </h2>
            <p className="text-ink-secondary max-w-3xl">
              A step-by-step guide to using this scanner for liquidity-provider
              reward farming on Polymarket. This strategy lets you earn daily USDC
              rewards by providing liquidity — without necessarily taking
              directional bets.
            </p>
          </div>

          {/* Step 1 */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-lime border-2 border-black flex items-center justify-center font-display font-bold text-lg">
                1
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                Find Low-Capital, High-Reward Markets
              </h3>
            </div>
            <div className="space-y-3 text-ink-secondary">
              <p>
                Use the scanner above to filter for markets where{' '}
                <strong className="text-ink">Min Shares ≤ 250</strong> and{' '}
                <strong className="text-ink">Daily Reward is meaningful</strong>{' '}
                (at least $10–$20/day). Sort by <strong className="text-ink">Score</strong>{' '}
                to see the best bang-for-buck opportunities first.
              </p>
              <div className="bg-surface/30 rounded-xl p-4 text-sm">
                <p className="font-display font-bold text-ink mb-1">
                  💡 Why Min Shares matters
                </p>
                <p>
                  If Min Shares is 100 and the price is $0.50, you only need 100 ×
                  $0.50 = <strong>$50</strong> to place a qualifying order. Under
                  250 Min Shares, you can typically farm with $25–$250 depending on
                  the price.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-cyan border-2 border-black flex items-center justify-center font-display font-bold text-lg">
                2
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                Check the Competition
              </h3>
            </div>
            <div className="space-y-3 text-ink-secondary">
              <p>
                Low competition means you get a <strong className="text-ink">larger slice of the reward pool</strong>.
                Click any row in the scanner to expand the order book and look for:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong className="text-ink">Thin order sizes</strong> — if most
                  existing orders are below Min Shares, they don&apos;t qualify for
                  rewards
                </li>
                <li>
                  <strong className="text-ink">Wide spread</strong> — a gap of
                  5–10+ cents between best bid and ask signals low liquidity and
                  opportunity
                </li>
                <li>
                  <strong className="text-ink">Few qualifying orders</strong> near
                  the midpoint — less competition for your rewards
                </li>
              </ul>
              <p className="text-sm">
                The <strong className="text-ink">Competition</strong> column gives
                you a quick read: &quot;Very Low&quot; and &quot;Low&quot; are your sweet spots.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-yellow border-2 border-black flex items-center justify-center font-display font-bold text-lg">
                3
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                Place Your Qualifying Limit Order
              </h3>
            </div>
            <div className="space-y-3 text-ink-secondary">
              <p>
                The strategy: place a limit order with at least the minimum shares,{' '}
                <strong className="text-ink">
                  1 tick (1 cent) below the highest bid
                </strong>
                . The expanded row in the scanner shows you the suggested entry
                price and confirms whether it&apos;s within Max Spread.
              </p>
              <div className="bg-surface/30 rounded-xl p-4 text-sm">
                <p className="font-display font-bold text-ink mb-1">
                  ⚡ Why 1 tick below?
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Keeps you near the inside of the book (good for rewards)</li>
                  <li>
                    Slightly reduces the chance your order gets immediately filled
                  </li>
                  <li>
                    As long as your price is within Max Spread and size ≥ Min
                    Shares, you qualify for rewards
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-orange border-2 border-black flex items-center justify-center font-display font-bold text-lg text-white">
                4
              </span>
              <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2">
                Monitor for Unwanted Fills
                <Eye className="w-5 h-5 text-ink-faint" />
              </h3>
            </div>
            <div className="space-y-3 text-ink-secondary">
              <p>
                You&apos;re farming rewards, <strong className="text-ink">not taking directional risk</strong>.
                You want your orders resting on the book (earning rewards), not getting filled.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  If the <strong className="text-ink">mid price moves toward your order</strong>,
                  the chance of getting filled increases — consider canceling
                </li>
                <li>
                  If <strong className="text-ink">liquidity vanishes</strong> on the other side,
                  you could become the only liquidity and get filled fast
                </li>
                <li>
                  This is <strong className="text-ink">not set-and-forget</strong> — check frequently
                </li>
              </ul>
              <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-xl p-4 text-sm">
                <p className="font-display font-bold text-ink mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-brand-orange" />
                  Important
                </p>
                <p>
                  If you see sudden price moves or aggressive volume hitting your
                  side, cancel immediately. Losing rewards is better than getting
                  filled at a bad time.
                </p>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-magenta border-2 border-black flex items-center justify-center font-display font-bold text-lg text-white">
                5
              </span>
              <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2">
                If You Get Filled: Exit Options
                <LogOut className="w-5 h-5 text-ink-faint" />
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-4">
                <h4 className="font-display font-bold text-sm text-ink mb-2 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-neon-green" />
                  Option A: Quick Exit (Safer)
                </h4>
                <p className="text-sm text-ink-secondary">
                  Sell immediately 1¢ below your buy price. You accept a tiny loss
                  (~1¢ per share + fees) but keep whatever LP rewards you earned
                  while your order sat on the book.
                </p>
              </div>
              <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-xl p-4">
                <h4 className="font-display font-bold text-sm text-ink mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-brand-orange" />
                  Option B: Hold &amp; Farm More (Riskier)
                </h4>
                <p className="text-sm text-ink-secondary">
                  Place a sell order 1¢ above your buy. You earn LP rewards on the
                  sell side too, and if filled you exit with +1¢ profit. But if the
                  market moves against you, you&apos;re stuck holding a losing
                  position.
                </p>
              </div>
            </div>
            <div className="mt-4 bg-brand-pink/10 border border-brand-pink/30 rounded-xl p-4">
              <p className="text-sm text-ink-secondary">
                <strong className="text-ink">⚠️ Where the real risk lives:</strong>{' '}
                In volatile or news-driven markets, you can get &quot;cooked&quot; — tiny LP
                rewards won&apos;t offset a big directional loss. Always understand the
                event you&apos;re providing liquidity to.
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-black/5 rounded-2xl border border-black/10 p-6 text-center">
            <p className="text-xs text-ink-faint leading-relaxed max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> This tool is for educational and
              informational purposes only. It is not financial advice. LP reward
              farming involves risk of loss. Past reward rates do not guarantee
              future returns. Always do your own research before placing any
              orders. Data is sourced from Polymarket&apos;s public API and may be
              delayed or inaccurate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Fragment import (React) ──────────────────────────────────────── */
import { Fragment } from 'react';
