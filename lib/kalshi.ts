/**
 * Kalshi public API helpers for the Arbitrage Scanner.
 *
 * Kalshi's trade API v2 is public (no auth needed for reads):
 *  - api.elections.kalshi.com/trade-api/v2/events  → event listing
 *  - api.elections.kalshi.com/trade-api/v2/markets  → market details + pricing
 */

/* ── Types ─────────────────────────────────────────────────────────── */

export interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title: string;
  no_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  no_bid_dollars: string;
  no_ask_dollars: string;
  volume_fp: string;
  volume_24h_fp: string;
  open_interest_fp: string;
  status: string;
  close_time: string;
  expiration_time: string;
  last_price_dollars: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  category: string;
  sub_title: string;
  mutually_exclusive: boolean;
}

export interface KalshiMarketWithEvent extends KalshiMarket {
  eventTitle: string;
  category: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/* ── Fetch all events ──────────────────────────────────────────────── */

export async function fetchKalshiEvents(): Promise<KalshiEvent[]> {
  const allEvents: KalshiEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 10; page++) {
    const url = new URL(`${KALSHI_BASE}/events`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('status', 'open');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) break;
    const json = await res.json();
    const events: KalshiEvent[] = json.events ?? [];
    allEvents.push(...events);

    cursor = json.cursor;
    if (!cursor || events.length < 200) break;
  }

  return allEvents;
}

/* ── Fetch markets for specific event tickers ─────────────────────── */

export async function fetchKalshiMarketsForEvent(
  eventTicker: string
): Promise<KalshiMarket[]> {
  try {
    const url = new URL(`${KALSHI_BASE}/markets`);
    url.searchParams.set('event_ticker', eventTicker);
    url.searchParams.set('limit', '100');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.markets ?? [];
  } catch {
    return [];
  }
}

/* ── Fetch top markets by volume ──────────────────────────────────── */

export async function fetchTopKalshiMarkets(): Promise<KalshiMarketWithEvent[]> {
  // First get all events
  const events = await fetchKalshiEvents();
  const eventMap = new Map<string, KalshiEvent>();
  for (const ev of events) {
    eventMap.set(ev.event_ticker, ev);
  }

  // Fetch markets in batches — get all open markets
  const allMarkets: KalshiMarketWithEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < 5; page++) {
    const url = new URL(`${KALSHI_BASE}/markets`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('status', 'open');
    if (cursor) url.searchParams.set('cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!res.ok) break;
    const json = await res.json();
    const markets: KalshiMarket[] = json.markets ?? [];

    for (const m of markets) {
      const ev = eventMap.get(m.event_ticker);
      // Skip combo/MVE markets and ones with no real pricing
      if (m.event_ticker.startsWith('KXMVE')) continue;
      if (m.event_ticker.startsWith('KXMVC')) continue;

      allMarkets.push({
        ...m,
        eventTitle: ev?.title ?? m.title,
        category: ev?.category ?? 'Unknown',
      });
    }

    cursor = json.cursor;
    if (!cursor || markets.length < 200) break;
  }

  // Sort by volume and return top markets
  return allMarkets
    .filter((m) => parseFloat(m.volume_fp) > 0 || parseFloat(m.open_interest_fp) > 0)
    .sort((a, b) => parseFloat(b.volume_fp) - parseFloat(a.volume_fp));
}
