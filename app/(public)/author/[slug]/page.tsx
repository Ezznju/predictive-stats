import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Twitter, Linkedin, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getAuthorBySlug, getArticlesByAuthor, getAuthors, getCategories } from '@/lib/db';
import { cachedByKey, slimArticles } from '@/lib/isolate-cache';
import { DEFAULT_OG_IMAGE, SITE_URL, normalizeSocialUrl, stripHtml } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

const getCachedAuthorPage = cachedByKey(
  'author-page',
  10 * 60 * 1000,
  async (slug: string) => {
    const author = await getAuthorBySlug(slug);
    if (!author) return null;
    const [authorArticles, allAuthors, categories] = await Promise.all([
      getArticlesByAuthor(author.id),
      getAuthors(),
      getCategories(),
    ]);
    return { author, authorArticles: slimArticles(authorArticles), allAuthors, categories };
  }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCachedAuthorPage(params.slug);
  const author = data?.author;
  if (!author) return { title: 'Author Not Found' };
  const cleanBio = stripHtml(author.bio) || `Articles by ${author.name} on Predictions Market Fans.`;
  return {
    title: `${author.name} — Author`,
    description: cleanBio,
    alternates: { canonical: `${SITE_URL}/author/${author.slug}` },
    openGraph: {
      type: 'profile',
      url: `${SITE_URL}/author/${author.slug}`,
      title: `${author.name} | Predictions Market Fans`,
      description: cleanBio,
      images: author.avatar ? [{ url: author.avatar, alt: author.name }] : [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${author.name} | Predictions Market Fans`,
      description: cleanBio,
      images: author.avatar ? [author.avatar] : ['/twitter-image'],
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const data = await getCachedAuthorPage(params.slug);
  if (!data) notFound();

  const { author, authorArticles, allAuthors, categories } = data;

  const authorMap = new Map(allAuthors.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  const twitterUrl = normalizeSocialUrl(author.twitter, 'twitter');
  const linkedinUrl = normalizeSocialUrl(author.linkedin, 'linkedin');
  const cleanBio = stripHtml(author.bio);

  // Person structured data for author E-E-A-T signals
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.title || undefined,
    description: cleanBio || undefined,
    image: author.avatar || undefined,
    url: `${SITE_URL}/author/${author.slug}`,
    worksFor: { '@id': `${SITE_URL}/#organization` },
    sameAs: [twitterUrl, linkedinUrl].filter(Boolean),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: author.name, item: `${SITE_URL}/author/${author.slug}` },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd) }} />

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-6">
        <Link href="/" className="hover:text-black hover:underline transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" aria-hidden="true" />
        <span className="text-black font-bold">{author.name}</span>
      </nav>

      {/* Author header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-10 p-6 sm:p-8 bg-white rounded-2xl border-2 border-black shadow-pop">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-black shadow-pop-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={author.avatar}
            alt={author.name}
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl text-ink">{author.name}</h1>
          <p className="text-ink-muted font-semibold text-sm mt-1">{author.title}</p>
          <div
            className="text-ink-secondary mt-3 leading-relaxed max-w-2xl [&_a]:text-ink [&_a]:underline [&_a]:font-semibold [&_a:hover]:text-black"
            dangerouslySetInnerHTML={{ __html: author.bio }}
          />
          {(twitterUrl || linkedinUrl) && (
            <div className="flex items-center gap-3 mt-4">
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${author.name} on X (Twitter)`}
                  className="p-2 bg-brand-yellow border-2 border-black rounded-lg text-black shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                >
                  <Twitter className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
              {linkedinUrl && (
                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${author.name} on LinkedIn`}
                  className="p-2 bg-neon-cyan border-2 border-black rounded-lg text-black shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                >
                  <Linkedin className="w-4 h-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Articles */}
      <div className="flex items-center gap-3 mb-6">
        <div className="heading-chip bg-neon-green" />
        <h2 className="font-display font-bold text-2xl text-ink">Articles by {author.name}</h2>
        <span className="text-xs font-mono font-bold bg-white border-2 border-black rounded-full px-2.5 py-0.5">
          {authorArticles.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authorArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            author={authorMap.get(article.authorId)}
            category={categoryMap.get(article.categorySlug)}
          />
        ))}
      </div>
    </div>
  );
}
