import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return NextResponse.json(
    { error: 'Pulse grading temporarily unavailable — Supabase removed. Will restore with D1 table later.' },
    { status: 503 }
  );
}
