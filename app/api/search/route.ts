import { NextRequest, NextResponse } from 'next/server';
import { searchArticles } from '@/lib/db';

export const dynamic = 'force-dynamic';

function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    count++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return count;
}

export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  if (raw.length < 2) return NextResponse.json([]);

  const q = raw.replace(/[,()"'\\{}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < 2) return NextResponse.json([]);

  const needle = q.toLowerCase();
  const rows = await searchArticles(q);

  const ranked = rows
    .map((row: any) => {
      const title = (row.title || '').toLowerCase();
      const excerpt = (row.excerpt || '').toLowerCase();
      const tags: string[] = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags ?? [];
      const score =
        countOccurrences(title, needle) * 10 +
        (tags.some((t) => t.toLowerCase().includes(needle)) ? 6 : 0) +
        countOccurrences(excerpt, needle) * 4;
      return { ...row, _score: score };
    })
    .sort(
      (a: any, b: any) =>
        b._score - a._score ||
        String(b.publish_date || '').localeCompare(String(a.publish_date || ''))
    )
    .slice(0, 24)
    .map(({ _score, ...row }: any) => row);

  return NextResponse.json(ranked);
}
