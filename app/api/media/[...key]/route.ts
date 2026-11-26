import { NextRequest, NextResponse } from 'next/server';
import { getR2Config, r2ObjectUrl, signedR2Headers } from '@/lib/r2';

// Edge runtime (Cloudflare Pages compatibility — no node:crypto/Buffer).
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string[] } }
) {
  try {
    const r2 = getR2Config();
    const key = params.key?.join('/');
    if (!key || key.includes('..')) {
      return NextResponse.json({ error: 'Invalid media key' }, { status: 400 });
    }

    const url = r2ObjectUrl(key, r2);
    const headers = await signedR2Headers('GET', url, '', r2);
    const object = await fetch(url, { headers });

    if (object.status === 404) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    if (!object.ok || !object.body) {
      const text = await object.text().catch(() => '');
      return NextResponse.json({ error: `R2 read failed: ${text}` }, { status: 502 });
    }

    const contentType = object.headers.get('content-type') || 'application/octet-stream';
    const responseHeaders: Record<string, string> = {
      'content-type': contentType,
      'cache-control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    };
    const contentLength = object.headers.get('content-length');
    if (contentLength) responseHeaders['content-length'] = contentLength;
    const etag = object.headers.get('etag');
    if (etag) responseHeaders['etag'] = etag;

    // Stream directly from R2 without buffering full files into Worker RAM
    return new NextResponse(object.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected media error' },
      { status: 500 }
    );
  }
}
