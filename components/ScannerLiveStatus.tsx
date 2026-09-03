'use client';

import { useEffect, useState } from 'react';

/** Accepts epoch ms, ISO strings, or D1-style "YYYY-MM-DD HH:MM:SS" (UTC). */
function parseUpdated(v: string | number | null): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
    return Date.parse(v.replace(' ', 'T') + 'Z');
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

/**
 * Live data-freshness badge for scanner pages: pulsing LIVE when the data is
 * under ~2 min old, CACHED otherwise, plus a ticking "updated X ago" counter.
 * Renders a neutral state until mounted (hydration-safe), then ticks 1/s.
 */
export function ScannerLiveStatus({ updatedAt }: { updatedAt: string | number | null }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const ts = parseUpdated(updatedAt);
  const ageSec = ts && now ? Math.max(0, Math.floor((now - ts) / 1000)) : null;
  const live = ageSec !== null && ageSec < 120;
  const ago =
    ageSec === null
      ? 'just now'
      : ageSec < 60
        ? `${ageSec}s`
        : `${Math.floor(ageSec / 60)}m ${String(ageSec % 60).padStart(2, '0')}s`;

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border-2 border-black shadow-pop-sm ${
          live ? 'bg-neon-green' : 'bg-neon-lime'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full bg-black ${live ? 'animate-pulse' : ''}`} />
        {live ? 'Live' : 'Cached'}
      </span>
      <span className="text-xs text-ink-faint">Updated {ago} ago</span>
    </span>
  );
}
