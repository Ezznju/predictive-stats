import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Clock, Calendar, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { TableOfContents } from '@/components/TableOfContents';
import { GiscusComments } from '@/components/GiscusComments';
import { PolymarketEmbeds } from '@/components/PolymarketEmbeds';
import { TwitterEmbeds } from '@/components/TwitterEmbeds';
import { ShareButtons } from '@/components/ShareButtons';
import {
  getArticleBySlug,
  getPublishedArticles,
  getAuthorById,
  getCategoryBySlug,
  getRelatedArticles,
  getSiteSettings,
  getAuthors,
  getCategories,
  formatDate,
} from '@/lib/db';
import { autoLink } from '@/lib/auto-linker';
import { embedTools } from '@/lib/tool-embed';

export const dynamic = 'force-dynamic';

interface Props {
  params: { category: string; slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: 'Article Not Found' };
  const author = await getAuthorById(article.authorId);
  const categorySlug = params.category;

  const siteUrl = 'https://predictionsmarketfans.com';
  return {
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    alternates: { canonical: `${siteUrl}/${categorySlug}/${article.slug}` },
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      type: 'article',
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      publishedTime: article.publishDate,
      modifiedTime: article.updatedDate,
      authors: author ? [author.name] : undefined,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
    },
  };
}

function wrapTables(html: string): string {
  return html
    .replace(/<table(?![^>]*data-wrapped)/g, '<div class="table-scroll"><table')
    .replace(/<\/table>/g, '</table></div>');
}

function embedPolymarket(html: string): string {
  return html.replace(
    /(?:<p[^>]*>\s*)?\[polymarket(-event)?:\s*([a-z0-9][a-z0-9-]*)\s*\](?:\s*<\/p>)?/gi,
    (_match, isEvent, slug) =>
      `<div data-polymarket-${isEvent ? 'event' : 'market'}="${slug.toLowerCase()}"></div>`
  );
}

function embedYouTube(html: string): string {
  return html.replace(
    /(?:<p[^>]*>\s*)?\[youtube:\s*([^\]\s]+)\s*\](?:\s*<\/p>)?/gi,
    (_match, raw: string) => {
      let videoId = raw.trim();
      try {
        const url = new URL(videoId.startsWith('http') ? videoId : `https://${videoId}`);
        if (url.hostname.includes('youtu.be')) {
          videoId = url.pathname.slice(1).split('/')[0];
        } else if (url.hostname.includes('youtube.com')) {
          videoId = url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || videoId;
        }
      } catch {
        // Already a bare ID
      }
      videoId = videoId.split(/[?&#]/)[0];
      if (!videoId) return _match;
      return (
        `<div class="yt-embed"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" ` +
        `title="YouTube video" frameborder="0" loading="lazy" ` +
        `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ` +
        `allowfullscreen></iframe></div>`
      );
    }
  );
}

function embedTweet(html: string): string {
  return html.replace(
    /(?:<p[^>]*>\s*)?\[tweet:\s*(https?:\/\/(?:twitter|x)\.com\/[^\]\s]+)\s*\](?:\s*<\/p>)?/gi,
    (_match, url: string) => {
      const idMatch = url.match(/status\/(\d+)/);
      if (!idMatch) return _match;
      return `<div data-tweet-id="${idMatch[1]}"></div>`;
    }
  );
}

