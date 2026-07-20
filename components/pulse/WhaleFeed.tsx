'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { WhaleCard, AggregatedCard } from './WhaleCard';
import { FilterBar } from './FilterBar';
import type { WhaleFeedItem, AggregatedWhaleCard, PulseFilters } from '@/lib/pulse/types';

const DEFAULT_FILTERS: PulseFilters = {
  category: 'ALL',
  sort: 'newest',
  search: '',
  minSize: 0,
};

export function WhaleFeed() {
  const [trades, setTrades] = useState<WhaleFeedItem[]>([]);
  const [cards, setCards] = useState<AggregatedWhaleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PulseFilters>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [minSize, setMinSize] = useState(0);
  const [view, setView] = useState<'aggregated' | 'raw'>('aggregated');

  const fetchFeed = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (minSize > 0) params.set('minSize', String(minSize));
      const res = await fetch(`/api/pulse/whale-feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setTrades(json.data ?? []);
      setCards(json.cards ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [minSize]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFeed, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFeed]);

  // Apply client-side filters to raw trades
  let filtered = trades;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.marketTitle.toLowerCase().includes(q) ||
        t.walletUsername.toLowerCase().includes(q) ||
        t.walletAddress.toLowerCase().includes(q)
    );
  }

  if (filters.minSize > 0) {
    filtered = filtered.filter((t) => t.usdcSize >= filters.minSize);
  }

  // Sort raw trades
  if (filters.sort === 'newest') {
    filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
  } else if (filters.sort === 'largest') {
    filtered = [...filtered].sort((a, b) => b.usdcSize - a.usdcSize);
  } else if (filters.sort === 'highest-conviction') {
    filtered = [...filtered].sort((a, b) => (b.convictionScore ?? 0) - (a.convictionScore ?? 0));
  }

  // Filter aggregated cards
  let filteredCards = cards;
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filteredCards = filteredCards.filter(
      (c) =>
        c.marketTitle.toLowerCase().includes(q) ||
        c.walletUsername.toLowerCase().includes(q) ||
        c.walletAddress.toLowerCase().includes(q)
    );
  }
  if (filters.minSize > 0) {
    filteredCards = filteredCards.filter((c) => c.totalUsdcSize >= filters.minSize);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold border-2 border-black rounded-full transition-all shadow-pop-sm ${
              autoRefresh
                ? 'bg-neon-green text-black'
                : 'bg-white text-ink-faint'
            }`}
          >
            {autoRefresh ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            {autoRefresh ? 'LIVE' : 'PAUSED'}
          </button>
          {lastUpdated && (
            <span className="text-[10px] text-ink-faint">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border-2 border-black rounded-lg overflow-hidden shadow-pop-sm">
            <button
              onClick={() => setView('aggregated')}
              className={`px-3 py-1 text-[10px] font-bold ${
                view === 'aggregated' ? 'bg-black text-white' : 'bg-white text-ink'
              }`}
            >
              AGGREGATED
            </button>
            <button
              onClick={() => setView('raw')}
              className={`px-3 py-1 text-[10px] font-bold ${
                view === 'raw' ? 'bg-black text-white' : 'bg-white text-ink'
              }`}
            >
              RAW TAPE
            </button>
          </div>

          {/* Size filter */}
          <div className="flex items-center gap-1.5 bg-white border-2 border-black rounded-lg px-2 py-1 shadow-pop-sm">
            <span className="text-[10px] text-ink-faint font-bold">MIN</span>
            <select
              value={minSize}
              onChange={(e) => setMinSize(Number(e.target.value))}
              className="text-[10px] font-bold bg-transparent border-none outline-none cursor-pointer"
            >
              <option value={0}>All</option>
              <option value={1000}>$1K</option>
              <option value={5000}>$5K</option>
              <option value={10000}>$10K</option>
              <option value={25000}>$25K</option>
              <option value={50000}>$50K</option>
            </select>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              fetchFeed();
            }}
            className="p-1.5 bg-white border-2 border-black rounded-lg shadow-pop-sm hover:-translate-y-0.5 transition-transform"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-ink ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={setFilters} />

      {/* Feed */}
      {error && !loading && trades.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-ink-faint">Failed to load whale feed: {error}</p>
          <button
            onClick={fetchFeed}
            className="mt-2 text-xs font-bold text-black underline"
          >
            Retry
          </button>
        </div>
      ) : loading && trades.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border-2 border-black rounded-xl p-4 shadow-pop-sm animate-pulse"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-black/10" />
                <div className="h-3 bg-black/10 rounded w-20" />
              </div>
              <div className="h-5 bg-black/10 rounded w-24 mb-2" />
              <div className="h-3 bg-black/10 rounded w-full" />
            </div>
          ))}
        </div>
      ) : view === 'aggregated' ? (
        <>
          {filteredCards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-ink-faint">No aggregated whale activity found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCards.map((card, i) => (
                <AggregatedCard key={`${card.walletAddress}-${card.conditionId}-${i}`} card={card} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-ink-faint">No whale trades found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((trade, i) => (
                <WhaleCard key={`${trade.txHash}-${trade.timestamp}-${i}`} trade={trade} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
