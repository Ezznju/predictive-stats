import { getPublishedArticles, getCategories, getAuthors, getSiteSettings } from '@/lib/db';
import { slimArticles } from '@/lib/isolate-cache';
import { SITE_URL, stripHtml } from '@/lib/seo-utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteImageUrl(raw: string | undefined, baseUrl: string): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${baseUrl}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

export async function GET() {
  let articles: Awaited<ReturnType<typeof getPublishedArticles>> = [];
  let categoryNameBySlug = new Map<string, string>();
  let authorNameById = new Map<string, string>();
  let siteName = 'Predictions Market Fans';
  let siteDesc =
    'Independent prediction market analysis, live Polymarket & Kalshi scanners, whale tracking, and platform reviews.';
  let baseUrl = SITE_URL;

  try {
    const [rawArticles, categories, authors, settings] = await Promise.all([
      getPublishedArticles(),
      getCategories(),
      getAuthors(),
      getSiteSettings(),
    ]);
    articles = slimArticles(rawArticles).slice(0, 50);
    categoryNameBySlug = new Map(categories.map((c) => [c.slug, c.name]));
    authorNameById = new Map(authors.map((a) => [a.id, a.name]));
    if (settings.siteName) siteName = settings.siteName;
    if (settings.siteDescription) siteDesc = settings.siteDescription;
    if (settings.siteUrl) baseUrl = settings.siteUrl.replace(/\/+$/, '');
  } catch (err) {
    console.warn('[rss.xml] D1 unavailable, serving empty feed', err);
  }

  const lastBuildDate =
    articles.length > 0
      ? new Date(articles[0].updatedDate || articles[0].publishDate).toUTCString()
      : new Date().toUTCString();

  const itemsXml = articles
    .map((a) => {
      const link = `${baseUrl}/${a.categorySlug}/${a.slug}`;
      const title = escapeXml(stripHtml(a.title));
      const desc = escapeXml(stripHtml(a.metaDescription || a.excerpt));
      const pubDate = new Date(a.publishDate).toUTCString();
      const catName = categoryNameBySlug.get(a.categorySlug);
      const authorName = authorNameById.get(a.authorId);
      const imageUrl = toAbsoluteImageUrl(a.featuredImage, baseUrl);
      return [
        '    <item>',
        `      <title>${title}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        authorName ? `      <dc:creator>${escapeXml(authorName)}</dc:creator>` : '',
        catName ? `      <category>${escapeXml(catName)}</category>` : '',
        `      <description>${desc}</description>`,
        imageUrl ? `      <media:content url="${escapeXml(imageUrl)}" medium="image" />` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
