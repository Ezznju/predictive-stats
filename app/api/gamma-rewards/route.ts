import { NextResponse } from 'next/server';
import { fetchGammaRewards } from '@/lib/esports/gamma-api';
import { withSharedCache } from '@/lib/scanner-cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const pools = await withSharedCache('gamma-rewards', fetchGammaRewards, {
      softTtlMs: 5 * 60_000,
      hardTtlMs: 30 * 60_000,
    });

    return NextResponse.json(
      { pools, cached: false, updatedAt: Date.now() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('[gamma-api]', err?.message);
    return NextResponse.json(
      { pools: [], cached: false, error: err?.message },
      { status: 500 }
    );
  }
}
