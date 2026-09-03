import { NextResponse } from 'next/server';
import { fetchWalletProfileData } from '@/lib/pulse/wallet-data';
import { withPulseCache, PULSE_KEYS } from '@/lib/pulse/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { address: string } }
) {
  const address = params.address;

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
  }

  const result = await withPulseCache(PULSE_KEYS.walletProfile(address), () =>
    fetchWalletProfileData(address)
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
