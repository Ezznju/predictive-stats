import { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/db';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  const baseUrl = (settings.siteUrl || 'https://predictionsmarketfans.com').replace(/\/+$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/go/', '/newsletter/unsubscribed', '/search', '/embed/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
