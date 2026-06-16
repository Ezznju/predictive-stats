import { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/db';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/go/', '/newsletter/unsubscribed'],
      },
    ],
    sitemap: `${settings.siteUrl || 'https://predictionsmarketfans.com'}/sitemap.xml`,
  };
}
