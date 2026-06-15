/**
 * Cross-platform event matching & arbitrage detection.
 *
 * Strategy: match at EVENT level first (looser), then pair individual
 * markets within matched events using tighter sub-title matching.
 */

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
      if (isNaN(polyYesPrice) || polyYesPrice <= 0) continue;

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

export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];

  for (let offset = 0; offset < 500; offset += 100) {
    try {
      const url = new URL(`${GAMMA_BASE}/events`);
      url.searchParams.set('active', 'true');
      url.searchParams.set('closed', 'false');
      url.searchParams.set('limit', '100');
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('order', 'volume24hr');
      url.searchParams.set('ascending', 'false');

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        next: { revalidate: 0 },
      });

      if (!res.ok) break;
      const events = await res.json();
      if (!Array.isArray(events) || events.length === 0) break;

      for (const ev of events) {
        const markets: PolymarketMarket[] = (ev.markets ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) => ({
            id: m.id,
            question: m.question,
            outcomePrices: m.outcomePrices
              ? typeof m.outcomePrices === 'string'
                ? JSON.parse(m.outcomePrices)
                : m.outcomePrices
              : [],
            bestBid: m.bestBid || '',
            bestAsk: m.bestAsk || '',
            volume: m.volume || '0',
            volume24hr: m.volume24hr || 0,
            liquidity: m.liquidity || '0',
            slug: m.slug || '',
            image: m.image || '',
            groupItemTitle: m.groupItemTitle || '',
          })
        );

        allEvents.push({
          id: ev.id,
          title: ev.title,
          slug: ev.slug,
          markets,
        });
      }

      if (events.length < 100) break;
    } catch {
      break;
    }
  }

  return allEvents;
}
