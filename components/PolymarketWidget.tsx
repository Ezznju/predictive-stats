'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, TrendingUp } from 'lucide-react';

const REFRESH_MS = 60_000;

const BAR_COLORS = ['#FF00B8', '#29C5F6', '#FFE642', '#2BD96E', '#9D5CFF', '#FF6B00'];

interface WidgetOutcome {
  label: string;
  price: number;
}

interface WidgetData {
  kind: 'market' | 'event';
  title: string;
  url: string;
  image: string | null;
  endDate: string | null;
  volume24hr: number;
  outcomes: WidgetOutcome[];
  fetchedAt: string;
}

interface Props {
  market?: string;
  event?: string;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${Math.round(v)}`;
}

function formatPct(price: number): string {
  const pct = price * 100;
  if (pct > 0 && pct < 1) return '<1%';
  if (pct > 99 && pct < 100) return '>99%';
  return `${Math.round(pct)}%`;
}

export function PolymarketWidget({ market, event }: Props) {
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const param = market ? `market=${encodeURIComponent(market)}` : `event=${encodeURIComponent(event || '')}`;
      const res = await fetch(`/api/polymarket?${param}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as WidgetData;
      setData(json);
      setError(false);
    } catch {
      setError(true);
    }
  }, [market, event]);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Fail quietly-but-gracefully: keep a small note instead of a broken card
  if (error && !data) {
    return (
      <div className="not-prose my-8 card-pop rounded-2xl bg-white p-5 text-sm text-ink-faint">
        Live odds are temporarily unavailable.{' '}
        <a
          href={market || event ? `https://polymarket.com/event/${event || market}` : 'https://polymarket.com'}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline"
        >
          View on Polymarket
        </a>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="not-prose my-8 card-pop rounded-2xl bg-white p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-28 rounded bg-gray-200" />
          <div className="h-5 w-3/4 rounded bg-gray-200" />
          <div className="h-8 w-full rounded bg-gray-100" />
          <div className="h-8 w-full rounded bg-gray-100" />
        </div>
      </div>
    );
  }

  const isBinary =
    data.kind === 'market' &&
    data.outcomes.length === 2 &&
    data.outcomes.some(o => o.label.toLowerCase() === 'yes');
  const yes = data.outcomes.find(o => o.label.toLowerCase() === 'yes');

  return (
    <div className="not-prose my-8 card-pop card-pop-hover rounded-2xl bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <span className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-ink">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-green opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-black bg-neon-green" />
          </span>
          Live odds · Polymarket
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-faint">
          <TrendingUp className="h-3.5 w-3.5" />
          {formatVolume(data.volume24hr)} 24h vol
        </span>
      </div>

      {/* Title */}
      <div className="flex items-start gap-3 px-5 pt-3">
        {data.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.image}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg border-2 border-black object-cover"
            loading="lazy"
          />
        )}
        <h4 className="font-display text-lg font-bold leading-snug text-ink">{data.title}</h4>
      </div>

      {/* Odds */}
      <div className="px-5 pb-4 pt-3">
        {isBinary && yes ? (
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-xl border-2 border-black bg-neon-lime px-4 py-2 shadow-pop-sm">
              <span className="font-display text-3xl font-extrabold text-ink">{formatPct(yes.price)}</span>
              <span className="ml-1 text-xs font-bold uppercase text-ink-muted">chance</span>
            </div>
            <div className="h-4 flex-1 overflow-hidden rounded-full border-2 border-black bg-gray-100">
              <div
                className="h-full rounded-r-full bg-neon-lime transition-all duration-700"
                style={{ width: `${Math.max(2, Math.min(100, yes.price * 100))}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {data.outcomes.map((o, i) => (
              <div key={o.label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 truncate text-sm font-bold text-ink" title={o.label}>
                  {o.label}
                </span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full border-2 border-black bg-gray-100">
                  <div
                    className="h-full rounded-r-full transition-all duration-700"
                    style={{
                      width: `${Math.max(2, Math.min(100, o.price * 100))}%`,
                      backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right font-display text-sm font-extrabold text-ink">
                  {formatPct(o.price)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t-2 border-black bg-brand-yellow/40 px-5 py-2.5">
        <span className="text-[11px] font-semibold text-ink-muted">Updates every 60s · Not financial advice</span>
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="btn-pop inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1 text-xs font-extrabold text-ink"
        >
          Trade on Polymarket
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
