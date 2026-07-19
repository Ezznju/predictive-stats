import { MetadataRoute } from 'next';
import { getPublishedArticles, getCategories, getAuthors, getSiteSettings } from '@/lib/db';
import { getPlatforms } from '@/lib/platforms';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, authors, settings] = await Promise.all([
    getPublishedArticles(),
    getCategories(),
    getAuthors(),
    getSiteSettings(),
  ]);

  const baseUrl = settings.siteUrl || 'https://predictionsmarketfans.com';

  // Use a fixed date for truly static pages — only update when content actually changes.
  // This avoids wasting crawl budget on pages Google has already indexed.
  const staticDate = new Date('2025-06-01');

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/tools/lp-scanner`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools/arbitrage-scanner`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/platforms`, lastModified: staticDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/newsletter`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/search`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclosure`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/pulse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const articlePages = articles.map((a) => ({
    url: `${baseUrl}/${a.categorySlug}/${a.slug}`,
    lastModified: new Date(a.updatedDate || a.publishDate),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const authorPages = authors.map((a) => ({
    url: `${baseUrl}/author/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const platformPages = getPlatforms().map((p) => ({
    url: `${baseUrl}/platforms/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Collect unique tags from all articles for tag archive pages
  const tagSet = new Set<string>();
  for (const a of articles) {
    for (const t of a.tags ?? []) {
      tagSet.add(t.toLowerCase());
    }
  }
  const tagPages = Array.from(tagSet).map((tag) => ({
    url: `${baseUrl}/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  return [...staticPages, ...articlePages, ...categoryPages, ...authorPages, ...platformPages, ...tagPages];
}
