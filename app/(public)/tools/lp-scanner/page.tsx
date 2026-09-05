'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  X,
  ExternalLink,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  DollarSign,
  BarChart3,
  Clock,
  Zap,
  Link2,
  Download,
} from 'lucide-react';
import { ScannerLiveStatus } from '@/components/ScannerLiveStatus';
import { TableSkeleton } from '@/components/TableSkeleton';
import { ToolShareBar } from '@/components/ToolShareBar';
import { downloadCsv } from '@/lib/csv';

/* ── Types ──────────────────────────────────────────────────────────── */

interface LPRewardMarket {
  conditionId: string;
  question: string;
  slug: string;
  image: string;
  dailyReward: number;
  spread: number;
  minSize: number;
  maxSpread: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  liquidity: number;
  competitiveness: number;
  endDate: string;
  priceChange24h: number;
  yesPrice: number;
  noPrice: number;
  tokenId: string;
}

interface OrderBook {
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
  bidCount: number;
  askCount: number;
  bidDepth: number;
  askDepth: number;
  spread: string | null;
  lastPrice: string;
  tickSize: string;
}

/* ── Brand colors ────────────────────────────────────────────────────── */
const BRAND = '#7B3FE4';
const NEON_GREEN = '#2BD96E';
const NEON_CYAN = '#29C5F6';
const NEON_LIME = '#C6F23A';
const YELLOW = '#FFE642';

/* ── Helpers ────────────────────────────────────────────────────────── */

function fmt$(n: number) {
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + n.toFixed(0);
}

