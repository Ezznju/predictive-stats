import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const FIELDS =
  'id,title,slug,excerpt,content,featured_image,author_id,category_slug,tags,publish_date,read_time,featured,status';

/** Strips HTML tags so we can rank matches against readable text only. */
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

/**
 * GET /api/search?q=term
 *
 * Full-text search over published articles using Postgres FTS (websearch
 * syntax) on title, excerpt and content, with an ILIKE fallback for
 * partial-word queries ("polymar" -> "polymarket"). Results are ranked by
 * where and how often the query matches, then recency.
 */
export async function GET(request: NextRequest) {
  const raw = (request.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  if (raw.length < 2) return NextResponse.json([]);

  // PostgREST `or=` filters use commas/parens as syntax — strip them out.
  const q = raw.replace(/[,()"'\\{}]/g, ' ').replace(/\s+/g, ' ').trim();
  if (q.length < 2) return NextResponse.json([]);

  // 1) Postgres full-text search (websearch syntax handles multi-word queries)
  let { data, error } = await supabase
    .from('articles')
    .select(FIELDS)
    .eq('status', 'published')
    .or(`title.wfts.${q},excerpt.wfts.${q},content.wfts.${q}`)
    .limit(40);

  // 2) Fallback: substring match for partial words FTS can't stem
  if (!error && (data ?? []).length === 0) {
    const like = `%${q}%`;
    ({ data, error } = await supabase
      .from('articles')
      .select(FIELDS)
      .eq('status', 'published')
      .or(`title.ilike.${like},excerpt.ilike.${like},content.ilike.${like}`)
      .limit(40));
  }

  if (error) {
    console.error('Search failed:', error.message);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  const needle = q.toLowerCase();
  const ranked = (data ?? [])
    .map((row: any) => {
      const title = (row.title || '').toLowerCase();
      const excerpt = (row.excerpt || '').toLowerCase();
      const body = stripHtml(row.content || '').toLowerCase();
      const tags: string[] = row.tags ?? [];
      const score =
        countOccurrences(title, needle) * 10 +
        (tags.some((t) => t.toLowerCase().includes(needle)) ? 6 : 0) +
        countOccurrences(excerpt, needle) * 4 +
        Math.min(countOccurrences(body, needle), 10);
      const { content: _content, ...rest } = row;
      return { ...rest, _score: score };
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
