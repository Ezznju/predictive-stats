import { NextRequest, NextResponse } from 'next/server';
import { getPlatformBySlug, getOutboundUrl } from '@/lib/platforms';
import { insertOutboundClick } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) {
    return NextResponse.redirect(new URL('/platforms', request.url), 307);
  }

  const { url, isAffiliate } = getOutboundUrl(platform);
  const ctx = request.nextUrl.searchParams.get('ctx');
  const referer = request.headers.get('referer');
  const country = request.headers.get('x-vercel-ip-country') ?? request.headers.get('x-vercel-ip-city');
  const userAgent = request.headers.get('user-agent');

  // Track click — await with timeout so D1 write completes before redirect
  let trackOk = false;
  let trackErr: string | null = null;
  try {
    await Promise.race([
      insertOutboundClick({
        platform_slug: platform.slug,
        ctx,
        is_affiliate: isAffiliate,
        referer,
        country,
        user_agent: userAgent,
      }).then(() => { trackOk = true; }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1200)),
    ]);
  } catch (e: any) {
    trackErr = e?.message ?? String(e);
  }
  // debug mode: ?debug=1 returns JSON instead of redirect
  if (request.nextUrl.searchParams.get('debug') === '1') {
    return NextResponse.json({ ok: trackOk, error: trackErr, platform: platform.slug, ctx, isAffiliate });
  }

  return NextResponse.redirect(url, 307);
}
