import { NextRequest, NextResponse } from 'next/server';
import { d1Query, d1Execute, checkRateLimit } from '@/lib/d1';

const ALLOWED = ['fire', 'smart', 'accurate', 'watching', 'bullish'];

async function countsFor(slug: string): Promise<Record<string, number>> {
  const rows = await d1Query(
    'SELECT reaction, COUNT(*) as n FROM article_reactions WHERE slug = ? GROUP BY reaction',
    [slug]
  );
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.reaction] = Number(r.n);
  return counts;
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  if (!slug) return NextResponse.json({ counts: {} });
  try {
    return NextResponse.json({ counts: await countsFor(slug) });
  } catch {
    return NextResponse.json({ counts: {} });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug ?? '').slice(0, 200);
    const reaction = String(body.reaction ?? '');
    if (!slug || !ALLOWED.includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const ok = await checkRateLimit(`react:${ip}`, 20, 3600);
    if (!ok) return NextResponse.json({ error: 'Slow down' }, { status: 429 });
    await d1Execute('INSERT INTO article_reactions (slug, reaction) VALUES (?, ?)', [slug, reaction]);
    return NextResponse.json({ ok: true, counts: await countsFor(slug) });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
