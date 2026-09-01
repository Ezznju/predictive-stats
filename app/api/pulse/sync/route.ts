import { NextResponse } from 'next/server';
import { fetchLeaderboard, fetchTrades } from '@/lib/pulse/polymarket-data';
import { classifyWhalesFromLeaderboard } from '@/lib/pulse/whale-detection';
import { upsertPulseWallet, insertPulseWhaleTrade } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/pulse/sync
 * Admin-only: syncs top whale wallets + recent trades into D1
 * for grade-trades persistence. Uses live Polymarket Data API.
 */
export async function POST() {
  try {
    const leaderboard = await fetchLeaderboard({ limit: 20, orderBy: 'VOL', timePeriod: 'MONTH' });
    const whales = classifyWhalesFromLeaderboard(leaderboard).slice(0, 15);

    let walletsUpserted = 0;
    for (const w of whales) {
      await upsertPulseWallet({
        address: w.address,
        username: (w as any).username ?? null,
        bio: (w as any).bio ?? null,
        profile_image: (w as any).profileImage ?? null,
        x_username: (w as any).xUsername ?? null,
        rank: (w as any).rank ?? null,
        pnl: (w as any).pnl ?? 0,
        volume: (w as any).volume ?? 0,
        win_rate: (w as any).winRate ?? 0,
        trade_count: (w as any).tradeCount ?? 0,
        is_smart: !!(w as any).isSmart,
      });
      walletsUpserted++;
    }

    const sevenDaysAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
    let tradesInserted = 0;
    for (const w of whales) {
      try {
        const trades = await fetchTrades({ user: w.address, limit: 20 });
        for (const t of trades) {
          if (t.timestamp < sevenDaysAgo) continue;
          const usdcSize = Math.round(Number(t.size) * Number(t.price) * 100) / 100;
          if (usdcSize < 500) continue;
          await insertPulseWhaleTrade({
            wallet_address: t.proxyWallet,
            condition_id: t.conditionId,
            market_title: (t as any).title ?? null,
            market_slug: (t as any).slug ?? null,
            event_slug: (t as any).eventSlug ?? null,
            side: t.side as 'BUY' | 'SELL',
            outcome: t.outcome ?? null,
            size: Number(t.size),
            price: Number(t.price),
            usdc_size: usdcSize,
            tx_hash: (t as any).transactionHash ?? null,
            is_whale: true,
            anomaly_score: 0,
            detected_at: new Date(t.timestamp * 1000).toISOString(),
          });
          tradesInserted++;
        }
      } catch {}
    }

    return NextResponse.json({ ok: true, walletsUpserted, tradesInserted, whaleCount: whales.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
