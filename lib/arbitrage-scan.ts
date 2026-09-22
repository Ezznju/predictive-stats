import {
  fetchKalshiEvents,
  fetchKalshiMarketsForEvent,
  type KalshiMarket,
} from '@/lib/kalshi';
import {
  fetchPolymarketEvents,
  findArbitragePairs,
  preMatchEvents,
  type ArbitragePair,
} from '@/lib/arbitrage';
import { pMap } from '@/lib/async-utils';

/* ── Heavy scan: Polymarket × Kalshi cross-platform arbitrage ────────
   Shared by the /api/arbitrage-scanner route and the pre-warm cron
   (/api/cron/warm-scanners) so both compute identically. */

export async function scanArbitrage(): Promise<ArbitragePair[]> {
  // Step 1: fetch events from both platforms in parallel
  const [polyEvents, kalshiEvents] = await Promise.all([
    fetchPolymarketEvents(),
    fetchKalshiEvents(),
  ]);

  // Step 2: pre-match events by title similarity so we only fetch markets
  // for events that plausibly match (saves 150+ API calls). Sports included:
  // it's the largest overlapping category and where most live pairs are.
  const relevantKalshiEvents = kalshiEvents;
  const matchedTickers = preMatchEvents(polyEvents, relevantKalshiEvents);

  // Step 3: fetch markets only for matched Kalshi events, with bounded
  // concurrency so we never burst-fire requests and trip rate limits.
  const eventsToFetch = relevantKalshiEvents.filter((ev) =>
    matchedTickers.has(ev.event_ticker)
  );

  const results = await pMap(
    eventsToFetch,
    (ev) => fetchKalshiMarketsForEvent(ev.event_ticker),
    // 3-way concurrency: Kalshi's anonymous per-IP bucket is small, and
    // burst-firing 8 parallel requests tripped 429s for ~half the events.
    3
  );

  const kalshiMarketsByEvent = new Map<string, KalshiMarket[]>();
  results.forEach((markets, i) => {
    if (markets.length > 0) {
      kalshiMarketsByEvent.set(eventsToFetch[i].event_ticker, markets);
    }
  });

  console.log(
    `[arb-scan] poly=${polyEvents.length} kalshi=${kalshiEvents.length} pre-matched=${matchedTickers.size} to-fetch=${eventsToFetch.length} fetched-ok=${kalshiMarketsByEvent.size}`
  );

  return findArbitragePairs(
    polyEvents,
    relevantKalshiEvents,
    kalshiMarketsByEvent
  );
}
