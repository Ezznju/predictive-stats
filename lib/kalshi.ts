/**
 * Kalshi public API helpers for the Arbitrage Scanner.
 *
 * Kalshi's trade API v2 is public (no auth needed for reads):
 *  - api.elections.kalshi.com/trade-api/v2/events  → event listing
 *  - api.elections.kalshi.com/trade-api/v2/markets  → market details + pricing
 *
 * All requests go through the resilient `safe-fetch` layer (timeout + retry +
 * 429 handling) and responses are validated with Zod so an upstream shape
 * change fails loudly instead of silently returning empty data.
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';

/* ── Schemas ───────────────────────────────────────────────────────── */

const KalshiMarketSchema = z
  .object({
    ticker: z.string(),
    event_ticker: z.string(),
    title: z.string().optional().default(''),
    yes_sub_title: z.string().optional().default(''),
    no_sub_title: z.string().optional().default(''),
    yes_bid_dollars: z.string().optional().default(''),
    yes_ask_dollars: z.string().optional().default(''),
    no_bid_dollars: z.string().optional().default(''),
    no_ask_dollars: z.string().optional().default(''),
    volume_fp: z.string().optional().default('0'),
    volume_24h_fp: z.string().optional().default('0'),
    open_interest_fp: z.string().optional().default('0'),
    status: z.string().optional().default(''),
    close_time: z.string().optional().default(''),
    expiration_time: z.string().optional().default(''),
    last_price_dollars: z.string().optional().default(''),
  })
  .passthrough();

const KalshiEventSchema = z
  .object({
    event_ticker: z.string(),
    title: z.string(),
    category: z.string().optional().default(''),
    sub_title: z.string().optional().default(''),
    mutually_exclusive: z.boolean().optional().default(false),
  })
  .passthrough();

const KalshiEventsResponseSchema = z.object({
  events: z.array(KalshiEventSchema).default([]),
  cursor: z.string().optional().default(''),
});

const KalshiMarketsResponseSchema = z.object({
  markets: z.array(KalshiMarketSchema).default([]),
  cursor: z.string().optional().default(''),
});

/* ── Types ─────────────────────────────────────────────────────────── */

export type KalshiMarket = z.infer<typeof KalshiMarketSchema>;
export type KalshiEvent = z.infer<typeof KalshiEventSchema>;

export interface KalshiMarketWithEvent extends KalshiMarket {
  eventTitle: string;
  category: string;
}

/* ── Constants ─────────────────────────────────────────────────────── */

const KALSHI_BASE = 'https://api.elections.kalshi.com/trade-api/v2';
const MAX_EVENT_PAGES = 10; // reduced for Vercel free tier (10s timeout)
const PAGE_DELAY_MS = 120; // politeness gap between pages — Kalshi rate-limits

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── Fetch all events ──────────────────────────────────────────────── */

export async function fetchKalshiEvents(): Promise<KalshiEvent[]> {
  const allEvents: KalshiEvent[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_EVENT_PAGES; page++) {
    const url = new URL(`${KALSHI_BASE}/events`);
    url.searchParams.set('limit', '200');
    url.searchParams.set('status', 'open');
    if (cursor) url.searchParams.set('cursor', cursor);

    let json: z.infer<typeof KalshiEventsResponseSchema>;
    try {
      json = await safeFetchJson(
        url.toString(),
        KalshiEventsResponseSchema,
        { next: { revalidate: 0 } } as RequestInit,
        { label: `kalshi events p${page}` }
      );
    } catch (err) {
      // First page failing = real outage → throw so the route serves stale
      // cache. A later page (e.g. mid-pagination 429) = keep what we have;
      // the pages already fetched are more than enough for matching.
      if (page === 0) throw err;
      console.warn(`[kalshi] events page ${page} failed:`, String(err));
      break;
    }

    allEvents.push(...json.events);
    cursor = json.cursor || undefined;
    if (!cursor || json.events.length < 200) break;

    await sleep(PAGE_DELAY_MS);
  }

  return allEvents;
}

/* ── Fetch markets for a single event (best-effort) ───────────────── */

export async function fetchKalshiMarketsForEvent(
  eventTicker: string
): Promise<KalshiMarket[]> {
  // Best-effort: one failed event shouldn't abort the whole scan.
  try {
    const url = new URL(`${KALSHI_BASE}/markets`);
    url.searchParams.set('event_ticker', eventTicker);
    url.searchParams.set('limit', '100');

    const json = await safeFetchJson(
      url.toString(),
      KalshiMarketsResponseSchema,
      { next: { revalidate: 0 } } as RequestInit,
      { label: `kalshi markets ${eventTicker}`, retries: 2 }
    );
    return json.markets;
  } catch (err) {
    console.warn(`[kalshi] markets fetch failed for ${eventTicker}:`, String(err));
    return [];
  }
}
