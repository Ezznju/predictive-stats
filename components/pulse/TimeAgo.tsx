'use client';

import { useEffect, useState } from 'react';

/**
 * Ticking relative timestamp ("just now", "2m ago", "3h ago") for the
 * whale feed. Re-renders every 30s so rows age in place.
 */
export function TimeAgo({ ts, className }: { ts: number; className?: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const diff = Date.now() - ts * 1000;
  const label =
    diff < 60_000
      ? 'just now'
      : diff < 3_600_000
        ? `${Math.floor(diff / 60_000)}m ago`
        : diff < 86_400_000
          ? `${Math.floor(diff / 3_600_000)}h ago`
          : `${Math.floor(diff / 86_400_000)}d ago`;

  return <span className={className}>{label}</span>;
}
