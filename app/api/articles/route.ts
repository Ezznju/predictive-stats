import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publish_date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
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
  return NextResponse.json(data, { status: 201 });
}
