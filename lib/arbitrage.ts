/**
 * Cross-platform event matching & arbitrage detection.
 *
 * Strategy: match at EVENT level first (looser), then pair individual
 * markets within matched events using tighter sub-title matching.
 */

import { z } from 'zod';
import { safeFetchJson } from './safe-fetch';

/* ── Types ─────────────────────────────────────────────────────────── */

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string[];
  bestBid: string;
  bestAsk: string;
  volume: string;
  volume24hr: number;
  liquidity: string;
  slug: string;
  image: string;
  groupItemTitle: string;
}

export interface ArbitragePair {
  eventName: string;
  category: string;
  matchScore: number;

  poly: {
    question: string;
    yesPrice: number;
    bestBid: number;
    bestAsk: number;
    volume24h: number;
    slug: string;
    image: string;
  };

  kalshi: {
    question: string;
    yesPrice: number;
    yesBid: number;
    yesAsk: number;
    volume: number;
    ticker: string;
    eventTicker: string;
  };

  priceDiffCents: number;
  cheaperYes: 'polymarket' | 'kalshi';
  arbPercent: number;
}

/* ── Text matching helpers ─────────────────────────────────────────── */

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'is', 'be',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'has', 'have',
  'had', 'do', 'does', 'did', 'are', 'was', 'were', 'been', 'being',
  'this', 'that', 'these', 'those', 'it', 'its', 'or', 'and', 'but',
  'if', 'then', 'than', 'so', 'not', 'no', 'yes', 'any', 'all',
  'with', 'from', 'about', 'into', 'over', 'after', 'before',
  'between', 'under', 'during', 'through', 'above', 'below',
  'up', 'down', 'out', 'off', 'more', 'less', 'most', 'least',
  'win', 'next', 'new', 'become', 'what', 'who', 'when', 'where',
  'how', 'which', 'their', 'there', 'here', 'very', 'just',
]);

