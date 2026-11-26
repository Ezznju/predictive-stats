import { NextRequest, NextResponse } from 'next/server';
import { cfWaitUntil } from '@/lib/cf-runtime';
import { getPlatformBySlug, getOutboundUrl } from '@/lib/platforms';
import { insertOutboundClick } from '@/lib/db';
export const runtime = 'edge';

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
  const country =
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('x-vercel-ip-city');
  const userAgent = request.headers.get('user-agent');

  // Track click reliably on Cloudflare Workers without blocking the 307 redirect.
  const p = insertOutboundClick({
    platform_slug: platform.slug,
    ctx,
    is_affiliate: isAffiliate,
    referer,
    country,
    user_agent: userAgent,
  });
  cfWaitUntil(p);
  try {
    await Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 300)),
    ]);
  } catch {}

  return NextResponse.redirect(url, 307);
}
