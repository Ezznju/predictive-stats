import type { TrendingMarket } from './trending';

const KALSHI_EVENTS = 'https://api.elections.kalshi.com/trade-api/v2/events';
const MAX_PAGES = 8;

/**
 * Live "trending on Kalshi" board: open markets ranked by 24h volume.
 * Walks the events feed (nested markets), drops combo-shard titles, and
 * sorts by volume. Cached 5 min at the fetch layer; the page revalidates
 * on the same cadence. One uncached retry, then empty (ISR self-heals).
 */
async function fetchKalshiPage(limit: number, cursor: string): Promise<{ markets: any[]; cursor: string }> {
  const url =
    `${KALSHI_EVENTS}?limit=100&status=open&with_nested_markets=true` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
  const res = await fetch(url, {
    ...(limit > 0 ? { next: { revalidate: 300 } } : {}),
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
  if (!(vol > 0)) return null;
  const bid = Number(m.yes_bid_dollars ?? 0);
  const ask = Number(m.yes_ask_dollars ?? 0);
  const last = Number(m.last_price_dollars ?? 0);
  const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
  const prev = m.previous_price_dollars != null ? Number(m.previous_price_dollars) : null;
  const et = String(m.event_ticker ?? '');
  return {
    question: title,
    slug: String(m.ticker ?? ''),
    conditionId: String(m.ticker ?? ''),
    yesPrice: mid,
    noPrice: 1 - mid,
    volume24hr: vol,
    liquidity: Number(m.liquidity_dollars ?? 0),
    endDate: m.expiration_time ?? null,
        oneDayChange: prev != null && Number.isFinite(prev) ? last - prev : null,
        polyUrl: et ? `https://kalshi.com/markets/${et}` : 'https://kalshi.com',
        spreadCents: bid > 0 && ask > 0 ? (ask - bid) * 100 : null,
      };
}

export async function fetchKalshiTrending(limit = 25): Promise<TrendingMarket[]> {
  const attempt = async (cache: boolean): Promise<TrendingMarket[]> => {
    let cursor = '';
    const all: TrendingMarket[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const { markets, cursor: next } = await fetchKalshiPage(cache ? 1 : 0, cursor);
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
    if (first.length >= 10) return first;
    return await attempt(false);
  } catch {
    try {
      return await attempt(false);
    } catch {
      return [];
    }
  }
}
