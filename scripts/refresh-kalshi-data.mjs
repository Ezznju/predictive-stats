/**
 * Refresh Kalshi boards for the Cloudflare-hosted site.
 *
 * WHY THIS EXISTS: Kalshi's API rate-limits Cloudflare Workers' shared egress
 * IPs (persistent 429s) and the site now runs on Cloudflare Pages. This
 * script runs on a GitHub Actions runner (a normal datacenter IP), builds the
 * two Kalshi boards, and hands them to the site's /api/kalshi-ingest endpoint
 * (Bearer CRON_SECRET), which persists them to D1. The site reads snapshots
 * at request time.
 *
 * The runner holds NO Cloudflare credentials — only the ingest secret.
 *
 * Env:
 *   INGEST_URL    (optional; defaults to the production pages.dev URL)
 *   CRON_SECRET   (required for ingest mode)
 *   CLOUDFLARE_ACCOUNT_ID / D1_DATABASE_ID / CLOUDFLARE_API_TOKEN
 *                 (optional; direct-to-D1 mode for local runs)
 */

const INGEST_URL = process.env.INGEST_URL || 'https://predictive-stats.pages.dev/api/board-ingest';
const CRON_SECRET = process.env.CRON_SECRET || '';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const DATABASE_ID = process.env.D1_DATABASE_ID || '';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';
const D1_BASE = ACCOUNT_ID && DATABASE_ID ? `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}` : '';

const KALSHI_EVENTS = 'https://api.elections.kalshi.com/trade-api/v2/events';
const KALSHI_ORDERBOOK = 'https://api.elections.kalshi.com/trade-api/v2/markets';
const MAX_PAGES = 4;
const MAX_ORDERBOOKS = 8;
const MIN_VOLUME = 500;

async function kalshiFetch(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
      if (r.ok) return await r.json();
      if (i === tries - 1) throw new Error(`Kalshi ${r.status}: ${(await r.text()).slice(0, 120)}`);
    } catch (e) {
      if (i === tries - 1) throw e;
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  throw new Error('unreachable');
}

async function walkCatalog() {
  const all = [];
  let cursor = '';
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${KALSHI_EVENTS}?limit=100&status=open&with_nested_markets=true` + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : '');
    const raw = await kalshiFetch(url);
    for (const e of raw.events ?? []) for (const m of e.markets ?? []) all.push(m);
    cursor = raw.cursor ?? '';
    if (!cursor) break;
  }
  return all;
}

function snapCents(x) {
  return Math.min(99, Math.max(1, Math.round(x * 100))) / 100;
}

function eligible(m) {
  const title = String(m.title ?? '').trim();
  const vol = Number(m.volume_24h_fp ?? 0);
  return title && !title.includes(',') && vol >= MIN_VOLUME ? { title, vol } : null;
}

// ── Board 1: trending (mirrors lib/kalshi-trending.ts output) ───────────
function buildTrending(raw) {
  const markets = [];
  for (const m of raw) {
    const ok = eligible(m);
    if (!ok) continue;
    const bid = Number(m.yes_bid_dollars ?? 0);
    const ask = Number(m.yes_ask_dollars ?? 0);
    const last = Number(m.last_price_dollars ?? 0);
    const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
    const prev = m.previous_price_dollars != null ? Number(m.previous_price_dollars) : null;
    const yes = snapCents(mid);
    const et = String(m.event_ticker ?? '');
    markets.push({
      question: ok.title,
      slug: String(m.ticker ?? ''),
      conditionId: String(m.ticker ?? ''),
      yesPrice: yes,
      noPrice: 1 - yes,
      volume24hr: ok.vol,
      liquidity: Number(m.liquidity_dollars ?? 0),
      endDate: m.expiration_time ?? null,
      oneDayChange: prev != null && Number.isFinite(prev) ? last - prev : null,
      polyUrl: et ? `https://kalshi.com/markets/${et}` : 'https://kalshi.com',
      spreadCents: bid > 0 && ask > 0 ? Math.round((ask - bid) * 100) : null,
    });
  }
  markets.sort((a, b) => b.volume24hr - a.volume24hr);
  return markets.slice(0, 25);
}

