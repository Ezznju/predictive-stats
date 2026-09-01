import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Analytics temporarily unavailable.' },
    { status: 503 }
  );
}
