import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Access is enforced by middleware (session cookie required for /api/*
  // outside the public allow-list). The old ADMIN_API_TOKEN check here was
  // dead code — it compared against nothing and would have failed open.
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