// ── Board 2: smart money (mirrors lib/kalshi-smart-money.ts output) ─────
async function buildSmartMoney(raw) {
  const candidates = [];
  for (const m of raw) {
    const ok = eligible(m);
    if (!ok) continue;
    candidates.push({ m, title: ok.title, vol: ok.vol });
  }
  candidates.sort((a, b) => b.vol - a.vol);
  const batch = candidates.slice(0, MAX_ORDERBOOKS);

  const books = await Promise.all(
    batch.map(async (c) => {
      try {
        const raw2 = await kalshiFetch(`${KALSHI_ORDERBOOK}/${encodeURIComponent(c.m.ticker)}/orderbook`, 2);
        const ob = raw2?.orderbook_fp ?? {};
        return {
          yes: (ob.yes_dollars ?? []).map((lv) => [Number(lv[0] ?? 0), Number(lv[1] ?? 0)]),
          no: (ob.no_dollars ?? []).map((lv) => [Number(lv[0] ?? 0), Number(lv[1] ?? 0)]),
        };
      } catch {
        return null;
      }
    })
  );

  const signals = [];
  for (let i = 0; i < batch.length; i++) {
    const c = batch[i];
    const m = c.m;
    const book = books[i];
    if (!book) continue;
    const bid = Number(m.yes_bid_dollars ?? 0);
    const ask = Number(m.yes_ask_dollars ?? 0);
    const last = Number(m.last_price_dollars ?? 0);
    const mid = bid > 0 && ask > 0 ? (bid + ask) / 2 : last;
    const prev = m.previous_price_dollars != null ? Number(m.previous_price_dollars) : null;

    let wall = null;
    for (const lv of book.yes) if (!wall || lv[1] > wall.size) wall = { side: 'YES', price: lv[0], size: lv[1] };
    for (const lv of book.no) if (!wall || lv[1] > wall.size) wall = { side: 'NO', price: lv[0], size: lv[1] };

    const yesRest = book.yes.reduce((s, lv) => s + lv[1], 0);
    const noRest = book.no.reduce((s, lv) => s + lv[1], 0);
    const et = String(m.event_ticker ?? '');
    signals.push({
      ticker: String(m.ticker ?? ''),
      eventTicker: et,
      question: c.title,
      volume24h: c.vol,
      yesPrice: snapCents(mid),
      priceChangeCents: prev != null && Number.isFinite(prev) ? (last - prev) * 100 : null,
      expiresAt: m.expiration_time ?? null,
      daysLeft: m.expiration_time ? Math.ceil((new Date(m.expiration_time).getTime() - Date.now()) / 86_400_000) : null,
      restingYes: yesRest,
      restingNo: noRest,
      totalResting: yesRest + noRest,
      biggestWall: wall,
      kalshiUrl: et ? `https://kalshi.com/markets/${et}` : 'https://kalshi.com',
    });
  }

  const bigMoney = [...signals].sort((a, b) => b.totalResting - a.totalResting).slice(0, 15);
  const momentum = [...signals]
    .filter((s) => s.priceChangeCents != null && Math.abs(s.priceChangeCents) >= 0.5)
    .sort((a, b) => Math.abs(b.priceChangeCents) - Math.abs(a.priceChangeCents))
    .slice(0, 15);
  const now = Date.now();
  const decisionWeek = [...signals]
    .filter((s) => s.expiresAt && new Date(s.expiresAt).getTime() - now > 0 && new Date(s.expiresAt).getTime() - now <= 14 * 86_400_000)
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, 15);

  return { bigMoney, momentum, decisionWeek, updatedAt: new Date().toISOString() };
}

// ── Delivery: ingest endpoint first (no CF creds needed), D1 direct fallback ──
async function deliver(trending, smartMoney) {
  if (CRON_SECRET) {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trending, smartMoney }),
      signal: AbortSignal.timeout(20000),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.ok) throw new Error(`ingest failed: ${res.status} ${JSON.stringify(j).slice(0, 120)}`);
    console.log(`ingested via ${INGEST_URL}: trending=${j.trending} bigMoney=${j.bigMoney}`);
    return;
  }

  if (D1_BASE && API_TOKEN) {
    await writeSnapshot('kalshi-trending-board', trending);
    await writeSnapshot('kalshi-smart-money-board', smartMoney);
    console.log('D1 snapshots written directly: kalshi-trending-board, kalshi-smart-money-board');
    return;
  }

  throw new Error('No delivery configured: set CRON_SECRET (ingest mode) or CLOUDFLARE_* env vars (direct mode)');
}

async function main() {
  console.log('Fetching Kalshi catalog...');
  const raw = await walkCatalog();
  console.log(`catalog markets: ${raw.length}`);

  const trending = buildTrending(raw);
  console.log(`trending board: ${trending.length} markets (top: ${trending[0]?.question?.slice(0, 50)})`);

  const smart = await buildSmartMoney(raw);
  console.log(`smart money: bigMoney=${smart.bigMoney.length} momentum=${smart.momentum.length} decisionWeek=${smart.decisionWeek.length}`);

  await deliver(trending, smart);

  if (trending.length < 5) {
    console.error('WARNING: suspiciously small trending board — check Kalshi response');
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('REFRESH FAILED:', e.message);
  process.exit(1);
});
