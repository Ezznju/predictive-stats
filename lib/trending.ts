import 'server-only';

export interface TrendingMarket {
  question: string;
  slug: string;
  conditionId: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  liquidity: number;
  endDate: string | null;
  oneDayChange: number | null;
  polyUrl: string;
}

const GAMMA = 'https://gamma-api.polymarket.com/markets';

async function fetchGamma(limit: number, cache: boolean): Promise<TrendingMarket[]> {
  const res = await fetch(
    `${GAMMA}?active=true&closed=false&order=volume24hr&ascending=false&limit=${limit}`,
    {
      ...(cache ? { next: { revalidate: 60 } } : {}),
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) throw new Error(`Gamma ${res.status}`);
  const raw = await res.json();
  const markets = (Array.isArray(raw) ? raw : raw?.data ?? []) as any[];
  return markets
    .map((m): TrendingMarket | null => {
      let prices: number[] = [];
      try {
        prices = JSON.parse(m.outcomePrices ?? '[]');
      } catch {
        /* leave empty */
      }
      const vol = Number(m.volume24hr ?? 0);
      if (!m.question || !(vol > 0)) return null;
      const yes = Number(prices[0] ?? 0);
      return {
        question: String(m.question),
        slug: String(m.slug ?? ''),
        conditionId: String(m.conditionId ?? ''),
        yesPrice: yes,
        noPrice: Number(prices[1] ?? 1 - yes),
        volume24hr: vol,
        liquidity: Number(m.liquidity ?? 0),
        endDate: m.endDate ?? null,
        oneDayChange: m.oneDayPriceChange != null ? Number(m.oneDayPriceChange) : null,
        polyUrl: `https://polymarket.com/event/${m.slug ?? ''}`,
      };
    })
    .filter((m): m is TrendingMarket => m !== null);
}

/**
 * Live "trending on Polymarket" board: active markets ranked by 24h volume.
 * Gamma API with one uncached retry; if both fail the page renders its
 * fallback card and ISR self-heals on the next request (60s).
 */
export async function fetchTrendingMarkets(limit = 25): Promise<TrendingMarket[]> {
  try {
    const first = await fetchGamma(limit, true);
    if (first.length >= 10) return first.slice(0, limit);
    throw new Error('gamma returned too few markets');
  } catch {
    try {
      const retry = await fetchGamma(limit, false);
      return retry.slice(0, limit);
    } catch {
      return [];
    }
  }
}
