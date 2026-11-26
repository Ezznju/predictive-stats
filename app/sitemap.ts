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

  const baseUrl = (settings.siteUrl || 'https://predictionsmarketfans.com').replace(/\/+$/, '');

  // Fixed dates for truly static pages; real latest-article dates for dynamic hubs.
  const staticDate = new Date('2026-06-01');
  const latestArticleDate =
    articles.length > 0
      ? new Date(
          Math.max(
            ...articles.map((a) => new Date(a.updatedDate || a.publishDate).getTime())
          )
        )
      : staticDate;

  const latestByCategory = new Map<string, Date>();
  const latestByAuthor = new Map<string, Date>();
  for (const a of articles) {
    const d = new Date(a.updatedDate || a.publishDate);
    const prevCat = latestByCategory.get(a.categorySlug);
    if (!prevCat || d > prevCat) latestByCategory.set(a.categorySlug, d);
    const prevAuth = latestByAuthor.get(a.authorId);
    if (!prevAuth || d > prevAuth) latestByAuthor.set(a.authorId, d);
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: latestArticleDate, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/articles`, lastModified: latestArticleDate, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools`, lastModified: new Date('2026-11-26'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/tools/kalshi-combo-calculator`, lastModified: new Date('2026-11-26'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/tools/kalshi-fee-calculator`, lastModified: new Date('2026-11-26'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/tools/lp-scanner`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/tools/arbitrage-scanner`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/platforms`, lastModified: staticDate, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/newsletter`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/privacy`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclosure`, lastModified: staticDate, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/pulse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/pulse/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/polymarket-trending-markets`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/kalshi-trending-markets`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/kalshi-smart-money`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/embed`, lastModified: staticDate, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const articlePages = articles.map((a) => ({
    url: `${baseUrl}/${a.categorySlug}/${a.slug}`,
    lastModified: new Date(a.updatedDate || a.publishDate),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: latestByCategory.get(c.slug) || staticDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const authorPages = authors.map((a) => ({
    url: `${baseUrl}/author/${a.slug}`,
    lastModified: latestByAuthor.get(a.id) || staticDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  const platformPages = getPlatforms().map((p) => ({
    url: `${baseUrl}/platforms/${p.slug}`,
    lastModified: staticDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...articlePages, ...categoryPages, ...authorPages, ...platformPages];
}
