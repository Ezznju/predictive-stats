'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Silently re-fetches the trending board every 60s (only while the tab is
 * visible) so humans always see live data. The board itself is
 * server-rendered (ISR), so crawlers always see fresh HTML too.
 */
export function TrendingRefresh({ intervalSec = 60 }: { intervalSec?: number }) {
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') router.refresh();
    }, intervalSec * 1000);
    return () => clearInterval(t);
  }, [router, intervalSec]);

  return null;
}
