import { NextResponse } from 'next/server';
import { gradeMarketTrades, type GradedTrade } from '@/lib/pulse/outcome';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/pulse/grade-trades
 *
 * Body: { conditionId: string, resolution: 'YES' | 'NO' }
 *
 * Grades all whale trades for a resolved market and returns per-wallet stats.
 * Read-only — does NOT write to the database.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { conditionId, resolution } = body as {
      conditionId?: string;
      resolution?: string;
    };

    if (!conditionId || typeof conditionId !== 'string') {
      return NextResponse.json({ error: 'conditionId is required' }, { status: 400 });
    }

    if (resolution !== 'YES' && resolution !== 'NO') {
      return NextResponse.json({ error: 'resolution must be YES or NO' }, { status: 400 });
    }

    // Fetch whale trades for this market from our DB
    const { data: trades, error } = await supabaseAdmin
      .from('pulse_whale_trades')
      .select('wallet_address, condition_id, side, outcome, price, usdc_size')
      .eq('condition_id', conditionId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!trades || trades.length === 0) {
      return NextResponse.json({
        data: [],
        walletStats: {},
        message: 'No whale trades found for this market',
      });
    }

    // Format trades for grading
    const formatted = trades.map((t: {
      wallet_address: string;
      condition_id: string;
      side: string;
      outcome: string | null;
      price: number;
      usdc_size: number | null;
    }) => ({
      walletAddress: t.wallet_address,
      conditionId: t.condition_id,
      side: t.side as 'BUY' | 'SELL',
      outcome: t.outcome ?? 'YES',
      entryPrice: Number(t.price),
      usdcSize: Number(t.usdc_size ?? 0),
    }));

    const result = gradeMarketTrades(formatted, resolution);

    return NextResponse.json({
      conditionId,
      resolution,
      tradeCount: trades.length,
      graded: result.graded,
      walletStats: result.walletStats,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
