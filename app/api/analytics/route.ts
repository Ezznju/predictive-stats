import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Analytics temporarily unavailable — Supabase egress quota exceeded. Will restore after Sep 8.' },
    { status: 503 }
  );
}
