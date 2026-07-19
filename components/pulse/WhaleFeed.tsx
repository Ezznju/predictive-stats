'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { WhaleCard } from './WhaleCard';
import { FilterBar } from './FilterBar';
import type { WhaleFeedItem, PulseFilters } from '@/lib/pulse/types';

const DEFAULT_FILTERS: PulseFilters = {
  category: 'ALL',
  sort: 'newest',
  search: '',
  minSize: 0,
};

export function WhaleFeed() {
  const [trades, setTrades] = useState<WhaleFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PulseFilters>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/pulse/whale-feed?limit=50');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setTrades(json.data ?? []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchFeed, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchFeed]);

  // Apply filters
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

  if (filters.sort === 'largest') {
    filtered = [...filtered].sort((a, b) => b.usdcSize - a.usdcSize);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
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
      ) : filtered.length === 0 ? (
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
    </div>
  );
}
