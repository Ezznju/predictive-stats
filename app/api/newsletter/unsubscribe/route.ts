import { NextRequest, NextResponse } from 'next/server';
import { newsletterUnsubscribe } from '@/lib/db';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const base = request.nextUrl.origin;

  if (!UUID_RE.test(token)) {
    return NextResponse.redirect(`${base}/newsletter/unsubscribed?status=invalid`);
  }

  try {
    const removed = await newsletterUnsubscribe(token);
    return NextResponse.redirect(
      `${base}/newsletter/unsubscribed${removed ? '' : '?status=invalid'}`
    );
  } catch {
    return NextResponse.redirect(`${base}/newsletter/unsubscribed?status=error`);
  }
}
