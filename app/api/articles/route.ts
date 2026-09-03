import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getArticles, insertArticle } from '@/lib/db';
import { submitIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // ?summary=1 drops the heavy `content` field (list views don't need it —
    // full bodies are ~95% of the payload). Same keys otherwise.
    const summary = request.nextUrl.searchParams.get('summary') === '1';
    const articles = await getArticles();
    const rows = articles.map((a) => {
      const row: Record<string, unknown> = {
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        featured_image: a.featuredImage,
        author_id: a.authorId,
        category_slug: a.categorySlug,
        tags: a.tags,
        publish_date: a.publishDate,
        updated_date: a.updatedDate,
        read_time: a.readTime,
        featured: a.featured,
        status: a.status,
        seo_title: a.seoTitle,
        meta_description: a.metaDescription,
        pull_quote: a.pullQuote,
      };
      if (!summary) row.content = a.content;
      return row;
    });
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const row = {
    id: crypto.randomUUID(),
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || '',
    content: body.content || '',
    featured_image: body.featuredImage || '',
    author_id: body.authorId || null,
    category_slug: body.categorySlug || null,
    tags: JSON.stringify(body.tags || []),
    publish_date: body.publishDate || new Date().toISOString().split('T')[0],
    updated_date: body.updatedDate || null,
    read_time: body.readTime || 5,
    featured: body.featured ? 1 : 0,
    status: body.status || 'draft',
    seo_title: body.seoTitle || null,
    meta_description: body.metaDescription || null,
    pull_quote: body.pullQuote || null,
  };

  await insertArticle(row);
  revalidateTag('articles');

  if (row.category_slug && row.slug) {
    const url = `https://predictionsmarketfans.com/${row.category_slug}/${row.slug}`;
    submitIndexNow([url]).catch(() => {});
  }

  return NextResponse.json(row, { status: 201 });
}
