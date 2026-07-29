import { NextRequest, NextResponse } from 'next/server';
import { submitIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const urls: string[] = body.urls ?? [];

  if (!urls.length) {
    return NextResponse.json({ error: 'urls array required' }, { status: 400 });
  }

  const result = await submitIndexNow(urls);
  return NextResponse.json({ submitted: urls.length, ...result });
}
