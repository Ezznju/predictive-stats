/**
 * Refresh the arbitrage board into D1 (scanner_cache key: arbitrage-scanner).
 *
 * WHY: the arbitrage scan needs Kalshi access, which rate-limits Cloudflare's
 * shared egress. This runs the full scan on a GitHub Actions runner (normal
 * datacenter IP) and posts the pairs to the site's /api/board-ingest endpoint
 * (Bearer CRON_SECRET), which persists them. The site reads the cache.
 *
 * Run locally:  CRON_SECRET=... npx tsx scripts/refresh-arbitrage.ts
 */

import { scanArbitrage } from '@/lib/arbitrage-scan';

const INGEST_URL = process.env.INGEST_URL || 'https://predictive-stats.pages.dev/api/board-ingest';
const CRON_SECRET = process.env.CRON_SECRET || '';

async function main() {
  console.log('Running arbitrage scan (Polymarket x Kalshi)...');
  const t0 = Date.now();
  const pairs = await scanArbitrage();
  console.log(`scan complete: ${pairs.length} pairs in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  pairs.slice(0, 25).forEach((p, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. [${p.category}] ${p.eventName.slice(0, 58)} — arb ${p.arbPercent.toFixed(2)}% (match ${(p.matchScore * 100).toFixed(0)}%)`
    );
  });

  if (!CRON_SECRET) throw new Error('CRON_SECRET required to ingest');
  if (pairs.length === 0) throw new Error('scan returned 0 pairs — not ingesting');

  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CRON_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ arbitrage: pairs }),
    signal: AbortSignal.timeout(30000),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(`ingest failed: ${res.status} ${JSON.stringify(j).slice(0, 150)}`);
  console.log(`ingested via ${INGEST_URL}: arbitrage pairs=${j.arbitrage}`);
}

main().catch((e) => {
  console.error('REFRESH FAILED:', e.message);
  process.exit(1);
});
