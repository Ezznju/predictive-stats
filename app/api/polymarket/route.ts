import { NextRequest, NextResponse } from 'next/server';

const GAMMA_API = 'https://gamma-api.polymarket.com';

export const dynamic = 'force-dynamic';

interface WidgetOutcome {
  label: string;
  price: number; // 0..1 probability
}

interface WidgetData {
  kind: 'market' | 'event';
  title: string;
  url: string;
  image: string | null;
  endDate: string | null;
  volume24hr: number;
  outcomes: WidgetOutcome[];
  fetchedAt: string;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function yesPrice(market: Record<string, unknown>): number | null {
  const outcomes = parseJsonArray(market.outcomes);
  const prices = parseJsonArray(market.outcomePrices);
  if (!outcomes.length || outcomes.length !== prices.length) return null;
  const yesIdx = outcomes.findIndex(o => o.toLowerCase() === 'yes');
  const idx = yesIdx >= 0 ? yesIdx : 0;
  const price = parseFloat(prices[idx]);
  return Number.isFinite(price) ? price : null;
}

async function fetchGamma(path: string): Promise<unknown> {
  const res = await fetch(`${GAMMA_API}${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Polymarket API responded ${res.status}`);
  return res.json();
}

function buildMarketData(market: Record<string, unknown>): WidgetData {
  const outcomes = parseJsonArray(market.outcomes);
  const prices = parseJsonArray(market.outcomePrices);
  const events = Array.isArray(market.events) ? (market.events as Record<string, unknown>[]) : [];
  const eventSlug = events[0]?.slug as string | undefined;
  return {
    kind: 'market',
    title: String(market.question || market.title || 'Polymarket market'),
    url: eventSlug
      ? `https://polymarket.com/event/${eventSlug}`
      : `https://polymarket.com/market/${String(market.slug || '')}`,
    image: (market.image as string) || null,
    endDate: (market.endDate as string) || null,
    volume24hr: Number(market.volume24hr) || 0,
    outcomes: outcomes.map((label, i) => ({
      label,
      price: parseFloat(prices[i] ?? '0') || 0,
    })),
    fetchedAt: new Date().toISOString(),
  };
}

function buildEventData(event: Record<string, unknown>): WidgetData {
  const markets = (Array.isArray(event.markets) ? event.markets : []) as Record<string, unknown>[];
  const ranked = markets
    .filter(m => m.active !== false && m.closed !== true)
    .map(m => ({
      label: String(m.groupItemTitle || m.question || 'Outcome'),
      price: yesPrice(m) ?? 0,
    }))
    .sort((a, b) => b.price - a.price)
    .slice(0, 5);

  return {
    kind: 'event',
    title: String(event.title || 'Polymarket event').trim(),
    url: `https://polymarket.com/event/${String(event.slug || '')}`,
    image: (event.image as string) || null,
    endDate: (event.endDate as string) || null,
    volume24hr: Number(event.volume24hr) || 0,
    outcomes: ranked,
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const marketSlug = searchParams.get('market');
  const eventSlug = searchParams.get('event');

  if (!marketSlug && !eventSlug) {
    return NextResponse.json({ error: 'Provide ?market=slug or ?event=slug' }, { status: 400 });
  }

  // Slugs are lowercase kebab-case on Polymarket
  const slugPattern = /^[a-z0-9][a-z0-9-]*$/i;
  const slug = (marketSlug || eventSlug || '').trim();
  if (!slugPattern.test(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    let data: WidgetData;
    if (marketSlug) {
      const markets = (await fetchGamma(`/markets?slug=${encodeURIComponent(slug)}`)) as Record<string, unknown>[];
      if (!Array.isArray(markets) || markets.length === 0) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      }
      data = buildMarketData(markets[0]);
    } else {
      const events = (await fetchGamma(`/events?slug=${encodeURIComponent(slug)}`)) as Record<string, unknown>[];
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      data = buildEventData(events[0]);
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err) {
    console.error('Polymarket proxy error:', err);
    return NextResponse.json({ error: 'Failed to fetch Polymarket data' }, { status: 502 });
  }
}
