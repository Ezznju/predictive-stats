import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getArticleById, updateArticle, deleteArticle } from '@/lib/db';
import { submitIndexNow } from '@/lib/indexnow';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const article = await getArticleById(params.id);
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    featured_image: article.featuredImage,
    author_id: article.authorId,
    category_slug: article.categorySlug,
    tags: article.tags,
    publish_date: article.publishDate,
    updated_date: article.updatedDate,
    read_time: article.readTime,
    featured: article.featured,
    status: article.status,
    seo_title: article.seoTitle,
    meta_description: article.metaDescription,
    pull_quote: article.pullQuote,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const row: Record<string, any> = {};
  if (body.title !== undefined) row.title = body.title;
  if (body.slug !== undefined) row.slug = body.slug;
  if (body.excerpt !== undefined) row.excerpt = body.excerpt;
  if (body.content !== undefined) row.content = body.content;
  if (body.featuredImage !== undefined) row.featured_image = body.featuredImage;
  if (body.authorId !== undefined) row.author_id = body.authorId;
  if (body.categorySlug !== undefined) row.category_slug = body.categorySlug;
  if (body.tags !== undefined) row.tags = JSON.stringify(body.tags);
  if (body.publishDate !== undefined) row.publish_date = body.publishDate;
  if (body.updatedDate !== undefined) row.updated_date = body.updatedDate;
  if (body.readTime !== undefined) row.read_time = body.readTime;
  if (body.featured !== undefined) row.featured = body.featured ? 1 : 0;
  if (body.status !== undefined) row.status = body.status;
  if (body.seoTitle !== undefined) row.seo_title = body.seoTitle;
  if (body.metaDescription !== undefined) row.meta_description = body.metaDescription;
  if (body.pullQuote !== undefined) row.pull_quote = body.pullQuote;

  await updateArticle(params.id, row);
  revalidateTag('articles');

  if (row.category_slug && row.slug) {
    const url = `https://predictionsmarketfans.com/${row.category_slug}/${row.slug}`;
    submitIndexNow([url]).catch(() => {});
  }

  return NextResponse.json({ id: params.id, ...row });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await deleteArticle(params.id);
  revalidateTag('articles');
  return NextResponse.json({ ok: true });
}
