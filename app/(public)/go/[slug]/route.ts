import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPlatformBySlug, getOutboundUrl } from '@/lib/platforms';

export const dynamic = 'force-dynamic';

/**
 * Tracked outbound redirect: /go/polymarket?ctx=review-cta
 *
 * 1. Looks up the platform in lib/platforms.ts
 * 2. Best-effort logs the click to Supabase (outbound_clicks table)
 * 3. 307-redirects to the affiliate URL (AFFILIATE_URL_{SLUG} env var) or the plain website
 *
 * Tracking is fail-safe: if the table doesn't exist or the insert errors,
 * the visitor is still redirected instantly.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) {
    return NextResponse.redirect(new URL('/platforms', request.url), 307);
  }

  const { url, isAffiliate } = getOutboundUrl(platform);

  // Best-effort click logging — never block or break the redirect.
  try {
    const ctxRaw = request.nextUrl.searchParams.get('ctx') ?? '';
    const ctx = ctxRaw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || null;
    const insert = supabase.from('outbound_clicks').insert({
      platform_slug: platform.slug,
      ctx,
      is_affiliate: isAffiliate,
      referer: (request.headers.get('referer') ?? '').slice(0, 500) || null,
      country: request.headers.get('x-vercel-ip-country') ?? null,
      user_agent: (request.headers.get('user-agent') ?? '').slice(0, 300) || null,
    });
    // Give the insert up to 1.5s, then redirect regardless.
    await Promise.race([
      insert,
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Swallow — tracking must never break the redirect.
  }

  return NextResponse.redirect(url, 307);
}
