import { Metadata } from 'next';
import { ldJson } from '@/lib/json-ld';
import { DEFAULT_OG_IMAGE, SITE_URL } from '@/lib/seo-utils';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Get in touch with the Predictions Market Fans team — questions, pitches, corrections, and partnership inquiries.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/contact`,
    title: 'Contact | Predictions Market Fans',
    description:
      'Get in touch with the Predictions Market Fans team — questions, pitches, corrections, and partnership inquiries.',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact | Predictions Market Fans',
    description:
      'Get in touch with the Predictions Market Fans team — questions, pitches, corrections, and partnership inquiries.',
    images: ['/twitter-image'],
  },
};

const contactJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Predictions Market Fans',
  url: `${SITE_URL}/contact`,
  mainEntity: { '@id': `${SITE_URL}/#organization` },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Contact', item: `${SITE_URL}/contact` },
  ],
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(contactJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />
      {children}
    </>
  );
}
