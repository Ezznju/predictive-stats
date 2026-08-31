import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { getR2Config, publicMediaUrl, r2ObjectUrl, signedR2Headers } from '@/lib/r2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extensionFromContentType(contentType: string) {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  if (contentType === 'image/avif') return 'avif';
  if (contentType === 'image/svg+xml') return 'svg';
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

function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  // Prefer R2 when configured (zero egress) - fallback to Supabase for local dev
  if (isR2Configured()) {
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
        { error: error instanceof Error ? error.message : 'Unexpected R2 upload error' },
        { status: 500 }
      );
    }
  }

  // Fallback: Supabase Storage (pre-R2, counts toward egress)
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `articles/${fileName}`;
  const buffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage.from('images').upload(filePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabaseAdmin.storage.from('images').getPublicUrl(filePath);
  return NextResponse.json({ url: urlData.publicUrl });
}
