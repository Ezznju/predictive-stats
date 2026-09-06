import type { TrendingMarket } from './trending';

const KALSHI_EVENTS = 'https://api.elections.kalshi.com/trade-api/v2/events';
const MAX_PAGES = 8;
const MIN_VOLUME_24H = 500;
const BOARD_LIMIT = 25;

/**
 * Live "trending on Kalshi" board: open markets ranked by 24h volume.
 * Walks the events feed (nested markets), drops combo-shard titles, and
 * sorts by volume. Two layers of cache:
 *   1. module-level server cache (5 min TTL) so repeat renders are instant
 *   2. fetch-layer revalidate so repeat cold-starts in the same window are
 *      served by the fetch cache rather than re-walking the catalog
 */
type OgFont = { name: string; data: ArrayBuffer; weight: 700 | 500; style: 'normal' };

interface BoardCache {
  at: number;
  markets: TrendingMarket[];
}

let boardCache: BoardCache | null = null;
const BOARD_TTL = 5 * 60 * 1000;

async function fetchKalshiPage(cursor: string, cache: boolean): Promise<{ markets: any[]; cursor: string }> {
  const url =
    `${KALSHI_EVENTS}?limit=100&status=open&with_nested_markets=true` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
  const res = await fetch(url, {
    ...(cache ? { next: { revalidate: 300 } } : {}),
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`Kalshi ${res.status}`);
  const raw = await res.json();
  const out: any[] = [];
  for (const e of raw?.events ?? []) {
    for (const m of e.markets ?? []) {
      out.push({ ...m, _eventCategory: e.category ?? null });
    }
  }
  return { markets: out, cursor: raw?.cursor ?? '' };
}

function mapMarket(m: any): TrendingMarket | null {
  const title = String(m.title ?? '').trim();
  // Skip combo-shard titles ("yes X,yes Y,...") — unreadable as board rows.
  if (!title || title.includes(',')) return null;
  const vol = Number(m.volume_24h_fp ?? 0);
  // Volume floor: filters out the hundreds of near-dead markets so the
  // board only surfaces genuine activity.
  if (vol < 500) return null;

  const bid = Number(m.yes_bid_dollars ?? 0);
  const ask = Number(m.yes_ask_dollars ?? 0);
  const last = Number(m.last_price_dollars ?? 0);
  const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
  const prev = m.previous_price_dollars != null ? Number(m.previous_price_dollars) : null;
  const et = String(m.event_ticker ?? '');

  // Kalshi's own granularity is 1¢ — snap to it so 0.1¢ long-shots don't
  // render as "0¢" (which looks broken to a human scanning for action).
  const yes = Math.min(99, Math.max(1, Math.round(mid * 100)));

  return {
    question: title,
    slug: String(m.ticker ?? ''),
    conditionId: String(m.ticker ?? ''),
    yesPrice: yes / 100,
    noPrice: (100 - yes) / 100,
    volume24hr: vol,
    liquidity: Number(m.liquidity_dollars ?? 0),
    endDate: m.expiration_time ?? null,
    oneDayChange: prev != null && Number.isFinite(prev) ? last - prev : null,
    polyUrl: et ? `https://kalshi.com/markets/${et}` : 'https://kalshi.com',
    spreadCents: bid > 0 && ask > 0 ? Math.round((ask - bid) * 100) : null,
  };
}

export async function fetchKalshiTrending(limit = 25): Promise<TrendingMarket[]> {
  // Serve from module cache if fresh enough
  if (boardCache && Date.now() - boardCache.at < BOARD_TTL && boardCache.markets.length >= 10) {
    return boardCache.markets.slice(0, limit);
  }

  const attempt = async (cache: boolean): Promise<TrendingMarket[]> => {
    let cursor = '';
    const all: TrendingMarket[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const { markets, cursor: next } = await fetchKalshiPage(cursor, cache);
      for (const m of markets) {
        const mapped = mapMarket(m);
        if (mapped) all.push(mapped);
      }
      cursor = next;
      if (!cursor) break;
    }
    all.sort((a, b) => b.volume24hr - a.volume24hr);
    return all.slice(0, limit);
  };

  try {
    const first = await attempt(true);
    if (first.length >= 10) {
      boardCache = { at: Date.now(), markets: first };
      return first;
    }
    return await attempt(false);
  } catch {
    try {
      const retry = await attempt(false);
      if (retry.length >= 10) boardCache = { at: Date.now(), markets: retry };
      return retry;
    } catch {
      // Serve the stale cached board if it exists (better than nothing)
      if (boardCache && boardCache.markets.length >= 10) return boardCache.markets;
      return [];
    }
  }
}
