import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'ADMIN_API_TOKEN is not configured' }, { status: 500 });
  }
  const daysRaw = parseInt(request.nextUrl.searchParams.get('days') ?? '30', 10);
  const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30;
  try {
    const data = await getAnalytics(days);
    return NextResponse.json(data);
  } catch (e: any) {
    console.error('analytics failed:', e?.message ?? e);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
