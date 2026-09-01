import { NextRequest, NextResponse } from 'next/server';
import { getPlatformBySlug, getOutboundUrl } from '@/lib/platforms';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const platform = getPlatformBySlug(params.slug);
  if (!platform) {
    return NextResponse.redirect(new URL('/platforms', request.url), 307);
  }

  const { url } = getOutboundUrl(platform);
  return NextResponse.redirect(url, 307);
}
