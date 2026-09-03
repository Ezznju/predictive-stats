'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ExternalLink,
  Filter,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Zap,
  Target,
  DollarSign,
  Scale,
  Sparkles,
  Search,
  Percent,
} from 'lucide-react';
import { ToolRelatedContent } from '@/components/ToolRelatedContent';
import { ScannerLiveStatus } from '@/components/ScannerLiveStatus';
import { TableSkeleton } from '@/components/TableSkeleton';

/* ── Brand colors ──────────────────────────────────────────────────── */
const POLY = '#7B3FE4';
const KALSHI = '#00D395';

/* ── Types ─────────────────────────────────────────────────────────── */

interface AnomalyFlag {
  kind: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  value: number;
}

interface ExecutionPlan {
  legs: { platform: string; side: string; price: number; shares: number; cost: number }[];
  totalCost: number;
  payout: number;
  netProfit: number;
  roiPct: number;
  kellyFraction: number;
  viable: boolean;
  steps: string[];
}

interface ArbitragePair {
  eventName: string;
  category: string;
  matchScore: number;
  matchConfidence: number;
  opportunityScore: number;
  anomalies: AnomalyFlag[];
  plan: ExecutionPlan | null;
  executable?: {
    legs: { venue: string; action: string; avgPrice: number; size: number }[];
    bestYes: number;
    bestNo: number;
    topGrossEdge: number;
    executableSize: number;
    targetSize: number;
    grossProfitUsd: number;
    feesUsd: number;
    stressCostUsd: number;
    netProfitUsd: number;
    stressNetProfitUsd: number;
    capitalRequiredUsd: number;
    roi: number;
    annualizedRoi: number;
    stressRoi: number;
    grossPerShare: number;
    feesPerShare: number;
    netPerShare: number;
    confidence: number;
    score100: number;
    riskFlags: { severity: number; message: string }[];
    confidenceParts: {
      match: number;
      liquidity: number;
      freshness: number;
      profitQuality: number;
      resolution: number;
    };
    daysToResolution: number;
    professorNotes: string[];
  } | null;
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

type SortKey = 'arbPercent' | 'priceDiffCents' | 'matchScore' | 'opportunityScore' | 'polyVolume' | 'kalshiVolume';

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

function gradeBadge(score: number): { grade: string; color: string } {
  if (score >= 75) return { grade: 'A', color: 'bg-neon-green text-black border-black' };
  if (score >= 55) return { grade: 'B', color: 'bg-neon-lime text-black border-black' };
  if (score >= 35) return { grade: 'C', color: 'bg-brand-yellow text-black border-black' };
  return { grade: 'D', color: 'bg-gray-300 text-black border-black' };
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

  // ── Shareable filters (#5): hydrate from ?minArb=&cat=&sort=&dir= once on
  // mount, then mirror every filter change back into the URL so a filtered
  // view can be bookmarked or shared and survives a refresh.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const rawMin = p.get('minArb');
    if (rawMin !== null && !Number.isNaN(Number(rawMin))) {
      setMinArbPercent(Math.max(0, Math.min(100, Number(rawMin))));
    }
    const cat = p.get('cat');
    if (cat) setCategoryFilter(cat);
    const keys: SortKey[] = ['arbPercent', 'priceDiffCents', 'matchScore', 'opportunityScore', 'polyVolume', 'kalshiVolume'];
    const sk = p.get('sort');
    if (sk && keys.includes(sk as SortKey)) setSortKey(sk as SortKey);
    const dir = p.get('dir');
    if (dir === 'asc' || dir === 'desc') setSortAsc(dir === 'asc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (minArbPercent > 0) p.set('minArb', String(minArbPercent));
    if (categoryFilter !== 'all') p.set('cat', categoryFilter);
    if (sortKey !== 'arbPercent') p.set('sort', sortKey);
    if (sortAsc) p.set('dir', 'asc');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [minArbPercent, categoryFilter, sortKey, sortAsc]);

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
        case 'opportunityScore':
          va = a.opportunityScore ?? 0;
          vb = b.opportunityScore ?? 0;
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

  const maxSpread =
    pairs.length > 0 ? Math.max(...pairs.map((p) => p.arbPercent)) : 0;

  return (
    <div className="relative">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-black/5 py-14 sm:py-20">
        {/* Decorative shapes */}
        <div
          className="absolute top-8 left-8 w-16 h-16 rounded-xl border-2 border-black rotate-12 opacity-70 hidden md:block"
          style={{ background: POLY }}
        />
        <div
          className="absolute -top-6 right-[18%] w-24 h-24 rounded-full opacity-50 hidden md:block"
          style={{ background: KALSHI }}
        />
        <div className="absolute bottom-2 right-10 w-14 h-14 rounded-full bg-neon-lime border-2 border-black opacity-60 hidden md:block" />
        <div
          className="absolute top-1/2 left-[38%] -translate-y-1/2 w-10 h-10 rounded-lg -rotate-6 opacity-40 hidden lg:block"
          style={{ background: KALSHI }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-ink-muted mb-4">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tools" className="hover:text-ink transition-colors">Tools</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-secondary">Arbitrage Scanner</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-block px-3 py-1 text-xs font-bold text-black bg-neon-lime border-2 border-black rounded-full shadow-pop-sm">
              FREE TOOL
            </span>
            <span className="inline-block px-3 py-1 text-xs font-bold text-black bg-neon-cyan border-2 border-black rounded-full shadow-pop-sm">
              LIVE DATA
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-white border-2 border-black rounded-full shadow-pop-sm"
              style={{ background: POLY }}
            >
              POLYMARKET
              <ArrowLeftRight className="w-3 h-3" />
              <span style={{ color: KALSHI }} className="brightness-150">
                KALSHI
              </span>
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink mb-3">
            Cross-Platform Arbitrage Scanner
          </h1>
          <p className="text-lg sm:text-xl text-ink-secondary leading-relaxed max-w-3xl">
            The same event is often priced{' '}
            <span className="font-bold" style={{ color: POLY }}>
              differently
            </span>{' '}
            on{' '}
            <span className="font-bold" style={{ color: POLY }}>
              Polymarket
            </span>{' '}
            and{' '}
            <span className="font-bold" style={{ color: KALSHI }}>
              Kalshi
            </span>
            . This scanner finds those gaps in real time — so you can buy low on
            one side, sell high on the other, and lock in the spread.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* ── What is this / How it helps ───────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Search,
              color: POLY,
              title: '1. Same event, two prices',
              body: 'We scan hundreds of live markets on Polymarket and Kalshi and automatically match the ones asking the same question.',
            },
            {
              icon: Scale,
              color: KALSHI,
              title: '2. Spot the gap',
              body: 'When the YES price differs between the two platforms, that gap is a potential arbitrage opportunity — sorted biggest-first.',
            },
            {
              icon: DollarSign,
              color: '#FFBF00',
              title: '3. Lock in the spread',
              body: 'Buy YES on the cheaper platform, NO on the pricier one. If your total cost is under $1, the difference is your profit.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-2xl border-2 border-black shadow-pop p-5 transition-all duration-200 hover:-translate-y-1"
            >
              <div
                className="w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center mb-3"
                style={{ background: c.color }}
              >
                <c.icon
                  className="w-5 h-5"
                  style={{ color: c.color === '#FFBF00' ? '#000' : '#fff' }}
                />
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

        {/* ── Stats bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {
              label: 'Matched Events',
              value: `${pairs.length}`,
              icon: BarChart3,
              color: 'bg-neon-cyan',
            },
            {
              label: 'Arb ≥ 5%',
              value: `${pairs.filter((p) => p.arbPercent >= 5).length}`,
              icon: Zap,
              color: 'bg-neon-lime',
            },
            {
              label: 'Max Spread',
              value: pairs.length > 0 ? fmtPercent(maxSpread) : '0%',
              icon: Percent,
              color: 'bg-brand-yellow',
            },
            {
              label: 'Last Update',
              value: updatedAt
                ? new Date(updatedAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—',
              icon: RefreshCw,
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
              <div className="min-w-0">
                <p className="font-display font-bold text-lg leading-tight truncate">
                  {s.value}
                </p>
                <p className="text-[11px] text-ink-faint">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-white border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
          >
            <Filter className="w-4 h-4" />
            Filters
            {(minArbPercent > 0 || categoryFilter !== 'all') && (
              <span className="w-2 h-2 rounded-full bg-neon-magenta" />
            )}
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-neon-cyan border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex-1" />
          <ScannerLiveStatus updatedAt={updatedAt} />
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
          <TableSkeleton
            template="1fr 100px 100px 90px 90px 80px"
            label="Scanning Polymarket & Kalshi…"
            caption="First scan can take 10-30 seconds — after that, results load instantly."
          />
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
                  <tr className="bg-black text-white">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider">
                      Event
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none"
                      onClick={() => toggleSort('arbPercent')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Arb % <SortIcon field="arbPercent" />
                      </span>
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none"
                      onClick={() => toggleSort('priceDiffCents')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Diff <SortIcon field="priceDiffCents" />
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">
                      <span style={{ color: '#A77BF0' }}>Polymarket</span> YES
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">
                      <span style={{ color: KALSHI }}>Kalshi</span> YES
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none"
                      onClick={() => toggleSort('matchScore')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Match <SortIcon field="matchScore" />
                      </span>
                    </th>
                    <th
                      className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none"
                      onClick={() => toggleSort('opportunityScore')}
                    >
                      <span className="flex items-center justify-center gap-1">
                        Score <SortIcon field="opportunityScore" />
                      </span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">
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
                            {pair.kalshi.question &&
                              pair.kalshi.question !== pair.eventName && (
                                <div className="text-xs text-ink-secondary mt-0.5 truncate">
                                  {pair.kalshi.question}
                                </div>
                              )}
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
                            {pair.opportunityScore > 0 ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 font-mono font-bold text-sm rounded-lg border-2 ${gradeBadge(pair.opportunityScore).color}`}
                              >
                                {gradeBadge(pair.opportunityScore).grade}
                              </span>
                            ) : (
                              <span className="text-ink-faint text-xs">—</span>
                            )}
                            {pair.anomalies?.length > 0 && (
                              <span
                                className="block text-[10px] font-bold text-brand-pink mt-0.5"
                                title={pair.anomalies.map((a) => a.message).join('\n')}
                              >
                                ⚠ {pair.anomalies.length}
                              </span>
                            )}
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

        {/* ── How It Works Guide (always visible) ───────── */}
        <div className="mt-14 space-y-8">
          <div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-ink mb-2">
              How Cross-Platform Arbitrage Works
            </h2>
            <p className="text-ink-secondary max-w-3xl">
              Prediction-market arbitrage means profiting from price differences
              for the <strong className="text-ink">same outcome</strong> across two
              platforms. Here&apos;s everything you need to use this scanner with
              confidence.
            </p>
          </div>

          {/* What is it */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span
                className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center"
                style={{ background: POLY }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                What is prediction-market arbitrage?
              </h3>
            </div>
            <p className="text-ink-secondary leading-relaxed">
              When the same event is listed on two platforms at different prices,
              you can buy YES on the cheaper side and NO (or sell YES) on the more
              expensive side. Because the two positions cover every outcome, you
              lock in the price gap as profit{' '}
              <strong className="text-ink">no matter what happens</strong>. That
              gap is your arbitrage.
            </p>
          </div>

          {/* How to read */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-cyan border-2 border-black flex items-center justify-center">
                <Target className="w-5 h-5 text-black" />
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                How to read the scanner
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  k: 'Arb %',
                  v: 'The bigger the percentage, the larger the price gap between platforms.',
                },
                {
                  k: 'Diff',
                  v: 'The absolute price difference between the two YES prices, in cents.',
                },
                {
                  k: 'Green price',
                  v: 'The cheaper side for YES — this is where you buy.',
                },
                {
                  k: 'Match',
                  v: 'How confident we are both platforms price the same event. “Exact” = high confidence.',
                },
              ].map((item) => (
                <div
                  key={item.k}
                  className="bg-surface/30 rounded-xl p-4 border border-black/10"
                >
                  <p className="font-display font-bold text-ink text-sm mb-0.5">
                    {item.k}
                  </p>
                  <p className="text-sm text-ink-secondary">{item.v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Worked example */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-neon-lime border-2 border-black flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-black" />
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                A worked example
              </h3>
            </div>
            <p className="text-ink-secondary leading-relaxed mb-4">
              Say <em>&quot;Will X happen?&quot;</em> is priced at{' '}
              <strong className="text-ink">40¢ YES on Polymarket</strong> and{' '}
              <strong className="text-ink">48¢ YES on Kalshi</strong>:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div
                className="rounded-xl p-4 border-2 border-black"
                style={{ background: `${POLY}14` }}
              >
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: POLY }}>
                  Buy YES · Polymarket
                </p>
                <p className="font-mono font-bold text-2xl text-ink">40¢</p>
              </div>
              <div
                className="rounded-xl p-4 border-2 border-black"
                style={{ background: `${KALSHI}14` }}
              >
                <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#00946a' }}>
                  Buy NO · Kalshi
                </p>
                <p className="font-mono font-bold text-2xl text-ink">52¢</p>
              </div>
              <div className="rounded-xl p-4 border-2 border-black bg-neon-lime">
                <p className="text-xs font-bold uppercase tracking-wide mb-1 text-black">
                  Guaranteed profit
                </p>
                <p className="font-mono font-bold text-2xl text-black">+8¢</p>
              </div>
            </div>
            <p className="text-sm text-ink-secondary">
              Total cost: <strong className="text-ink">92¢</strong>. Payout at
              resolution: <strong className="text-ink">$1.00</strong> guaranteed.
              Profit: <strong className="text-ink">8¢ per contract</strong>, before
              fees.
            </p>
          </div>

          {/* Risks */}
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-orange border-2 border-black flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </span>
              <h3 className="font-display font-bold text-xl text-ink">
                Risks to understand first
              </h3>
            </div>
            <ul className="space-y-2 text-ink-secondary">
              {[
                ['Execution risk', 'prices can move before you trade both sides'],
                ['Fees & slippage', 'trading fees on both platforms eat into profit'],
                ['Resolution differences', 'platforms may resolve the same event differently'],
                ['Match accuracy', 'always verify both markets are truly about the same event'],
                ['Capital lock-up', 'funds are tied up until the event resolves'],
              ].map(([k, v]) => (
                <li key={k} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-orange flex-shrink-0" />
                  <span>
                    <strong className="text-ink">{k}:</strong> {v}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-black/5 rounded-2xl border border-black/10 p-6 text-center">
            <p className="text-xs text-ink-faint leading-relaxed max-w-2xl mx-auto">
              <strong>Disclaimer:</strong> This tool is for educational and
              informational purposes only. It is not financial advice. Always do
              your own research and verify matches before trading. Past price
              differences do not guarantee future arbitrage opportunities. Data is
              sourced from public Polymarket and Kalshi APIs and may be delayed or
              inaccurate.
            </p>
          </div>

          {/* Related content & cross-links */}
          <ToolRelatedContent currentTool="arbitrage-scanner" />
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

      {/* Executable Arbitrage — Golden Professor Engine */}
      {pair.executable && (
        <>
          {/* Profit Waterfall */}
          <div className="md:col-span-2 rounded-lg bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-neon-green" />
              <span className="font-display font-bold text-sm">Executable Profit Waterfall</span>
              <span className="text-[10px] font-bold bg-neon-green text-black rounded px-1.5 py-0.5 border border-black">
                Score {pair.executable.score100}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg bg-neon-green/10 border border-neon-green/30 p-2">
                <div className="text-ink-faint mb-0.5">Gross Profit</div>
                <div className="font-mono font-bold text-neon-green">${pair.executable.grossProfitUsd.toFixed(2)}</div>
                <div className="text-[10px] text-ink-faint">{pair.executable.grossPerShare.toFixed(3)}/share</div>
              </div>
              <div className="rounded-lg bg-brand-pink/10 border border-brand-pink/30 p-2">
                <div className="text-ink-faint mb-0.5">Fees</div>
                <div className="font-mono font-bold text-brand-pink">-${pair.executable.feesUsd.toFixed(2)}</div>
                <div className="text-[10px] text-ink-faint">{pair.executable.feesPerShare.toFixed(3)}/share</div>
              </div>
              <div className="rounded-lg bg-brand-orange/10 border border-brand-orange/30 p-2">
                <div className="text-ink-faint mb-0.5">Stress Cost</div>
                <div className="font-mono font-bold text-brand-orange">-${pair.executable.stressCostUsd.toFixed(2)}</div>
                <div className="text-[10px] text-ink-faint">extra slippage</div>
              </div>
              <div className="rounded-lg bg-neon-lime/10 border border-neon-lime/30 p-2">
                <div className="text-ink-faint mb-0.5">Net Profit</div>
                <div className="font-mono font-bold text-neon-lime">${pair.executable.netProfitUsd.toFixed(2)}</div>
                <div className="text-[10px] text-ink-faint">{pair.executable.netPerShare.toFixed(3)}/share</div>
              </div>
            </div>
            <div className="flex gap-4 mt-2 text-[11px] text-ink-faint">
              <span>Executable: <strong className="text-ink">{pair.executable.executableSize} / {pair.executable.targetSize} shares</strong></span>
              <span>Capital: <strong className="text-ink">${pair.executable.capitalRequiredUsd.toFixed(0)}</strong></span>
              <span>ROI: <strong className="text-neon-green">{(pair.executable.roi * 100).toFixed(1)}%</strong></span>
              <span>Annualized: <strong className="text-neon-green">{(pair.executable.annualizedRoi * 100).toFixed(1)}%</strong></span>
            </div>
          </div>

          {/* Confidence Breakdown */}
          <div className="rounded-lg bg-surface/30 border border-black/10 p-3">
            <div className="text-[11px] font-display font-bold text-ink-faint uppercase tracking-wide mb-2">Confidence</div>
            <div className="space-y-1.5">
              {[
                { label: 'Match', value: pair.executable.confidenceParts.match },
                { label: 'Liquidity', value: pair.executable.confidenceParts.liquidity },
                { label: 'Freshness', value: pair.executable.confidenceParts.freshness },
                { label: 'Profit Quality', value: pair.executable.confidenceParts.profitQuality },
                { label: 'Resolution', value: pair.executable.confidenceParts.resolution },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-16 text-ink-faint">{c.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-black/5">
                    <div
                      className={`h-full rounded-full ${c.value >= 0.7 ? 'bg-neon-green' : c.value >= 0.4 ? 'bg-brand-yellow' : 'bg-brand-pink'}`}
                      style={{ width: `${c.value * 100}%` }}
                    />
                  </div>
                  <span className="font-mono w-8 text-right">{(c.value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Flags */}
          {pair.executable.riskFlags.length > 0 && (
            <div className="rounded-lg bg-brand-orange/5 border border-brand-orange/20 p-3">
              <div className="text-[11px] font-display font-bold text-ink-faint uppercase tracking-wide mb-2">Risk Flags</div>
              <div className="space-y-1">
                {pair.executable.riskFlags.map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${flag.severity >= 3 ? 'text-brand-pink' : flag.severity >= 2 ? 'text-brand-orange' : 'text-brand-yellow'}`} />
                    <span className="text-ink-muted">{flag.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professor Notes */}
          {pair.executable.professorNotes.length > 0 && (
            <div className="md:col-span-2 rounded-lg bg-black/[0.03] border border-black/10 p-3">
              <div className="text-[11px] font-display font-bold text-ink-faint uppercase tracking-wide mb-1.5">Analysis Notes</div>
              <ul className="space-y-1 text-[11px] text-ink-muted">
                {pair.executable.professorNotes.map((note, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-brand-orange font-bold mt-0.5">›</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Execution Plan */}
      {pair.plan && pair.plan.viable && (
        <div className="md:col-span-2 rounded-lg bg-neon-green/5 border border-neon-green/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-neon-green" />
            <span className="font-display font-bold text-sm">Optimal Execution Plan</span>
            <span className="text-[10px] font-bold bg-neon-green text-black rounded px-1.5 py-0.5 border border-black">
              +{fmtPercent(pair.plan.roiPct)} ROI
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            {pair.plan.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="font-mono font-bold text-neon-green mt-0.5">{i + 1}.</span>
                <span className="text-ink-muted">{step}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2 text-[11px] text-ink-faint">
            <span>Net profit: <strong className="text-neon-green">${pair.plan.netProfit.toFixed(2)}</strong></span>
            <span>Kelly half: <strong className="text-ink">{(pair.plan.kellyFraction * 100).toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Anomaly flags */}
      {pair.anomalies && pair.anomalies.length > 0 && (
        <div className="md:col-span-2 space-y-1.5">
          <p className="text-[11px] font-display font-bold text-ink-faint uppercase tracking-wide">
            Integrity flags
          </p>
          {pair.anomalies.map((a, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 text-[11px] rounded-lg px-2.5 py-1.5 border ${
                a.severity === 'critical'
                  ? 'bg-brand-pink/10 border-brand-pink/40 text-brand-pink'
                  : a.severity === 'warn'
                    ? 'bg-brand-orange/10 border-brand-orange/30 text-brand-orange'
                    : 'bg-surface/40 border-black/10 text-ink-faint'
              }`}
            >
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{a.message}</span>
            </div>
          ))}
        </div>
      )}
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
          {pair.kalshi.question &&
            pair.kalshi.question !== pair.eventName && (
              <div className="text-xs text-ink-secondary mt-0.5 truncate">
                {pair.kalshi.question}
              </div>
            )}
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
