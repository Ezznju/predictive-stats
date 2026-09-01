import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles } from '@/lib/db';

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

  const articles = await getPublishedArticles();
  const ranked = articles
    .map((article) => {
      const title = (article.title || '').toLowerCase();
      const excerpt = (article.excerpt || '').toLowerCase();
      const body = stripHtml(article.content || '').toLowerCase();
      const tags: string[] = article.tags ?? [];
      const score =
        countOccurrences(title, needle) * 10 +
        (tags.some((t) => t.toLowerCase().includes(needle)) ? 6 : 0) +
        countOccurrences(excerpt, needle) * 4 +
        Math.min(countOccurrences(body, needle), 10);
      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        featured_image: article.featuredImage,
        author_id: article.authorId,
        category_slug: article.categorySlug,
        tags: article.tags,
        publish_date: article.publishDate,
        read_time: article.readTime,
        featured: article.featured,
        status: article.status,
        _score: score,
      };
    })
    .sort(
      (a, b) =>
        b._score - a._score ||
        String(b.publish_date || '').localeCompare(String(a.publish_date || ''))
    )
    .slice(0, 24)
    .map(({ _score, ...row }) => row);

  return NextResponse.json(ranked);
}