export default async function CategoryArticlePage({ params }: Props) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const [author, category, related, settings, allAuthors, allCategories] = await Promise.all([
    getAuthorById(article.authorId),
    getCategoryBySlug(article.categorySlug),
    getRelatedArticles(article, 3),
    getSiteSettings(),
    getAuthors(),
    getCategories(),
  ]);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.slug, c]));

  const categorySlug = params.category;
  const articleUrl = `${settings.siteUrl || 'https://predictionsmarketfans.com'}/${categorySlug}/${article.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    datePublished: article.publishDate,
    dateModified: article.updatedDate || article.publishDate,
    author: author
      ? { '@type': 'Person', name: author.name, url: `${settings.siteUrl || 'https://predictionsmarketfans.com'}/author/${author.slug}` }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: settings.siteName,
      url: settings.siteUrl,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    wordCount: article.content.split(/\s+/).length,
    articleSection: category?.name,
    keywords: article.tags.join(', '),
  };

  const siteUrl = settings.siteUrl || 'https://predictionsmarketfans.com';
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      ...(category
        ? [{ '@type': 'ListItem', position: 2, name: category.name, item: `${siteUrl}/${categorySlug}` }]
        : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name: article.title, item: articleUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ReadingProgressBar />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          {category ? (
            <>
              <Link href={`/category/${category.slug}`} className="hover:text-ink transition-colors">{category.name}</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          ) : (
            <>
              <Link href="/articles" className="hover:text-ink transition-colors">Articles</Link>
              <ChevronRight className="w-3 h-3" />
            </>
          )}
        </nav>

        {/* Header */}
        <header className="mb-8">
          {category && (
            <span
              className="category-badge mb-4 inline-block"
              style={{ backgroundColor: category.color, color: '#fff' }}
            >
              {category.name}
            </span>
          )}
          <h1
            className="article-title font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-[0.95] uppercase tracking-tight"
            dangerouslySetInnerHTML={{ __html: article.title }}
          />
          <p className="text-[16px] text-ink-secondary mt-4 leading-relaxed">{article.excerpt}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pb-6 border-b border-white/20">
            {author && (
              <Link href={`/author/${author.slug}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-[14px] font-medium text-ink group-hover:text-black transition-colors">{author.name}</span>
                  <span className="text-[12px] text-ink-muted block">{author.title}</span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-4 text-[14px] font-medium text-ink-muted ml-auto">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(article.publishDate)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featuredImage && (
          <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10 shadow-md">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
              priority
            />
          </div>
        )}

        {/* Table of Contents */}
        <TableOfContents />

        {/* Pull Quote */}
        {article.pullQuote && (
          <blockquote className="my-10 pl-6 border-l-[10px] border-black">
            <p className="font-display font-bold text-[clamp(20px,3vw,30px)] leading-[1.3] uppercase text-ink m-0">
              {article.pullQuote}
            </p>
          </blockquote>
        )}

        {/* Article Body */}
        <div
          className="prose prose-lg max-w-none
            prose-headings:font-display
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-ink prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:text-ink prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-ink-secondary prose-p:leading-relaxed
            prose-a:text-black prose-a:no-underline hover:prose-a:underline
            prose-strong:text-ink
            prose-blockquote:border-l-black prose-blockquote:text-ink-secondary
            prose-code:text-black prose-code:bg-white/15 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-li:text-ink-secondary"
          dangerouslySetInnerHTML={{ __html: autoLink(embedTweet(embedYouTube(embedPolymarket(embedTools(wrapTables(article.content)))))) }}
        />

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-white/20">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                className="px-3 py-1 text-xs bg-white/15 text-ink-secondary rounded-full border border-white/20 hover:bg-black hover:text-white hover:border-black transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Share */}
        <ShareButtons url={articleUrl} title={article.title} />

        {/* Hydrate live Polymarket odds embeds */}
        <PolymarketEmbeds />

        {/* Hydrate embedded tweets */}
        <TwitterEmbeds />

        {/* Author Bio */}
        {author && (
          <div className="mt-8 p-6 bg-white rounded-2xl border border-white/20 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <Link href={`/author/${author.slug}`} className="font-display font-bold text-ink hover:text-black transition-colors">{author.name}</Link>
                <p className="text-xs text-black mt-0.5">{author.title}</p>
                <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Inline Newsletter */}
        <div className="mt-10">
          <NewsletterBlock
            variant="inline"
            heading={settings.newsletterHeading}
            body={settings.newsletterBody}
          />
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-white/15 rounded-xl border border-white/20">
          <p className="text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink-secondary">Disclaimer:</strong> This content is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or trading guidance. Prediction market participation involves risk of loss. Always conduct your own research before making any financial decisions.
          </p>
        </div>

        {/* CTA Cards */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            href="/tools/lp-scanner"
            className="group relative block border-2 border-black bg-[#C6F23A] p-6 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all"
          >
            <span className="inline-block font-mono font-bold text-[10px] tracking-[0.12em] uppercase bg-white border-2 border-black px-2 py-0.5 mb-3">
              See the numbers
            </span>
            <h3 className="font-display font-bold text-2xl uppercase text-black mb-2">LP Scanner</h3>
            <p className="text-sm text-black/70 leading-relaxed">Rank every live Polymarket reward pool by competition, minimum capital, and yield per $1,000.</p>
            <span className="absolute top-5 right-5 w-8 h-8 bg-black text-[#C6F23A] rounded-full flex items-center justify-center font-mono font-bold text-sm group-hover:translate-x-1 group-hover:-rotate-8 transition-transform">
              →
            </span>
          </Link>
          <Link
            href="/tools/arbitrage-scanner"
            className="group relative block border-2 border-black bg-[#29C5F6] p-6 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all"
          >
            <span className="inline-block font-mono font-bold text-[10px] tracking-[0.12em] uppercase bg-white border-2 border-black px-2 py-0.5 mb-3">
              Find the spread
            </span>
            <h3 className="font-display font-bold text-2xl uppercase text-black mb-2">Arbitrage Scanner</h3>
            <p className="text-sm text-black/70 leading-relaxed">Compare odds across Polymarket, Kalshi, and Metaculus to find mispriced markets in real time.</p>
            <span className="absolute top-5 right-5 w-8 h-8 bg-black text-[#29C5F6] rounded-full flex items-center justify-center font-mono font-bold text-sm group-hover:translate-x-1 group-hover:-rotate-8 transition-transform">
              →
            </span>
          </Link>
        </div>

        {/* Comments */}
        <GiscusComments slug={article.slug} />
      </article>

      {/* Read Next */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-brand-green rounded-full" />
            <h2 className="font-display font-bold text-2xl text-ink">Read Next</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                author={authorMap.get(a.authorId)}
                category={categoryMap.get(a.categorySlug)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
