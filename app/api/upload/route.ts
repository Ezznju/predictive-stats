import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getR2Config, publicMediaUrl, r2ObjectUrl, signedR2Headers } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extensionFromContentType(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  if (contentType === 'image/avif') return 'avif';
  return 'bin';
}

function slugifyFilePart(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/i, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image'
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'];
  // SVG intentionally excluded: it can carry <script> and would execute on
  // the media subdomain (stored-XSS host). Article images never need it.
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  try {
    const r2 = getR2Config();
    const ext = extensionFromContentType(file.type);
    const datePath = new Date().toISOString().slice(0, 10);
    const key = `articles/${datePath}/${randomUUID()}-${slugifyFilePart(file.name)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const url = r2ObjectUrl(key, r2);
    const headers = signedR2Headers('PUT', url, buffer, r2, {
      'content-type': file.type,
      'cache-control': 'public, max-age=31536000, immutable',
    });

    const upload = await fetch(url, { method: 'PUT', headers, body: buffer as unknown as BodyInit });
    if (!upload.ok) {
      const text = await upload.text().catch(() => '');
      return NextResponse.json({ error: `R2 upload failed: ${text}` }, { status: 502 });
    }

    return NextResponse.json({ url: publicMediaUrl(key, r2), key });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'R2 is not configured' },
      { status: 500 }
    );
  }
}
