import { NextResponse } from 'next/server';
import { fetchMarketStatsData } from '@/lib/pulse/market-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { conditionId: string } }
) {
  const conditionId = params.conditionId;

  const result = await withPulseCache(PULSE_KEYS.marketStats(conditionId), () =>
    fetchMarketStatsData(conditionId)
  );

  return NextResponse.json({
    data: result.payload,
    meta: {
      updatedAt: result.updatedAt,
      stale: result.stale,
      source: result.source,
    },
  });
}
