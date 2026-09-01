import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { submitIndexNow } from '@/lib/indexnow';
import { getArticles } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await getArticles();
    const rows = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
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
    }));
    rows.sort((a, b) => String(b.publish_date || '').localeCompare(String(a.publish_date || '')));
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
    title: body.title,
    slug: body.slug,
    excerpt: body.excerpt || '',
    content: body.content || '',
    featured_image: body.featuredImage || '',
    author_id: body.authorId || null,
    category_slug: body.categorySlug || null,
    tags: body.tags || [],
    publish_date: body.publishDate || new Date().toISOString().split('T')[0],
    updated_date: body.updatedDate || null,
    read_time: body.readTime || 5,
    featured: body.featured || false,
    status: body.status || 'draft',
    seo_title: body.seoTitle || null,
    meta_description: body.metaDescription || null,
    pull_quote: body.pullQuote || null,
  };

  const { data, error } = await supabaseAdmin
    .from('articles')
    .insert(row)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data?.category_slug && data?.slug) {
    const url = `https://predictionsmarketfans.com/${data.category_slug}/${data.slug}`;
    submitIndexNow([url]).catch(() => {});
  }

  return NextResponse.json(data, { status: 201 });
}