function extractKeywords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const arrA = Array.from(a);
  let intersection = 0;
  for (let i = 0; i < arrA.length; i++) {
    if (b.has(arrA[i])) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/* ── Kalshi types for matching ─────────────────────────────────────── */

interface KalshiEventInput {
  event_ticker: string;
  title: string;
  category: string;
}

interface KalshiMarketInput {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
}

/* ── Pre-match: find which Kalshi events are worth fetching ────────── */

export function preMatchEvents(
  polyEvents: PolymarketEvent[],
  kalshiEvents: KalshiEventInput[]
): Set<string> {
  const matchedTickers = new Set<string>();

  for (const polyEvent of polyEvents) {
    const polyKw = extractKeywords(polyEvent.title);
    if (polyKw.size === 0) continue;

    for (const kalshiEvent of kalshiEvents) {
      const kalshiKw = extractKeywords(kalshiEvent.title);
      const score = jaccardSimilarity(polyKw, kalshiKw);
      if (score >= 0.25) {
        matchedTickers.add(kalshiEvent.event_ticker);
      }
    }
  }

  return matchedTickers;
}

/* ── Core matching engine ──────────────────────────────────────────── */

export function findArbitragePairs(
  polyEvents: PolymarketEvent[],
  kalshiEvents: KalshiEventInput[],
  kalshiMarketsByEvent: Map<string, KalshiMarketInput[]>
): ArbitragePair[] {
  const pairs: ArbitragePair[] = [];
  const usedKalshiMarkets = new Set<string>();

  // Step 1: Match events using title keywords
  for (const polyEvent of polyEvents) {
    const polyKw = extractKeywords(polyEvent.title);
    if (polyKw.size === 0) continue;

    // Find best matching Kalshi event
    let bestEvent: { event: KalshiEventInput; score: number } | null = null;
    for (const kalshiEvent of kalshiEvents) {
      const kalshiKw = extractKeywords(kalshiEvent.title);
      const score = jaccardSimilarity(polyKw, kalshiKw);
      if (score >= 0.25 && (!bestEvent || score > bestEvent.score)) {
        bestEvent = { event: kalshiEvent, score };
      }
    }

    if (!bestEvent) continue;

    const kalshiEvent = bestEvent.event;
    const kalshiMarkets = kalshiMarketsByEvent.get(kalshiEvent.event_ticker) ?? [];
    if (kalshiMarkets.length === 0) continue;

    // Step 2: Within matched events, pair individual markets
    for (const polyMarket of polyEvent.markets) {
      if (!polyMarket.outcomePrices || polyMarket.outcomePrices.length < 2)
        continue;

      const polyYesPrice = parseFloat(polyMarket.outcomePrices[0]);
      if (isNaN(polyYesPrice) || polyYesPrice < 0) continue;

      // Build search text from polymarket market
      const polyQ = `${polyMarket.question} ${polyMarket.groupItemTitle || ''}`;
      const polyMKw = extractKeywords(polyQ);

      let bestMarket: { market: KalshiMarketInput; score: number } | null =
        null;

      for (const km of kalshiMarkets) {
        if (usedKalshiMarkets.has(km.ticker)) continue;

        const kalshiQ = `${km.yes_sub_title || km.title}`;
        const kalshiMKw = extractKeywords(kalshiQ);
        const mScore = jaccardSimilarity(polyMKw, kalshiMKw);

        // Market-level threshold: lower because markets within same event
        // should be related. Use 0.15 for market-level matching.
        if (mScore >= 0.15 && (!bestMarket || mScore > bestMarket.score)) {
          bestMarket = { market: km, score: mScore };
        }
      }

      if (!bestMarket) continue;

      const km = bestMarket.market;
      usedKalshiMarkets.add(km.ticker);

      // Combined score = event match * 0.4 + market match * 0.6
      const combinedScore = bestEvent.score * 0.4 + bestMarket.score * 0.6;

      // Calculate prices
      const kalshiYesBid = parseFloat(km.yes_bid_dollars) || 0;
      const kalshiYesAsk = parseFloat(km.yes_ask_dollars) || 0;
      const kalshiYesMid =
        kalshiYesAsk > 0 && kalshiYesBid > 0
          ? (kalshiYesBid + kalshiYesAsk) / 2
          : kalshiYesAsk > 0
            ? kalshiYesAsk
            : kalshiYesBid;

      if (kalshiYesMid <= 0) continue;

      const polyBestBid = parseFloat(polyMarket.bestBid) || 0;
      const polyBestAsk = parseFloat(polyMarket.bestAsk) || 0;
      const polyMid =
        polyBestAsk > 0 && polyBestBid > 0
          ? (polyBestBid + polyBestAsk) / 2
          : polyYesPrice;

      const priceDiff = Math.abs(polyMid - kalshiYesMid);
      const priceDiffCents = Math.round(priceDiff * 100);
      const cheaperYes: 'polymarket' | 'kalshi' =
        polyMid < kalshiYesMid ? 'polymarket' : 'kalshi';

      const avgPrice = (polyMid + kalshiYesMid) / 2;
      const arbPercent = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

      pairs.push({
        eventName: polyEvent.title || polyMarket.question,
        category: kalshiEvent.category,
        matchScore: combinedScore,

        poly: {
          question: polyMarket.question,
          yesPrice: polyYesPrice,
          bestBid: polyBestBid,
          bestAsk: polyBestAsk,
          volume24h: polyMarket.volume24hr || 0,
          slug: polyMarket.slug || polyEvent.slug,
          image: polyMarket.image || '',
        },

        kalshi: {
          question: km.yes_sub_title || km.title,
          yesPrice: kalshiYesMid,
          yesBid: kalshiYesBid,
          yesAsk: kalshiYesAsk,
          volume: parseFloat(km.volume_fp) || 0,
          ticker: km.ticker,
          eventTicker: km.event_ticker,
        },

        priceDiffCents,
        cheaperYes,
        arbPercent,
      });
    }
  }

  return pairs.sort((a, b) => b.arbPercent - a.arbPercent);
}

/* ── Fetch Polymarket events with pricing ─────────────────────────── */

const GAMMA_BASE = 'https://gamma-api.polymarket.com';
const MAX_EVENT_OFFSET = 500; // safety cap; loop normally exits on a short page

/**
 * Gamma `/events` returns a bare array. We validate the event-level shape
 * (the part that bit us before — the API returning an error object instead of
 * an array) and keep the per-market mapping defensive, since Gamma sends some
 * fields as strings and `outcomePrices` as a JSON-encoded string.
 */
const GammaEventSchema = z
  .object({
    id: z.union([z.string(), z.number()]).transform(String),
    title: z.string(),
    slug: z.string().optional().default(''),
    markets: z.array(z.unknown()).optional().default([]),
  })
  .passthrough();

const GammaEventsResponseSchema = z.array(GammaEventSchema);

export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];

  for (let offset = 0; offset < MAX_EVENT_OFFSET; offset += 100) {
    const url = new URL(`${GAMMA_BASE}/events`);
    url.searchParams.set('active', 'true');
    url.searchParams.set('closed', 'false');
    url.searchParams.set('limit', '100');
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('order', 'volume24hr');
    url.searchParams.set('ascending', 'false');

    let events: z.infer<typeof GammaEventsResponseSchema>;
    try {
      events = await safeFetchJson(
        url.toString(),
        GammaEventsResponseSchema,
        { next: { revalidate: 0 } } as RequestInit,
        { label: `polymarket events o${offset}` }
      );
    } catch (err) {
      // First page failing = real outage → throw so the route serves stale
      // cache. A later page failing = keep the events we already have.
      if (offset === 0) throw err;
      console.warn(`[polymarket] events page o${offset} failed:`, String(err));
      break;
    }

    if (events.length === 0) break;

    for (const ev of events) {
      const markets: PolymarketMarket[] = (
        (ev.markets ?? []) as Record<string, unknown>[]
      ).map((m) => ({
        id: String(m.id ?? ''),
        question: String(m.question ?? ''),
        outcomePrices: parseOutcomePrices(m.outcomePrices),
        bestBid: String(m.bestBid ?? ''),
        bestAsk: String(m.bestAsk ?? ''),
        volume: String(m.volume ?? '0'),
        volume24hr: typeof m.volume24hr === 'number' ? m.volume24hr : 0,
        liquidity: String(m.liquidity ?? '0'),
        slug: String(m.slug ?? ''),
        image: String(m.image ?? ''),
        groupItemTitle: String(m.groupItemTitle ?? ''),
      }));

      allEvents.push({
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        markets,
      });
    }

    if (events.length < 100) break;
  }

  return allEvents;
}

/** Gamma sends `outcomePrices` as a JSON-encoded string (or sometimes array). */
function parseOutcomePrices(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}
