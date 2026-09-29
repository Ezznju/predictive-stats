import { NextResponse } from 'next/server';
import { fetchGammaRewards } from '@/lib/esports/gamma-api';
import { withSharedCache } from '@/lib/scanner-cache';
export const runtime = 'edge';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const result = await withSharedCache('gamma-rewards', fetchGammaRewards, {
      // Long soft TTL: in-isolate recomputes burn the 10ms free CPU budget.
      // Data comes from the shared D1 cache; 6h is the disaster backstop.
      softTtlMs: 55 * 60_000,
      hardTtlMs: 6 * 60 * 60_000,
    });

    return NextResponse.json(
      { pools: result.payload ?? [], cached: false, updatedAt: Date.now() },
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
