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
  try {
    await Promise.race([
      insertOutboundClick({
        platform_slug: platform.slug,
        ctx,
        is_affiliate: isAffiliate,
        referer,
        country,
        user_agent: userAgent,
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 1200)),
    ]);
  } catch {}

  return NextResponse.redirect(url, 307);
}