function daysUntil(dateStr: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = d.getTime() - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

type SortKey = 'dailyReward' | 'spread' | 'volume24hr' | 'liquidity' | 'competitiveness' | 'minSize';

/* ── Main Page ──────────────────────────────────────────────────────── */

export default function LPScannerPage() {
  const [markets, setMarkets] = useState<LPRewardMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dailyReward');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  const [selectedMarket, setSelectedMarket] = useState<LPRewardMarket | null>(null);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [obLoading, setObLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | string | null>(null);
  // Share-permalink highlight (#hi=<conditionId>) + per-row copied state
  const [hiParam, setHiParam] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Velocity calculator
  const [vCap, setVCap] = useState(1000);
  const [vN, setVN] = useState(6);
  const [vPool, setVPool] = useState(90);
  const [vPhase, setVPhase] = useState(2.8);

  // Fetch rewards data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/lp-rewards');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        setMarkets(data.markets ?? []);
        setUpdatedAt(data.updatedAt ?? null);
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Shareable state (#5): hydrate ?q=&sort=&dir= once on mount, then
  // mirror changes into the URL so views are bookmarkable/shareable.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const qq = p.get('q');
    if (qq) setQ(qq);
    const sk = p.get('sort');
    if (sk && ['dailyReward', 'spread', 'minSize', 'volume24hr', 'liquidity', 'competitiveness'].includes(sk)) {
      setSortKey(sk as SortKey);
    }
    const dir = p.get('dir');
    if (dir === 'asc') setSortDir(1);
    else if (dir === 'desc') setSortDir(-1);
    const hi = p.get('hi');
    if (hi) setHiParam(hi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to the shared row once data arrives
  useEffect(() => {
    if (!hiParam || markets.length === 0) return;
    const el = document.querySelector('[data-hi="true"]');
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [hiParam, markets]);

  const copyRowLink = (conditionId: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (sortKey !== 'dailyReward') p.set('sort', sortKey);
    if (sortDir === 1) p.set('dir', 'asc');
    p.set('hi', conditionId);
    navigator.clipboard?.writeText(`${window.location.origin}/tools/lp-scanner?${p.toString()}`).catch(() => {});
    setCopiedKey(conditionId);
    setTimeout(() => setCopiedKey((k) => (k === conditionId ? null : k)), 1500);
  };

  const exportCsv = () => {
    downloadCsv(`pmf-lp-rewards-${new Date().toISOString().slice(0, 10)}.csv`, filtered.map((m) => ({
      question: m.question,
      slug: m.slug,
      condition_id: m.conditionId,
      daily_reward_usd: +m.dailyReward.toFixed(2),
      spread_cents: +(m.spread * 100).toFixed(1),
      min_size: m.minSize,
      volume_24h: Math.round(m.volume24hr),
      liquidity: Math.round(m.liquidity),
      competitiveness: +(m.competitiveness * 100).toFixed(0),
      days_left: daysUntil(m.endDate) ?? '',
      yes_cents: +(m.yesPrice * 100).toFixed(0),
      no_cents: +(m.noPrice * 100).toFixed(0),
    })));
  };

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (sortKey !== 'dailyReward') p.set('sort', sortKey);
    if (sortDir === 1) p.set('dir', 'asc');
    const qs = p.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [q, sortKey, sortDir]);

  // Fetch order book when market selected
  useEffect(() => {
    if (!selectedMarket?.tokenId) { setOrderBook(null); return; }
    let cancelled = false;
    (async () => {
      setObLoading(true);
      try {
        const res = await fetch('/api/order-book?token_id=' + selectedMarket.tokenId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!cancelled) setOrderBook(data);
      } catch {
        if (!cancelled) setOrderBook(null);
      } finally {
        if (!cancelled) setObLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMarket?.tokenId]);

  // Close drawer on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedMarket(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Sort + filter
  const filtered = useMemo(() => {
    return markets
      .filter((m) => !q || m.question.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => ((a[sortKey] as number) - (b[sortKey] as number)) * sortDir);
  }, [markets, q, sortKey, sortDir]);

  const handleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(-sortDir as -1 | 1);
    else { setSortKey(k); setSortDir(-1); }
  };

  // Velocity calc
  const vBase = vCap / (20 * 300 + vCap);
  const vShare = Math.min(0.85, vBase * vPhase);
  const vPerMatch = vPool * vShare;
  const vDaily = vPerMatch * vN;
  const vStaticD = vPool * vBase;

  const maxReward = markets.length > 0 ? Math.max(...markets.map(m => m.dailyReward)) : 0;

  return (
    <div className="relative">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-black/5 py-14 sm:py-20">
        <div
          className="absolute top-8 left-8 w-16 h-16 rounded-xl border-2 border-black rotate-12 opacity-70 hidden md:block"
          style={{ background: BRAND }}
        />
        <div
          className="absolute -top-6 right-[18%] w-24 h-24 rounded-full opacity-50 hidden md:block"
          style={{ background: NEON_CYAN }}
        />
        <div className="absolute bottom-2 right-10 w-14 h-14 rounded-full bg-neon-lime border-2 border-black opacity-60 hidden md:block" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <nav className="flex items-center gap-2 text-xs text-ink-muted mb-4">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/tools" className="hover:text-ink transition-colors">Tools</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-ink-secondary">LP Scanner</span>
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
              style={{ background: BRAND }}
            >
              POLYMARKET
              <TrendingUp className="w-3 h-3" />
            </span>
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-ink mb-3">
            LP Reward Scanner
          </h1>
          <p className="text-lg sm:text-xl text-ink-secondary leading-relaxed max-w-3xl">
            Scan every active Polymarket LP reward pool in real time. See daily
            reward rates, annual yield estimates, and spread metrics — sorted to
            surface the best farming opportunities right now.
          </p>
          <ToolShareBar
            url="https://predictionsmarketfans.com/tools/lp-scanner"
            title="Polymarket LP Reward Scanner — real APR net of fees, live order books"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* ── How it works ───────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: DollarSign, color: BRAND, title: '1. Daily rewards', body: 'Each active LP reward pool shows its daily USD payout, spread requirements, and minimum size.' },
            { icon: BarChart3, color: NEON_CYAN, title: '2. Compare yields', body: 'Sort by daily reward, spread, volume, or competitiveness to find the pools that match your capital.' },
            { icon: Zap, color: NEON_LIME, title: '3. Go deeper', body: 'Click any row for live order book depth, reward configuration, and a direct link to trade on Polymarket.' },
          ].map((c) => (
            <div key={c.title} className="bg-white rounded-2xl border-2 border-black shadow-pop p-5 transition-all duration-200 hover:-translate-y-1">
              <div className="w-11 h-11 rounded-xl border-2 border-black flex items-center justify-center mb-3" style={{ background: c.color }}>
                <c.icon className="w-5 h-5" style={{ color: c.color === YELLOW ? '#000' : '#fff' }} />
              </div>
              <h3 className="font-display font-bold text-base text-ink mb-1">{c.title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>

        {/* ── Stats bar ─────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Active Pools', value: `${markets.length}`, icon: BarChart3, color: 'bg-neon-cyan' },
            { label: 'Top Daily Reward', value: markets.length > 0 ? `$${maxReward.toFixed(2)}` : '—', icon: DollarSign, color: 'bg-neon-lime' },
            { label: 'Avg Spread', value: markets.length > 0 ? `${(markets.reduce((s, m) => s + m.spread, 0) / markets.length * 100).toFixed(1)}¢` : '—', icon: ArrowUpDown, color: 'bg-brand-yellow' },
            { label: 'Markets Shown', value: `${filtered.length}`, icon: TrendingUp, color: 'bg-neon-green' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border-2 border-black shadow-pop-sm p-3 flex items-center gap-3">
              <div className={`${s.color} w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center flex-shrink-0`}>
                <s.icon className="w-4 h-4 text-black" />
              </div>
              <div className="min-w-0">
                <p className="font-display font-bold text-lg leading-tight truncate">{s.value}</p>
                <p className="text-[11px] text-ink-faint">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Controls ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              className="w-full pl-9 pr-3 py-2 border-2 border-black rounded-lg text-sm font-display bg-white shadow-pop-sm focus:outline-none focus:ring-2 focus:ring-brand-magenta/30"
              placeholder="Search markets…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-brand-yellow border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-black bg-white border-2 border-black rounded-lg px-3 py-2 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
          >
            <Filter className="w-4 h-4" />
            Sort
          </button>
          <span className="text-xs text-ink-faint">{filtered.length} markets</span>
          <ScannerLiveStatus updatedAt={updatedAt} />
        </div>

        {/* ── Filter chips ─────────────────────────────── */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ['dailyReward', 'Daily Reward'],
              ['spread', 'Spread'],
              ['volume24hr', '24h Volume'],
              ['liquidity', 'Liquidity'],
              ['competitiveness', 'Competitiveness'],
              ['minSize', 'Min Size'],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => handleSort(k)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-full border-2 border-black transition-colors ${
                  sortKey === k
                    ? 'bg-black text-white'
                    : 'bg-white text-ink hover:bg-black/5'
                }`}
              >
                {label}
                {sortKey === k && (sortDir === -1 ? ' ▼' : ' ▲')}
              </button>
            ))}
          </div>
        )}

        {/* ── Loading / Error ───────────────────────────── */}
        {loading && (
          <TableSkeleton
            template="1fr 90px 80px 80px 100px 100px 120px"
            label="Scanning Polymarket LP reward pools…"
            caption="First load takes a few seconds — after that, results load instantly."
          />
        )}

        {error && (
          <div className="bg-white rounded-xl border-2 border-black shadow-pop p-8 text-center">
            <p className="text-ink-muted">{error}</p>
          </div>
        )}

        {/* ── Results Table ─────────────────────────────── */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-black shadow-pop overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="px-4 py-3 text-left font-display text-xs uppercase tracking-wider" style={{ minWidth: 280 }}>Market</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('dailyReward')}>
                      <span className="flex items-center justify-center gap-1">$/Day {sortKey === 'dailyReward' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('spread')}>
                      <span className="flex items-center justify-center gap-1">Spread {sortKey === 'spread' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('minSize')}>
                      <span className="flex items-center justify-center gap-1">Min {sortKey === 'minSize' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('volume24hr')}>
                      <span className="flex items-center justify-center gap-1">24h Vol {sortKey === 'volume24hr' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('liquidity')}>
                      <span className="flex items-center justify-center gap-1">Liquidity {sortKey === 'liquidity' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider cursor-pointer hover:text-neon-lime select-none" onClick={() => handleSort('competitiveness')}>
                      <span className="flex items-center justify-center gap-1">Compete {sortKey === 'competitiveness' && (sortDir === -1 ? '▼' : '▲')}</span>
                    </th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">Ends</th>
                    <th className="px-3 py-3 text-center font-display text-xs uppercase tracking-wider">Prices</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m) => {
                    const days = daysUntil(m.endDate);
                    return (
                      <tr key={m.conditionId} data-hi={hiParam === m.conditionId ? 'true' : undefined} className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${hiParam === m.conditionId ? 'bg-brand-yellow/40' : ''}`} onClick={() => setSelectedMarket(m)}>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="flex items-center gap-1.5">
                            <div className="min-w-0 flex-1">
                              <div className="font-display font-semibold text-sm leading-tight truncate">{m.question}</div>
                              <div className="text-xs text-ink-faint mt-0.5">{m.slug}</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); copyRowLink(m.conditionId); }}
                              aria-label="Copy share link to this pool"
                              title="Copy share link"
                              className={`flex-shrink-0 p-1 rounded-md border-2 transition-colors ${
                                copiedKey === m.conditionId
                                  ? 'bg-neon-green border-black'
                                  : 'border-transparent text-ink-faint hover:text-ink hover:border-black/20'
                              }`}
                            >
                              {copiedKey === m.conditionId ? <span className="text-[10px] font-bold">✓</span> : <Link2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="font-mono text-sm font-bold" style={{ color: BRAND }}>${m.dailyReward.toFixed(2)}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`font-mono text-sm font-bold ${m.spread <= 0.02 ? 'text-neon-green' : m.spread <= 0.05 ? 'text-brand-yellow' : 'text-brand-pink'}`}>
                            {(m.spread * 100).toFixed(1)}¢
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-sm">{m.minSize > 0 ? m.minSize : '—'}</td>
                        <td className="px-3 py-3 text-center font-mono text-sm">{fmt$(m.volume24hr)}</td>
                        <td className="px-3 py-3 text-center font-mono text-sm">{fmt$(m.liquidity)}</td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-12 h-1.5 rounded-full bg-black/5">
                              <div className={`h-full rounded-full ${m.competitiveness > 0.7 ? 'bg-neon-green' : m.competitiveness > 0.4 ? 'bg-brand-yellow' : 'bg-brand-pink'}`} style={{ width: `${m.competitiveness * 100}%` }} />
                            </div>
                            <span className="text-xs text-ink-faint font-mono">{(m.competitiveness * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className={`text-xs font-mono ${days !== null && days < 7 ? 'text-brand-pink font-bold' : 'text-ink-faint'}`}>
                            {days !== null ? (days < 0 ? 'Ended' : days + 'd') : '—'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-xs">
                          <span className="text-neon-green">{(m.yesPrice * 100).toFixed(0)}¢</span>
                          <span className="text-ink-faint"> / </span>
                          <span className="text-brand-pink">{(m.noPrice * 100).toFixed(0)}¢</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden divide-y divide-gray-100">
              {filtered.map((m) => {
                const days = daysUntil(m.endDate);
                return (
                  <div key={m.conditionId} data-hi={hiParam === m.conditionId ? 'true' : undefined} className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${hiParam === m.conditionId ? 'bg-brand-yellow/40' : ''}`} onClick={() => setSelectedMarket(m)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-display font-semibold text-sm leading-tight mb-1 flex-1 min-w-0">{m.question}</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); copyRowLink(m.conditionId); }}
                        aria-label="Copy share link to this pool"
                        title="Copy share link"
                        className={`flex-shrink-0 p-1 rounded-md border-2 transition-colors ${
                          copiedKey === m.conditionId
                            ? 'bg-neon-green border-black'
                            : 'border-transparent text-ink-faint hover:text-ink hover:border-black/20'
                        }`}
                      >
                        {copiedKey === m.conditionId ? <span className="text-[10px] font-bold">✓</span> : <Link2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-mono font-bold" style={{ color: BRAND }}>${m.dailyReward.toFixed(2)}/day</span>
                      <span className={`font-mono ${m.spread <= 0.02 ? 'text-neon-green' : m.spread <= 0.05 ? 'text-brand-yellow' : 'text-brand-pink'}`}>
                        {(m.spread * 100).toFixed(1)}¢ spread
                      </span>
                      <span className="font-mono text-ink-faint">{fmt$(m.volume24hr)} vol</span>
                      {days !== null && days < 7 && <span className="text-brand-pink font-bold">{days}d left</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <p className="text-xs text-ink-faint mt-3">
          Data from Polymarket CLOB Rewards API + Gamma API · {filtered.length} markets with active LP rewards · Click any row for order book details
        </p>

        {/* ── Velocity Calculator ───────────────── */}
        <div className="mt-14 bg-white rounded-2xl border-2 border-black shadow-pop p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center" style={{ background: BRAND }}>
              <TrendingUp className="w-5 h-5 text-white" />
            </span>
            <div>
              <p className="text-xs font-bold text-ink-faint uppercase tracking-wide">Model your returns</p>
              <h2 className="font-display font-bold text-xl text-ink">Same $1,000. Six lives a day.</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Description */}
            <div>
              <p className="text-ink-secondary leading-relaxed mb-4">
                Static farming camps one book and takes whatever share the crowd leaves. The rotation re-enters at every opportunity with fresh capital against a decayed book — the pool share resets in your favor, over and over.
              </p>
              <div className={`rounded-xl border-2 border-black p-4 ${vDaily >= 100 ? 'bg-neon-green/10' : vDaily >= 60 ? 'bg-brand-yellow/10' : 'bg-brand-pink/10'}`}>
                <p className={`font-display font-bold text-sm ${vDaily >= 100 ? 'text-neon-green' : vDaily >= 60 ? 'text-brand-yellow' : 'text-brand-pink'}`}>
                  {vDaily >= 100 ? `TARGET CLEARED — $${vDaily.toFixed(0)}/day modeled`
                    : vDaily >= 60 ? `IN RANGE — $${vDaily.toFixed(0)}/day modeled`
                    : `NOT YET — $${vDaily.toFixed(0)}/day modeled`}
                </p>
                <p className="text-xs text-ink-secondary mt-1">
                  {vDaily >= 100
                    ? `The $100/day math works — via turnover, not one magic market. ${vN} entries at ${(vShare * 100).toFixed(0)}% average pool share.`
                    : vDaily >= 60
                    ? `$${(100 - vDaily).toFixed(0)} short of the target. Add ${Math.ceil(100 / vPerMatch) - vN} more entries or move entry timing later.`
                    : `At this rotation the target needs ~${vPerMatch > 0 ? Math.ceil(100 / vPerMatch) : '—'} entries or a larger bankroll.`}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-4">
              {[
                { label: 'Bankroll', value: `$${vCap.toLocaleString()}`, input: <input type="range" min={100} max={5000} step={100} value={vCap} onChange={(e) => setVCap(+e.target.value)} className="w-full accent-black" /> },
                { label: 'Entries / day', value: `${vN}`, input: <input type="range" min={1} max={10} step={1} value={vN} onChange={(e) => setVN(+e.target.value)} className="w-full accent-black" /> },
                { label: 'Avg pool size', value: `$${vPool}/day`, input: <input type="range" min={40} max={200} step={5} value={vPool} onChange={(e) => setVPool(+e.target.value)} className="w-full accent-black" /> },
              ].map((r) => (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-ink-faint uppercase">{r.label}</span>
                    <span className="font-mono font-bold text-sm text-ink">{r.value}</span>
                  </div>
                  {r.input}
                </div>
              ))}
              <div>
                <span className="text-xs font-bold text-ink-faint uppercase mb-1 block">Entry timing</span>
                <select value={vPhase} onChange={(e) => setVPhase(+e.target.value)} className="w-full px-3 py-2 border-2 border-black rounded-lg text-sm font-display bg-white">
                  <option value={1}>Opener — full book (×1.0 share)</option>
                  <option value={1.9}>Halftime break (×1.9 share)</option>
                  <option value={2.8}>Second half (×2.8 share)</option>
                  <option value={4.2}>Match point — clutch (×4.2 share)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-black/5 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-ink-faint uppercase">Pool share / entry</p>
              <p className="font-mono font-bold text-lg" style={{ color: NEON_CYAN }}>{(vShare * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-black/5 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-ink-faint uppercase">Per match</p>
              <p className="font-mono font-bold text-lg text-ink">${vPerMatch.toFixed(2)}</p>
            </div>
            <div className="bg-black/5 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-ink-faint uppercase">Entries to $100/d</p>
              <p className="font-mono font-bold text-lg text-brand-yellow">{vPerMatch > 0 ? Math.ceil(100 / vPerMatch) : '—'}</p>
            </div>
          </div>

          {/* Bars */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-ink-faint w-36 text-right">ONE STATIC MARKET</span>
              <div className="flex-1 h-3 rounded-full bg-black/5">
                <div className="h-full rounded-full bg-ink-faint/30" style={{ width: `${(vStaticD / (Math.max(vDaily, vStaticD, 100) * 1.12)) * 100}%` }} />
              </div>
              <span className="font-mono text-xs text-ink-faint w-16">${vStaticD.toFixed(0)}/d</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-ink-faint w-36 text-right">ROTATION STRATEGY</span>
              <div className="flex-1 h-3 rounded-full bg-black/5">
                <div className="h-full rounded-full bg-neon-green" style={{ width: `${(vDaily / (Math.max(vDaily, vStaticD, 100) * 1.12)) * 100}%` }} />
              </div>
              <span className="font-mono text-xs text-neon-green font-bold w-16">${vDaily.toFixed(0)}/d</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-ink-faint w-36 text-right">$100/DAY TARGET</span>
              <div className="flex-1 h-3 rounded-full bg-black/5">
                <div className="h-full rounded-full bg-brand-orange" style={{ width: `${(100 / (Math.max(vDaily, vStaticD, 100) * 1.12)) * 100}%` }} />
              </div>
              <span className="font-mono text-xs font-bold w-16" style={{ color: '#FF6B00' }}>$100</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrim + Drawer ────────────────────────────────── */}
      <div className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${selectedMarket ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSelectedMarket(null)} />
      {selectedMarket && (
        <aside className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl overflow-y-auto p-6 animate-in slide-in-from-right">
          <button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" onClick={() => setSelectedMarket(null)}>
            <X className="w-4 h-4" />
          </button>

          <p className="text-xs text-ink-faint font-mono mb-1">{selectedMarket.slug}</p>
          <h2 className="font-display font-bold text-xl text-ink uppercase tracking-tight mb-4 pr-8">{selectedMarket.question}</h2>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Daily Reward', value: `$${selectedMarket.dailyReward.toFixed(2)}`, color: 'text-brand-yellow' },
              { label: 'Spread', value: `${(selectedMarket.spread * 100).toFixed(1)}¢`, color: 'text-ink' },
              { label: '24h Volume', value: fmt$(selectedMarket.volume24hr), color: 'text-neon-green' },
              { label: 'Liquidity', value: fmt$(selectedMarket.liquidity), color: 'text-ink' },
            ].map((item) => (
              <div key={item.label} className="bg-black/5 rounded-xl p-3">
                <p className="text-[10px] font-bold text-ink-faint uppercase">{item.label}</p>
                <p className={`font-mono font-bold text-lg ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Reward config */}
          <h3 className="font-display font-bold text-sm text-ink mb-2">Reward Configuration</h3>
          <div className="text-sm text-ink-secondary space-y-1 mb-6">
            <div>Min size: <span className="font-bold text-ink">{selectedMarket.minSize || 'None'}</span></div>
            <div>Max spread: <span className="font-bold text-ink">{selectedMarket.maxSpread ? selectedMarket.maxSpread + '¢' : 'None'}</span></div>
            <div>Competitiveness: <span className="font-bold text-ink">{(selectedMarket.competitiveness * 100).toFixed(0)}%</span></div>
            <div>24h price change: <span className={`font-bold ${selectedMarket.priceChange24h >= 0 ? 'text-neon-green' : 'text-brand-pink'}`}>
              {selectedMarket.priceChange24h >= 0 ? '+' : ''}{(selectedMarket.priceChange24h * 100).toFixed(1)}%
            </span></div>
            {selectedMarket.endDate && (
              <div>Ends: <span className="font-bold text-ink">{new Date(selectedMarket.endDate).toLocaleDateString()}</span>
                <span className="text-ink-faint"> ({daysUntil(selectedMarket.endDate)} days)</span>
              </div>
            )}
          </div>

          {/* Order book */}
          <h3 className="font-display font-bold text-sm text-ink mb-2">Live Order Book</h3>
          {obLoading ? (
            <p className="text-sm text-ink-faint font-mono py-4">Loading order book…</p>
          ) : orderBook ? (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-neon-green/10 rounded-xl p-3 border border-neon-green/30">
                  <p className="text-[10px] font-bold text-ink-faint uppercase">Bids ({orderBook.bidCount})</p>
                  <p className="font-mono font-bold text-lg text-neon-green">${orderBook.bidDepth.toFixed(0)}</p>
                </div>
                <div className="bg-brand-pink/10 rounded-xl p-3 border border-brand-pink/30">
                  <p className="text-[10px] font-bold text-ink-faint uppercase">Asks ({orderBook.askCount})</p>
                  <p className="font-mono font-bold text-lg text-brand-pink">${orderBook.askDepth.toFixed(0)}</p>
                </div>
              </div>
              {orderBook.spread && (
                <p className="text-xs text-ink-faint mb-3">
                  Spread: <span className="font-bold text-ink">{(parseFloat(orderBook.spread) * 100).toFixed(1)}¢</span>
                  {' · '}Last: <span className="font-bold text-ink">{(parseFloat(orderBook.lastPrice) * 100).toFixed(1)}¢</span>
                </p>
              )}
              <div className="max-h-48 overflow-auto rounded-xl border border-black/10">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-black/5">
                      <th className="text-left px-3 py-1.5 text-neon-green">BID</th>
                      <th className="text-right px-3 py-1.5 text-neon-green">Size</th>
                      <th className="text-left px-3 py-1.5 text-brand-pink">ASK</th>
                      <th className="text-right px-3 py-1.5 text-brand-pink">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: Math.max(orderBook.bids.length, orderBook.asks.length) }).map((_, i) => (
                      <tr key={i} className="border-t border-black/5">
                        <td className="px-3 py-1 text-neon-green">{orderBook.bids[i] ? (parseFloat(orderBook.bids[i].price) * 100).toFixed(1) + '¢' : ''}</td>
                        <td className="px-3 py-1 text-right text-ink-faint">{orderBook.bids[i] ? '$' + parseFloat(orderBook.bids[i].size).toFixed(0) : ''}</td>
                        <td className="px-3 py-1 text-brand-pink">{orderBook.asks[i] ? (parseFloat(orderBook.asks[i].price) * 100).toFixed(1) + '¢' : ''}</td>
                        <td className="px-3 py-1 text-right text-ink-faint">{orderBook.asks[i] ? '$' + parseFloat(orderBook.asks[i].size).toFixed(0) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-faint py-4">
              {selectedMarket.tokenId ? 'No order book data' : 'No token ID available'}
            </p>
          )}

          <a
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl font-display font-bold text-sm border-2 border-black hover:bg-black/90 transition-colors"
            href={`https://polymarket.com/event/${selectedMarket.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            OPEN ON POLYMARKET <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[10px] text-ink-faint mt-3 text-center">
            Live data from Polymarket. Order book depth shows resting limit orders inside the current spread.
          </p>
        </aside>
      )}
    </div>
  );
}
