import { NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/pulse/polymarket-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') ?? 'OVERALL';
  const period = searchParams.get('period') ?? 'ALL';
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 50);
  const offset = Number(searchParams.get('offset') ?? 0);

  const key = PULSE_KEYS.leaderboard(category, period);

  const result = await withPulseCache(key, () =>
    fetchLeaderboard({ category, timePeriod: period, orderBy: 'PNL', limit, offset })
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
