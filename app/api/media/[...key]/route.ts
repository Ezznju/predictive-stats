import { NextRequest, NextResponse } from 'next/server';
import { getR2Config, r2ObjectUrl, signedR2Headers } from '@/lib/r2';

export const runtime = 'nodejs';
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
    const headers = signedR2Headers('GET', url, '', r2);
    const object = await fetch(url, { headers });

    if (object.status === 404) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }
    if (!object.ok || !object.body) {
      const text = await object.text().catch(() => '');
      return NextResponse.json({ error: `R2 read failed: ${text}` }, { status: 502 });
    }

    const contentType = object.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await object.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
        'content-length': String(arrayBuffer.byteLength),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected media error' },
      { status: 500 }
    );
  }
}
