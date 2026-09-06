const KALSHI_EVENTS = 'https://api.elections.kalshi.com/trade-api/v2/events';
const KALSHI_ORDERBOOK = 'https://api.elections.kalshi.com/trade-api/v2/markets';

export interface KalshiSignal {
  ticker: string;
  eventTicker: string;
  question: string;
  volume24h: number;
  yesPrice: number; // 0-1
  priceChangeCents: number | null; // 24h change in cents
  expiresAt: string | null;
  daysLeft: number | null;
  restingYes: number; // total YES dollars in book
  restingNo: number; // total NO dollars in book
  totalResting: number;
  biggestWall: { side: 'YES' | 'NO'; price: number; size: number } | null;
  kalshiUrl: string;
}

export interface KalshiSmartMoneyBoard {
  bigMoney: KalshiSignal[];
  momentum: KalshiSignal[];
  decisionWeek: KalshiSignal[];
  updatedAt: string;
}

interface RawMarket {
  ticker: string;
  event_ticker: string;
  title: string;
  volume_24h_fp: number;
  last_price_dollars: number;
  previous_price_dollars: number | null;
  yes_bid_dollars: number;
  yes_ask_dollars: number;
  expiration_time: string | null;
}

// ── module-level server cache (10 min) ──────────────────────────────────
let boardCache: { at: number; board: KalshiSmartMoneyBoard } | null = null;
const BOARD_TTL = 10 * 60 * 1000;

async function walkCatalog(): Promise<any[]> {
  const all: any[] = [];
  let cursor = '';
  for (let page = 0; page < 8; page++) {
    const url =
      `${KALSHI_EVENTS}?limit=100&status=open&with_nested_markets=true` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`Kalshi events ${res.status}`);
    const raw = await res.json();
    for (const e of raw?.events ?? []) {
      for (const m of e.markets ?? []) all.push(m);
    }
    cursor = raw?.cursor ?? '';
    if (!cursor) break;
  }
  return all;
}

async function fetchOrderbook(ticker: string): Promise<{ yes: [number, number][]; no: [number, number][] } | null> {
  return fetchOrderbookSafe(ticker);
}


export async function fetchKalshiSmartMoney(limit = 15): Promise<KalshiSmartMoneyBoard> {
  // serve from cache
  if (boardCache && Date.now() - boardCache.at < BOARD_TTL) return boardCache.board;

  const raw = await walkCatalog();
  const candidates = raw
    .filter((m) => {
      const title = String(m.title ?? '');
      const vol = Number(m.volume_24h_fp ?? 0);
      return title && !title.includes(',') && vol >= 500;
    })
    .sort((a, b) => Number(b.volume_24h_fp) - Number(a.volume_24h_fp))
    .slice(0, limit * 2);

  // Fetch orderbooks in parallel (top N by volume)
  const signals: KalshiSignal[] = [];
  const batch = candidates.slice(0, limit * 2);
  const books = await Promise.all(
    batch.map((m) => fetchOrderbook(m.ticker))
  );

  for (let i = 0; i < batch.length; i++) {
    const m = batch[i];
    const book = books[i];
    if (!book) continue;
    const bid = Number(m.yes_bid_dollars ?? 0);
    const ask = Number(m.yes_ask_dollars ?? 0);
    const last = Number(m.last_price_dollars ?? 0);
    const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
    const prev = m.previous_price_dollars != null ? Number(m.previous_price_dollars) : null;

    // Walls: find the largest resting level across both sides
    let wall: KalshiSignal['biggestWall'] | null = null;
    for (const lv of book.yes) {
      if (!wall || lv[1] > wall.size) wall = { side: 'YES', price: lv[0], size: lv[1] };
    }
    for (const lv of book.no) {
      if (!wall || lv[1] > wall.size) wall = { side: 'NO', price: lv[0], size: lv[1] };
    }

    const yesRest = book.yes.reduce((s, lv) => s + lv[1], 0);
    const noRest = book.no.reduce((s, lv) => s + lv[1], 0);

    signals.push({
      ticker: String(m.ticker ?? ''),
      eventTicker: String(m.event_ticker ?? ''),
      question: String(m.title ?? '').trim(),
      volume24h: Number(m.volume_24h_fp ?? 0),
      yesPrice: Math.min(99, Math.max(1, Math.round(mid * 100))) / 100,
      priceChangeCents: prev != null && Number.isFinite(prev) ? (last - prev) * 100 : null,
      expiresAt: m.expiration_time ?? null,
      daysLeft: m.expiration_time ? Math.ceil((new Date(m.expiration_time).getTime() - Date.now()) / 86_400_000) : null,
      restingYes: yesRest,
      restingNo: noRest,
      totalResting: yesRest + noRest,
      biggestWall: wall,
      kalshiUrl: m.event_ticker ? `https://kalshi.com/markets/${m.event_ticker}` : 'https://kalshi.com',
    });
  }

  // Big Money: ranked by total resting capital
  const bigMoney = [...signals].sort((a, b) => b.totalResting - a.totalResting).slice(0, limit);

  // Momentum: largest absolute price change among active markets
  const momentum = [...signals]
    .filter((s) => s.priceChangeCents != null && Math.abs(s.priceChangeCents) >= 0.5)
    .sort((a, b) => Math.abs(b.priceChangeCents!) - Math.abs(a.priceChangeCents!))
    .slice(0, limit);

  // Decision week: expiring within 14 days, ranked by volume
  const now = Date.now();
  const decisionWeek = [...signals]
    .filter((s) => {
      if (!s.expiresAt) return false;
      const d = new Date(s.expiresAt).getTime() - Date.now();
      return d > 0 && d <= 14 * 86_400_000;
    })
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);

  const board: KalshiSmartMoneyBoard = {
    bigMoney,
    momentum,
    decisionWeek,
    updatedAt: new Date().toISOString(),
  };
  boardCache = { at: Date.now(), board };
  return board;
}

async function fetchOrderbookSafe(ticker: string) {
  try {
    const res = await fetch(`${KALSHI_ORDERBOOK}/${encodeURIComponent(ticker)}/orderbook`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const raw = await res.json();
    const ob = raw?.orderbook_fp ?? {};
    return {
      yes: (ob.yes_dollars ?? []).map((lv: any) => [Number(lv[0] ?? 0), Number(lv[1] ?? 0)] as [number, number]),
      no: (ob.no_dollars ?? []).map((lv: any) => [Number(lv[0] ?? 0), Number(lv[1] ?? 0)] as [number, number]),
    };
  } catch {
    return null;
  }
}
