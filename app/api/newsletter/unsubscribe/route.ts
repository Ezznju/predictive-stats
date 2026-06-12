import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  const base = request.nextUrl.origin;

  if (!UUID_RE.test(token)) {
    return NextResponse.redirect(`${base}/newsletter/unsubscribed?status=invalid`);
  }

  const { data: removed, error } = await supabase.rpc('newsletter_unsubscribe', {
    p_token: token,
  });

  if (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.redirect(`${base}/newsletter/unsubscribed?status=error`);
  }

  return NextResponse.redirect(
    `${base}/newsletter/unsubscribed${removed ? '' : '?status=invalid'}`
  );
}
