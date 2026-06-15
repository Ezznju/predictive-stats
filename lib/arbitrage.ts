/**
 * Cross-platform event matching & arbitrage detection.
 *
 * Matches events between Polymarket (gamma API) and Kalshi using
 * text similarity on event/market titles.
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
  /** Human-readable event/question name */
  eventName: string;
  /** Category */
  category: string;
  /** Match quality 0-1 */
  matchScore: number;

  /** Polymarket side */
  poly: {
    question: string;
    yesPrice: number;
    bestBid: number;
    bestAsk: number;
    volume24h: number;
    slug: string;
    image: string;
  };

  /** Kalshi side */
  kalshi: {
    question: string;
    yesPrice: number;
    yesBid: number;
    yesAsk: number;
    volume: number;
    ticker: string;
    eventTicker: string;
  };

  /** Absolute price difference (in cents) */
  priceDiffCents: number;
  /** Which side is cheaper for YES: 'polymarket' | 'kalshi' */
  cheaperYes: 'polymarket' | 'kalshi';
  /** Potential arbitrage percentage */
  arbPercent: number;
}

/* ── Text matching ─────────────────────────────────────────────────── */

/** Normalize text for comparison */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract meaningful keywords (skip common words) */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
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

  return new Set(
    normalize(text)
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.has(w))
  );
}

/** Jaccard similarity between two sets */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  const arrA = Array.from(a);
  for (let i = 0; i < arrA.length; i++) {
    if (b.has(arrA[i])) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/** Check if key entities match (names, years, specific terms) */
function entityOverlap(a: Set<string>, b: Set<string>): number {
  // Important entities: proper nouns, years, specific terms
  const arrA = Array.from(a);
  const arrB = Array.from(b);
  const importantA = arrA.filter((w) => /^[A-Z]|^\d{4}$/.test(w) || w.length > 4);
  const importantB = arrB.filter((w) => /^[A-Z]|^\d{4}$/.test(w) || w.length > 4);
  const setB = new Set(importantB);

  if (importantA.length === 0 || importantB.length === 0) return 0;

  let matches = 0;
  for (let i = 0; i < importantA.length; i++) {
    if (setB.has(importantA[i])) matches++;
  }

  return matches / Math.max(importantA.length, importantB.length);
}

/** Calculate match score between two event/market titles */
export function matchScore(textA: string, textB: string): number {
  const kwA = extractKeywords(textA);
  const kwB = extractKeywords(textB);

  const jaccard = jaccardSimilarity(kwA, kwB);
  const entity = entityOverlap(kwA, kwB);

  // Weighted combination — entity matches are more important
  return jaccard * 0.4 + entity * 0.6;
}

/* ── Matching engine ───────────────────────────────────────────────── */

interface KalshiMarketInput {
  ticker: string;
  event_ticker: string;
  title: string;
  yes_sub_title: string;
  eventTitle: string;
  category: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
}

export function findArbitragePairs(
  polyEvents: PolymarketEvent[],
  kalshiMarkets: KalshiMarketInput[]
): ArbitragePair[] {
  const pairs: ArbitragePair[] = [];
  const usedKalshi = new Set<string>();

  // For each Polymarket market, find the best matching Kalshi market
  for (const polyEvent of polyEvents) {
    for (const polyMarket of polyEvent.markets) {
      // Skip markets without pricing
      if (
        !polyMarket.outcomePrices ||
        polyMarket.outcomePrices.length < 2
      ) continue;

      const polyYesPrice = parseFloat(polyMarket.outcomePrices[0]);
      if (isNaN(polyYesPrice) || polyYesPrice <= 0) continue;

      // Build search text from polymarket
      const polyText = `${polyEvent.title} ${polyMarket.question} ${polyMarket.groupItemTitle || ''}`;

      let bestMatch: {
        kalshi: KalshiMarketInput;
        score: number;
      } | null = null;

      for (const kalshi of kalshiMarkets) {
        if (usedKalshi.has(kalshi.ticker)) continue;

        // Build search text from kalshi
        const kalshiText = `${kalshi.eventTitle} ${kalshi.yes_sub_title || kalshi.title}`;

        const score = matchScore(polyText, kalshiText);

        if (score > 0.3 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { kalshi, score };
        }
      }

      if (bestMatch) {
        const kalshi = bestMatch.kalshi;
        usedKalshi.add(kalshi.ticker);

        const kalshiYesBid = parseFloat(kalshi.yes_bid_dollars) || 0;
        const kalshiYesAsk = parseFloat(kalshi.yes_ask_dollars) || 0;
        const kalshiYesMid = kalshiYesAsk > 0 && kalshiYesBid > 0
          ? (kalshiYesBid + kalshiYesAsk) / 2
          : kalshiYesAsk > 0 ? kalshiYesAsk : kalshiYesBid;

        const polyBestBid = parseFloat(polyMarket.bestBid) || 0;
        const polyBestAsk = parseFloat(polyMarket.bestAsk) || 0;
        const polyMid = polyBestAsk > 0 && polyBestBid > 0
          ? (polyBestBid + polyBestAsk) / 2
          : polyYesPrice;

        const priceDiff = Math.abs(polyMid - kalshiYesMid);
        const priceDiffCents = Math.round(priceDiff * 100);
        const cheaperYes: 'polymarket' | 'kalshi' = polyMid < kalshiYesMid ? 'polymarket' : 'kalshi';

        // Arbitrage: buy low side YES + buy high side NO
        // Profit = price difference (simplified — ignores fees & execution risk)
        const avgPrice = (polyMid + kalshiYesMid) / 2;
        const arbPercent = avgPrice > 0 ? (priceDiff / avgPrice) * 100 : 0;

        pairs.push({
          eventName: polyEvent.title || polyMarket.question,
          category: kalshi.category,
          matchScore: bestMatch.score,

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
            question: kalshi.yes_sub_title || kalshi.title,
            yesPrice: kalshiYesMid,
            yesBid: kalshiYesBid,
            yesAsk: kalshiYesAsk,
            volume: parseFloat(kalshi.volume_fp) || 0,
            ticker: kalshi.ticker,
            eventTicker: kalshi.event_ticker,
          },

          priceDiffCents,
          cheaperYes,
          arbPercent,
        });
      }
    }
  }

  // Sort by arbitrage percentage descending
  return pairs.sort((a, b) => b.arbPercent - a.arbPercent);
}

/* ── Fetch Polymarket events with pricing ─────────────────────────── */

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

export async function fetchPolymarketEvents(): Promise<PolymarketEvent[]> {
  const allEvents: PolymarketEvent[] = [];

  // Fetch active events sorted by volume
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
