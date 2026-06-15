'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ExternalLink,
  Filter,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowLeftRight,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/* ── Types ─────────────────────────────────────────────────────────── */

interface ArbitragePair {
  eventName: string;
  category: string;
  matchScore: number;
  poly: {
    question: string;
    yesPrice: number;
    bestBid: number;
    bestAsk: number;
    volume24h: number;
    slug: string;
    image: string;
  };
  kalshi: {
    question: string;
    yesPrice: number;
    yesBid: number;
    yesAsk: number;
    volume: number;
    ticker: string;
    eventTicker: string;
  };
  priceDiffCents: number;
  cheaperYes: 'polymarket' | 'kalshi';
  arbPercent: number;
}

type SortKey = 'arbPercent' | 'priceDiffCents' | 'matchScore' | 'polyVolume' | 'kalshiVolume';

/* ── Helpers ───────────────────────────────────────────────────────── */

function fmt$(n: number, decimals = 2): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(decimals)}`;
}

function fmtCents(n: number): string {
  return `${n}¢`;
}

function fmtPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

function arbLabel(pct: number): { text: string; color: string } {
  if (pct >= 10) return { text: 'Strong', color: 'bg-neon-green text-black' };
  if (pct >= 5) return { text: 'Moderate', color: 'bg-neon-lime text-black' };
  if (pct >= 2) return { text: 'Slight', color: 'bg-brand-yellow text-black' };
  return { text: 'Minimal', color: 'bg-gray-200 text-black' };
}

function matchLabel(score: number): { text: string; color: string } {
  if (score >= 0.7) return { text: 'Exact', color: 'text-neon-green' };
  if (score >= 0.5) return { text: 'Strong', color: 'text-brand-amber' };
  return { text: 'Likely', color: 'text-ink-faint' };
}

/* ── Main Page Component ───────────────────────────────────────────── */

export default function ArbitrageScannerPage() {
  const [pairs, setPairs] = useState<ArbitragePair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Filters & sort
  const [sortKey, setSortKey] = useState<SortKey>('arbPercent');
  const [sortAsc, setSortAsc] = useState(false);
  const [minArbPercent, setMinArbPercent] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/arbitrage-scanner');
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setPairs(data.pairs ?? []);
      setUpdatedAt(data.updatedAt ?? null);
    } catch {
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(pairs.map((p) => p.category));
    return ['all', ...Array.from(cats).sort()];
  }, [pairs]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = pairs.filter((p) => p.arbPercent >= minArbPercent);
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    result.sort((a, b) => {
      let va: number, vb: number;
      switch (sortKey) {
        case 'arbPercent':
          va = a.arbPercent;
          vb = b.arbPercent;
          break;
        case 'priceDiffCents':
          va = a.priceDiffCents;
          vb = b.priceDiffCents;
          break;
        case 'matchScore':
          va = a.matchScore;
          vb = b.matchScore;
          break;
        case 'polyVolume':
          va = a.poly.volume24h;
          vb = b.poly.volume24h;
          break;
        case 'kalshiVolume':
          va = a.kalshi.volume;
          vb = b.kalshi.volume;
          break;
        default:
          va = a.arbPercent;
          vb = b.arbPercent;
      }
      return sortAsc ? va - vb : vb - va;
    });

    return result;
  }, [pairs, sortKey, sortAsc, minArbPercent, categoryFilter]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  function SortIcon({ field }: { field: SortKey }) {
    if (sortKey !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />;
    return sortAsc ? (
      <ChevronUp className="w-3.5 h-3.5 text-brand-orange" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-brand-orange" />
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Header ────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white rounded-xl border-2 border-black shadow-pop">
              <ArrowLeftRight className="w-6 h-6 text-brand-orange" />
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
              Arbitrage Scanner
            </h1>
          </div>
          <p className="text-ink-muted max-w-2xl text-base sm:text-lg">
            Spot price differences between{' '}
            <span className="font-semibold text-ink">Polymarket</span> and{' '}
            <span className="font-semibold text-ink">Kalshi</span> on the same
            events. When the same outcome has different prices, there may be an
            arbitrage opportunity.
          </p>
        </div>

        {/* ── Stats bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 text-center">
            <div className="text-2xl font-display font-bold">{pairs.length}</div>
            <div className="text-xs text-ink-faint uppercase tracking-wide">
              Matched Events
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 text-center">
            <div className="text-2xl font-display font-bold text-neon-green">
              {pairs.filter((p) => p.arbPercent >= 5).length}
            </div>
            <div className="text-xs text-ink-faint uppercase tracking-wide">
              Arb ≥ 5%
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 text-center">
            <div className="text-2xl font-display font-bold text-brand-orange">
              {pairs.length > 0 ? fmtPercent(Math.max(...pairs.map((p) => p.arbPercent))) : '0%'}
            </div>
            <div className="text-xs text-ink-faint uppercase tracking-wide">
              Max Spread
            </div>
          </div>
          <div className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 text-center">
            <div className="text-2xl font-display font-bold">
              {updatedAt
                ? new Date(updatedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </div>
            <div className="text-xs text-ink-faint uppercase tracking-wide">
              Last Update
            </div>
          </div>
        </div>

        {/* ── Controls ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-black rounded-lg shadow-pop-sm text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-black rounded-lg shadow-pop-sm text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex-1" />
          <span className="text-xs text-ink-faint">
            Auto-refreshes every 5 min
          </span>
        </div>

        {/* ── Filters Panel ─────────────────────────────── */}
        {showFilters && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-4 mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-ink-faint uppercase mb-1">
                Min Arb %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={minArbPercent}
                onChange={(e) => setMinArbPercent(Number(e.target.value))}
                className="w-24 px-2 py-1.5 border-2 border-black rounded-lg text-sm font-display"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-faint uppercase mb-1">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2 py-1.5 border-2 border-black rounded-lg text-sm font-display bg-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'All Categories' : c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Loading / Error ───────────────────────────── */}
        {loading && pairs.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-orange mb-3" />
            <p className="text-ink-muted font-display">
              Scanning Polymarket &amp; Kalshi for matching events…
            </p>
            <p className="text-xs text-ink-faint mt-1">
              This may take 10-15 seconds on first load
            </p>
          </div>
        )}

        {error && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-brand-orange mx-auto mb-2" />
            <p className="text-ink-muted">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-2 bg-brand-orange text-white rounded-lg font-semibold text-sm border-2 border-black shadow-pop-sm hover:bg-brand-orange/90 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* ── Results Table ─────────────────────────────── */}
        {!loading && !error && filtered.length === 0 && pairs.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-8 text-center">
            <p className="text-ink-muted font-display">
              No matches found with current filters.
            </p>
            <button
              onClick={() => {
                setMinArbPercent(0);
                setCategoryFilter('all');
              }}
              className="mt-2 text-brand-orange font-semibold text-sm underline"
            >
              Reset filters
            </button>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-black">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider text-ink-faint">
                      Event
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint cursor-pointer hover:text-ink select-none"
                      onClick={() => toggleSort('arbPercent')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Arb % <SortIcon field="arbPercent" />
                      </span>
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint cursor-pointer hover:text-ink select-none"
                      onClick={() => toggleSort('priceDiffCents')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Diff <SortIcon field="priceDiffCents" />
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint">
                      <span className="text-[#7B3FE4]">Polymarket</span> YES
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint">
                      <span className="text-[#00D395]">Kalshi</span> YES
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint cursor-pointer hover:text-ink select-none"
                      onClick={() => toggleSort('matchScore')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Match <SortIcon field="matchScore" />
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider text-ink-faint">
                      Links
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((pair, i) => {
                    const arb = arbLabel(pair.arbPercent);
                    const match = matchLabel(pair.matchScore);
                    const isExpanded = expandedRow === i;
                    return (
                      <>
                        <tr
                          key={`row-${i}`}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                          onClick={() => setExpandedRow(isExpanded ? null : i)}
                        >
                          <td className="px-4 py-3 max-w-xs">
                            <div className="font-display font-semibold text-sm leading-tight truncate">
                              {pair.eventName}
                            </div>
                            <div className="text-xs text-ink-faint mt-0.5">
                              {pair.category}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${arb.color}`}
                            >
                              {fmtPercent(pair.arbPercent)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-sm font-semibold">
                            {fmtCents(pair.priceDiffCents)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`font-mono text-sm font-bold ${
                                pair.cheaperYes === 'polymarket'
                                  ? 'text-neon-green'
                                  : ''
                              }`}
                            >
                              {(pair.poly.yesPrice * 100).toFixed(1)}¢
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`font-mono text-sm font-bold ${
                                pair.cheaperYes === 'kalshi'
                                  ? 'text-neon-green'
                                  : ''
                              }`}
                            >
                              {(pair.kalshi.yesPrice * 100).toFixed(1)}¢
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs font-semibold ${match.color}`}>
                              {match.text}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={`https://polymarket.com/event/${pair.poly.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#7B3FE4] hover:underline text-xs font-semibold"
                              >
                                Poly
                              </a>
                              <a
                                href={`https://kalshi.com/markets/${pair.kalshi.eventTicker}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[#00D395] hover:underline text-xs font-semibold"
                              >
                                Kalshi
                              </a>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`detail-${i}`}>
                            <td colSpan={7} className="px-4 py-4 bg-gray-50/70">
                              <ExpandedDetail pair={pair} />
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filtered.map((pair, i) => (
                <MobileCard
                  key={i}
                  pair={pair}
                  expanded={expandedRow === i}
                  onToggle={() => setExpandedRow(expandedRow === i ? null : i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── How It Works Guide ────────────────────────── */}
        <div className="mt-8">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-left w-full bg-white rounded-xl border-2 border-black shadow-pop p-4 hover:bg-gray-50 transition-colors"
          >
            <Info className="w-5 h-5 text-brand-orange flex-shrink-0" />
            <span className="font-display font-bold text-lg">
              How Cross-Platform Arbitrage Works
            </span>
            <div className="flex-1" />
            {showGuide ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showGuide && (
            <div className="bg-white rounded-b-xl border-2 border-t-0 border-black shadow-pop -mt-2 p-5 sm:p-6 space-y-4 text-sm text-ink-muted leading-relaxed">
              <div>
                <h3 className="font-display font-bold text-ink text-base mb-1">
                  What is prediction market arbitrage?
                </h3>
                <p>
                  When the same event is listed on two platforms at different prices,
                  you can theoretically buy YES on the cheaper side and NO (or sell YES)
                  on the more expensive side, locking in a risk-free profit regardless
                  of the outcome. This is called <strong>arbitrage</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-display font-bold text-ink text-base mb-1">
                  How to read the scanner
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Arb %</strong> — The bigger the percentage, the larger the
                    price gap between platforms.
                  </li>
                  <li>
                    <strong>Diff</strong> — Absolute price difference in cents.
                  </li>
                  <li>
                    <strong>Green price</strong> — The cheaper side for YES. Buy here.
                  </li>
                  <li>
                    <strong>Match</strong> — How confident we are that both platforms are
                    pricing the <em>same</em> event. &quot;Exact&quot; means high confidence.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-display font-bold text-ink text-base mb-1">
                  Example
                </h3>
                <p>
                  If &quot;Will X happen?&quot; is priced at 40¢ YES on Polymarket and 48¢ YES
                  on Kalshi, you could buy YES on Polymarket (40¢) and buy NO on Kalshi
                  (52¢). Total cost: 92¢. Payout: $1 guaranteed. Profit: 8¢ per
                  contract.
                </p>
              </div>

              <div className="bg-brand-yellow/20 rounded-lg p-3 border border-brand-yellow/40">
                <p className="font-semibold text-ink flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-brand-orange" />
                  Important risks
                </p>
                <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                  <li>Execution risk: prices can move before you trade both sides</li>
                  <li>
                    Fees &amp; slippage: trading fees on both platforms eat into profit
                  </li>
                  <li>
                    Resolution differences: platforms may resolve the same event differently
                  </li>
                  <li>
                    Match accuracy: verify both markets are truly about the same event
                  </li>
                  <li>
                    Capital lock-up: funds are tied until the event resolves
                  </li>
                </ul>
              </div>

              <p className="text-xs text-ink-faint">
                This tool is for informational purposes only. Always do your own
                research and verify matches before trading. Past price differences do
                not guarantee future arbitrage opportunities.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer link ───────────────────────────────── */}
        <div className="mt-6 text-center text-sm text-ink-faint">
          <Link
            href="/tools/lp-scanner"
            className="hover:text-ink underline inline-flex items-center gap-1"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Also check out our LP Reward Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Expanded Detail Component ─────────────────────────────────────── */

function ExpandedDetail({ pair }: { pair: ArbitragePair }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Polymarket side */}
      <div className="rounded-lg border-2 border-[#7B3FE4]/30 p-3 bg-[#7B3FE4]/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#7B3FE4]" />
          <span className="font-display font-bold text-sm text-[#7B3FE4]">
            Polymarket
          </span>
        </div>
        <p className="text-xs text-ink-muted mb-2 line-clamp-2">
          {pair.poly.question}
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-ink-faint">YES Price</div>
            <div className="font-mono font-bold">
              {(pair.poly.yesPrice * 100).toFixed(1)}¢
            </div>
          </div>
          <div>
            <div className="text-ink-faint">Bid / Ask</div>
            <div className="font-mono font-bold">
              {pair.poly.bestBid
                ? `${(pair.poly.bestBid * 100).toFixed(1)}¢ / ${(pair.poly.bestAsk * 100).toFixed(1)}¢`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-ink-faint">24h Vol</div>
            <div className="font-mono font-bold">
              {pair.poly.volume24h > 0 ? fmt$(pair.poly.volume24h) : '—'}
            </div>
          </div>
        </div>
        <a
          href={`https://polymarket.com/event/${pair.poly.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#7B3FE4] hover:underline"
        >
          Trade on Polymarket <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Kalshi side */}
      <div className="rounded-lg border-2 border-[#00D395]/30 p-3 bg-[#00D395]/5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00D395]" />
          <span className="font-display font-bold text-sm text-[#00D395]">
            Kalshi
          </span>
        </div>
        <p className="text-xs text-ink-muted mb-2 line-clamp-2">
          {pair.kalshi.question}
        </p>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-ink-faint">YES Price</div>
            <div className="font-mono font-bold">
              {(pair.kalshi.yesPrice * 100).toFixed(1)}¢
            </div>
          </div>
          <div>
            <div className="text-ink-faint">Bid / Ask</div>
            <div className="font-mono font-bold">
              {pair.kalshi.yesBid > 0
                ? `${(pair.kalshi.yesBid * 100).toFixed(1)}¢ / ${(pair.kalshi.yesAsk * 100).toFixed(1)}¢`
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-ink-faint">Volume</div>
            <div className="font-mono font-bold">
              {pair.kalshi.volume > 0 ? fmt$(pair.kalshi.volume) : '—'}
            </div>
          </div>
        </div>
        <a
          href={`https://kalshi.com/markets/${pair.kalshi.eventTicker}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#00D395] hover:underline"
        >
          Trade on Kalshi <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Arbitrage breakdown */}
      <div className="md:col-span-2 rounded-lg bg-white border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-4 h-4 text-brand-orange" />
          <span className="font-display font-bold text-sm">Arbitrage Breakdown</span>
        </div>
        <div className="text-xs text-ink-muted space-y-1">
          <p>
            <strong>Price gap:</strong> {fmtCents(pair.priceDiffCents)} (
            {fmtPercent(pair.arbPercent)} spread)
          </p>
          <p>
            <strong>Cheaper YES:</strong>{' '}
            <span
              className={
                pair.cheaperYes === 'polymarket'
                  ? 'text-[#7B3FE4] font-semibold'
                  : 'text-[#00D395] font-semibold'
              }
            >
              {pair.cheaperYes === 'polymarket' ? 'Polymarket' : 'Kalshi'}
            </span>{' '}
            — buy YES here at{' '}
            {pair.cheaperYes === 'polymarket'
              ? `${(pair.poly.yesPrice * 100).toFixed(1)}¢`
              : `${(pair.kalshi.yesPrice * 100).toFixed(1)}¢`}
          </p>
          <p>
            <strong>Strategy:</strong> Buy YES on{' '}
            {pair.cheaperYes === 'polymarket' ? 'Polymarket' : 'Kalshi'} + Buy NO
            on {pair.cheaperYes === 'polymarket' ? 'Kalshi' : 'Polymarket'}.
            {pair.priceDiffCents >= 3 && (
              <span className="text-neon-green font-semibold">
                {' '}
                Potential {fmtCents(pair.priceDiffCents)} profit per contract
                (before fees).
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Mobile Card Component ─────────────────────────────────────────── */

function MobileCard({
  pair,
  expanded,
  onToggle,
}: {
  pair: ArbitragePair;
  expanded: boolean;
  onToggle: () => void;
}) {
  const arb = arbLabel(pair.arbPercent);

  return (
    <div className="p-4" onClick={onToggle}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-sm leading-tight line-clamp-2">
            {pair.eventName}
          </div>
          <div className="text-xs text-ink-faint mt-0.5">{pair.category}</div>
        </div>
        <span
          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${arb.color}`}
        >
          {fmtPercent(pair.arbPercent)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-[#7B3FE4]/5 border border-[#7B3FE4]/20 p-2">
          <div className="text-[10px] text-[#7B3FE4] font-semibold uppercase tracking-wide mb-0.5">
            Polymarket YES
          </div>
          <div
            className={`font-mono text-lg font-bold ${
              pair.cheaperYes === 'polymarket' ? 'text-neon-green' : 'text-ink'
            }`}
          >
            {(pair.poly.yesPrice * 100).toFixed(1)}¢
          </div>
        </div>
        <div className="rounded-lg bg-[#00D395]/5 border border-[#00D395]/20 p-2">
          <div className="text-[10px] text-[#00D395] font-semibold uppercase tracking-wide mb-0.5">
            Kalshi YES
          </div>
          <div
            className={`font-mono text-lg font-bold ${
              pair.cheaperYes === 'kalshi' ? 'text-neon-green' : 'text-ink'
            }`}
          >
            {(pair.kalshi.yesPrice * 100).toFixed(1)}¢
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-ink-faint">
        <span>Diff: {fmtCents(pair.priceDiffCents)}</span>
        <span className={matchLabel(pair.matchScore).color}>
          {matchLabel(pair.matchScore).text} match
        </span>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <ExpandedDetail pair={pair} />
        </div>
      )}
    </div>
  );
}
