import { ldJson } from '@/lib/json-ld';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Clock, Calendar, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import { ReadingProgressBar } from '@/components/ReadingProgressBar';
import { HeadingAnchors } from '@/components/HeadingAnchors';
import { TableOfContents } from '@/components/TableOfContents';
import { GiscusComments } from '@/components/GiscusComments';
import { PolymarketEmbeds } from '@/components/PolymarketEmbeds';
import { TwitterEmbeds } from '@/components/TwitterEmbeds';
import { ShareButtons } from '@/components/ShareButtons';
import { ImageLightbox } from '@/components/ImageLightbox';
import { ReactionsBar } from '@/components/ReactionsBar';
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
import { cachedByKey, slimArticles } from '@/lib/isolate-cache';
import { SITE_URL, countWords, getContrastInk, stripHtml } from '@/lib/seo-utils';

export const dynamic = 'force-dynamic';

interface Props {
  params: { category: string; slug: string };
}

// Article views fired ~7 D1 REST round-trips each. Cache the whole data
// bundle per isolate for 10 min (Edge-safe: Cloudflare Workers don't support
// unstable_cache). List payloads are slimmed before caching because worker
// isolates have ~128MB and full article rows are ~60KB each.
const getCachedArticlePage = cachedByKey(
  'article-page',
  10 * 60 * 1000,
  async (slug: string) => {
    const article = await getArticleBySlug(slug);
    if (!article) return null;
    const [author, category, related, settings, allAuthors, allCategories, allPublished] = await Promise.all([
      getAuthorById(article.authorId),
      getCategoryBySlug(article.categorySlug),
      getRelatedArticles(article, 3),
      getSiteSettings(),
      getAuthors(),
      getCategories(),
      getPublishedArticles(),
    ]);
    // Chronological neighbours (list is newest-first): index-1 is newer ("next"),
    // index+1 is older ("previous"). Stops readers dead-ending at the last paragraph.
    const idx = allPublished.findIndex((a) => a.id === article.id);
    const nextArticle = idx > 0 ? allPublished[idx - 1] : null;
    const prevArticle = idx >= 0 && idx < allPublished.length - 1 ? allPublished[idx + 1] : null;
    return {
      article,
      author,
      category,
      related: slimArticles(related),
      settings,
      allAuthors,
      allCategories,
      prevArticle: prevArticle ? slimArticles([prevArticle])[0] : null,
      nextArticle: nextArticle ? slimArticles([nextArticle])[0] : null,
    };
  }
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCachedArticlePage(params.slug);
  if (!data) return { title: 'Article Not Found' };
  const { article, author } = data;
  const categorySlug = params.category;
  const cleanTitle = stripHtml(article.seoTitle || article.title);
  const cleanDesc = stripHtml(article.metaDescription || article.excerpt);

  return {
    title: cleanTitle,
    description: cleanDesc,
    alternates: { canonical: `${SITE_URL}/${categorySlug}/${article.slug}` },
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      type: 'article',
      url: `${SITE_URL}/${categorySlug}/${article.slug}`,
      title: cleanTitle,
      description: cleanDesc,
      publishedTime: article.publishDate,
      modifiedTime: article.updatedDate || article.publishDate,
      authors: author ? [author.name] : undefined,
      tags: article.tags,
      images: [{ url: `${SITE_URL}/${categorySlug}/${article.slug}/og?v=2`, width: 1200, height: 630, type: 'image/png', alt: cleanTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description: cleanDesc,
      images: [{ url: `${SITE_URL}/${categorySlug}/${article.slug}/og?v=2`, width: 1200, height: 630, type: 'image/png', alt: cleanTitle }],
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

/* ── Auto pull quote ──────────────────────────────────────────────────
 * Most articles have no manual pullQuote, so long reads have zero visual
 * rhythm. Extract one punchy sentence from the upper half and drop it in
 * after the 3rd paragraph. Skipped entirely if the article already has a
 * <blockquote> (it quotes itself) or is too short to need a break. */

const PQ_MIN = 80;
const PQ_MAX = 220;
const PQ_PUNCH = /\b(means|because|risk|fee|spread|payout|profit|mistake|never|always|actually|problem|truth|secret|myth|rule|price|market|money|wrong|right)\b/i;

function extractPullQuote(html: string): string | null {
  if (/<blockquote/i.test(html)) return null;
  const paras = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
  if (paras.length < 6) return null;
  const upper = paras.slice(0, Math.ceil(paras.length * 0.5));
  const candidates: { text: string; score: number }[] = [];
  upper.forEach((p, pi) => {
    const text = p.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    text.split(/(?<=[.!?])\s+/).forEach((raw) => {
      const s = raw.trim();
      const len = s.length;
      if (len < PQ_MIN || len > PQ_MAX) return;
      if (/https?:|www\.|[@#]/.test(s)) return;
      // reject lead-ins ("...following:") but keep normal . ! ? endings
      if (/[;:,]$/.test(s.replace(/[)"'”]+$/, ''))) return;
      const letters = s.replace(/[^a-zA-Z]/g, '');
      if (letters && letters === letters.toUpperCase()) return;
      let score = 0;
      if (/\d/.test(s)) score += 3;
      if (PQ_PUNCH.test(s)) score += 2;
      score += Math.max(0, 4 - pi);
      score -= Math.abs(140 - len) / 60;
      candidates.push({ text: s, score });
    });
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0].text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function insertPullQuote(html: string, quote: string, cite: string): string {
  const aside =
    `\n<aside class="not-prose auto-pullquote"><p>${quote}</p>` +
    `<cite>&mdash; ${cite}</cite></aside>\n`;
  const paras = html.match(/<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
  if (paras.length < 4) return html;
  const anchor = paras[2];
  const i = html.indexOf(anchor);
  if (i === -1) return html;
  return html.slice(0, i + anchor.length) + aside + html.slice(i + anchor.length);
}

// FAQPage schema from question-shaped H2/H3s followed by a paragraph. Lets
// articles win rich results for the exact questions people search (e.g. the
// Kalshi combos guide: "why can't I do combos on kalshi").
function extractFaq(html: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  const re = /<h[23][^>]*>([\s\S]*?)<\/h[23]>([\s\S]*?)(?=<h[23][^>]*>|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 8) {
    const q = m[1]
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^(troubleshooting|faq|q)\s*[:\-–]\s*/i, '');
    if (!q.endsWith('?')) continue;
    const para = m[2].match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!para) continue;
    const a = para[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (a.length < 40 || a.length > 1000) continue;
    out.push({ q, a });
  }
  return out;
}

export default async function CategoryArticlePage({ params }: Props) {
  const data = await getCachedArticlePage(params.slug);
  if (!data) notFound();

  const { article, author, category, related, settings, allAuthors, allCategories, prevArticle, nextArticle } = data;

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.slug, c]));

  const categorySlug = params.category;
  const siteUrl = (settings.siteUrl || SITE_URL).replace(/\/+$/, '');
  const articleUrl = `${siteUrl}/${categorySlug}/${article.slug}`;
  const cleanTitle = stripHtml(article.title);
  const cleanExcerpt = stripHtml(article.excerpt);
  const ogImageUrl = `${siteUrl}/${categorySlug}/${article.slug}/og?v=2`;
  const schemaImages = article.featuredImage ? [article.featuredImage, ogImageUrl] : [ogImageUrl];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cleanTitle,
    description: cleanExcerpt,
    image: schemaImages,
    datePublished: article.publishDate,
    dateModified: article.updatedDate || article.publishDate,
    inLanguage: 'en-US',
    author: author
      ? { '@type': 'Person', name: author.name, url: `${siteUrl}/author/${author.slug}` }
      : undefined,
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: settings.siteName || 'Predictions Market Fans',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/apple-touch-icon.png`,
        width: 180,
        height: 180,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    wordCount: countWords(article.content),
    articleSection: category?.name,
    keywords: article.tags.join(', '),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      ...(category
        ? [{ '@type': 'ListItem', position: 2, name: category.name, item: `${siteUrl}/category/${categorySlug}` }]
        : []),
      { '@type': 'ListItem', position: category ? 3 : 2, name: cleanTitle, item: articleUrl },
    ],
  };

  // Article body with embeds + auto-links, then an auto pull quote for long
  // reads that have no manual one (manual pullQuote keeps its top slot).
  const bodyHtml = autoLink(embedTweet(embedYouTube(embedPolymarket(embedTools(wrapTables(article.content))))));
  const autoQuote = article.pullQuote ? null : extractPullQuote(bodyHtml);
  const citeText = `${article.title.replace(/<[^>]*>/g, '')}, ${new Date(article.publishDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const finalBody = autoQuote ? insertPullQuote(bodyHtml, autoQuote, citeText) : bodyHtml;

  const faqPairs = extractFaq(finalBody);
  const faqJsonLd =
    faqPairs.length >= 2
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqPairs.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(jsonLd)}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(breadcrumbJsonLd)}} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(faqJsonLd)}} />
      )}
      <ReadingProgressBar />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8">
        <div className="xl:grid xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8 xl:items-start">
          {/* Desktop sticky TOC rail (true grid column — never clips or overlaps) */}
          <aside className="hidden xl:block pt-10 no-print">
            <TableOfContents variant="sidebar" readTime={article.readTime} />
          </aside>

          {/* Main article column */}
          <article className="min-w-0 max-w-4xl mx-auto w-full">
            {/* Breadcrumbs */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-black/80 mb-5 no-print">
              <Link href="/" className="hover:text-black hover:underline transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" aria-hidden="true" />
              {category ? (
                <>
                  <Link href={`/category/${category.slug}`} className="hover:text-black hover:underline transition-colors">{category.name}</Link>
                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </>
              ) : (
                <>
                  <Link href="/articles" className="hover:text-black hover:underline transition-colors">Articles</Link>
                  <ChevronRight className="w-3 h-3" aria-hidden="true" />
                </>
              )}
              <span className="text-black truncate max-w-[260px] sm:max-w-md">{cleanTitle}</span>
            </nav>

            {/* ── Warm editorial reading sheet (#FFFDF9 ivory paper, 66ch text measure) ── */}
            <div className="reading-sheet bg-[#FFFDF9] border-2 border-black rounded-2xl shadow-pop-lg p-5 sm:p-8 lg:p-12">

            {/* Magazine Header */}
            <header className="mb-8 max-w-[66ch] mx-auto">
              {/* Editorial kicker bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-black/10">
                <div>
                  {category && (
                    <Link
                      href={`/category/${category.slug}`}
                      className="category-badge border-2 border-black shadow-pop-sm inline-block hover:-translate-y-0.5 transition-transform"
                      style={{ backgroundColor: category.color, color: getContrastInk(category.color) }}
                    >
                      {category.name}
                    </Link>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {article.readTime} min read
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    {formatDate(article.publishDate)}
                  </span>
                  {article.updatedDate && article.updatedDate !== article.publishDate && (
                    <span className="text-[10px] font-bold text-ink bg-brand-yellow/60 border border-black/30 rounded px-1.5 py-0.5">
                      Updated {formatDate(article.updatedDate)}
                    </span>
                  )}
                </div>
              </div>

              <h1
                className="article-title font-display font-extrabold"
                dangerouslySetInnerHTML={{ __html: article.title }}
              />
              <p className="text-lg sm:text-xl text-ink-secondary mt-4 leading-relaxed">{article.excerpt}</p>

              {/* Author Byline */}
              {author && (
                <div className="flex items-center justify-between gap-4 mt-6 pt-5 border-t border-black/10">
                  <Link href={`/author/${author.slug}`} className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={author.avatar}
                        alt={author.name}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[14px] font-bold text-ink group-hover:text-brand-orange transition-colors">
                        {author.name}
                      </span>
                      <span className="text-[12px] text-ink-muted block">{author.title}</span>
                    </div>
                  </Link>
                </div>
              )}
            </header>

            {/* Featured Image */}
            {article.featuredImage && (
              <figure className="mb-10 max-w-[780px] mx-auto">
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border-2 border-black shadow-pop">
                  <Image
                    src={article.featuredImage}
                    alt={cleanTitle}
                    fill
                    className="object-cover"
                    sizes="(max-width: 896px) 100vw, 780px"
                    priority
                  />
                </div>
              </figure>
            )}

            {/* Inline Table of Contents (mobile/tablet only) */}
            <TableOfContents variant="inline" readTime={article.readTime} />

            {/* Pull Quote */}
            {article.pullQuote && (
              <blockquote className="my-10 max-w-[66ch] mx-auto pl-6 border-l-[6px] border-black">
                <p className="font-display font-bold text-[clamp(19px,2.4vw,25px)] leading-[1.4] text-ink m-0">
                  {article.pullQuote}
                </p>
              </blockquote>
            )}

            {/* Article Body */}
            <div
              className="prose prose-lg article-prose max-w-none
                prose-headings:font-display
                prose-h3:text-xl prose-h3:font-bold prose-h3:text-ink prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-ink-secondary
                prose-strong:text-ink
                prose-blockquote:border-l-black prose-blockquote:text-ink-secondary
                prose-code:text-black prose-code:bg-black/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
                prose-li:text-ink-secondary"
              dangerouslySetInnerHTML={{ __html: finalBody }}
            />

            {/* Deep-link anchors on section headings */}
            <HeadingAnchors />

            {/* Unified Engagement Footer (Tags + Reactions + Share) */}
            <footer className="mt-12 pt-6 border-t border-black/10 max-w-[66ch] mx-auto space-y-6 no-print">
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tag/${encodeURIComponent(tag.toLowerCase())}`}
                      className="px-3 py-1 text-xs font-semibold bg-black/5 text-ink-secondary rounded-full border border-black/15 hover:bg-black hover:text-white hover:border-black transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              <div className="bg-[#FFF7E6] border-2 border-black/15 rounded-2xl p-4 sm:p-5 space-y-5">
                <ReactionsBar slug={article.slug} />
                <div className="pt-4 border-t border-black/10">
                  <ShareButtons url={articleUrl} title={cleanTitle} />
                </div>
              </div>
            </footer>

            {/* Hydrate live Polymarket odds embeds */}
            <PolymarketEmbeds />

            {/* Hydrate embedded tweets */}
            <TwitterEmbeds />

            {/* Fullscreen lightbox for prose images */}
            <ImageLightbox />

            </div>
            {/* ── end reading sheet ── */}

            {/* Quiet Editorial Colophon Disclaimer */}
            <p className="mt-4 px-2 text-[11.5px] text-black/80 font-medium leading-relaxed text-center sm:text-left">
              <strong>Editorial note:</strong> Informational and educational commentary only — not financial or trading advice. Prediction markets involve risk of loss.
            </p>

            {/* Author Bio */}
            {author && (
              <div className="mt-8 p-6 bg-[#FFFDF9] rounded-2xl border-2 border-black shadow-pop no-print">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={author.avatar}
                      alt={author.name}
                      width={64}
                      height={64}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <Link href={`/author/${author.slug}`} className="font-display font-bold text-lg text-ink hover:text-brand-orange transition-colors">
                          {author.name}
                        </Link>
                        <p className="text-xs font-semibold text-ink-muted">{author.title}</p>
                      </div>
                      <Link
                        href={`/author/${author.slug}`}
                        className="text-xs font-mono font-bold uppercase tracking-wider text-black bg-brand-yellow border-2 border-black rounded-lg px-2.5 py-1 shadow-pop-sm hover:-translate-y-0.5 transition-transform"
                      >
                        More by {author.name.split(' ')[0]} →
                      </Link>
                    </div>
                    <div
                      className="text-sm text-ink-secondary mt-2.5 leading-relaxed [&_a]:text-ink [&_a]:underline [&_a]:font-semibold [&_a:hover]:text-black"
                      dangerouslySetInnerHTML={{ __html: author.bio }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Inline Newsletter */}
            <div className="mt-8 no-print">
              <NewsletterBlock
                variant="inline"
                heading={settings.newsletterHeading}
                body={settings.newsletterBody}
              />
            </div>

            {/* CTA Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5 no-print">
              <Link
                href="/tools/lp-scanner"
                className="group relative block border-2 border-black bg-[#C6F23A] rounded-2xl p-6 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all"
              >
                <span className="inline-block font-mono font-bold text-[10px] tracking-[0.12em] uppercase bg-white border-2 border-black px-2 py-0.5 mb-3">
                  See the numbers
                </span>
                <h3 className="font-display font-bold text-2xl text-black mb-2">LP Scanner</h3>
                <p className="text-sm text-black/80 leading-relaxed">Rank every live Polymarket reward pool by competition, minimum capital, and yield per $1,000.</p>
                <span className="absolute top-5 right-5 w-8 h-8 bg-black text-[#C6F23A] rounded-full flex items-center justify-center font-mono font-bold text-sm group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
              <Link
                href="/tools/arbitrage-scanner"
                className="group relative block border-2 border-black bg-[#29C5F6] rounded-2xl p-6 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_#000] transition-all"
              >
                <span className="inline-block font-mono font-bold text-[10px] tracking-[0.12em] uppercase bg-white border-2 border-black px-2 py-0.5 mb-3">
                  Find the spread
                </span>
                <h3 className="font-display font-bold text-2xl text-black mb-2">Arbitrage Scanner</h3>
                <p className="text-sm text-black/80 leading-relaxed">Compare odds across Polymarket, Kalshi, and Metaculus to find mispriced markets in real time.</p>
                <span className="absolute top-5 right-5 w-8 h-8 bg-black text-[#29C5F6] rounded-full flex items-center justify-center font-mono font-bold text-sm group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            </div>

            {/* Prev / Next */}
            {(prevArticle || nextArticle) && (
              <nav aria-label="Article pagination" className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
                {prevArticle ? (
                  <Link
                    href={`/${prevArticle.categorySlug}/${prevArticle.slug}`}
                    className="group border-2 border-black rounded-2xl bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] hover:bg-[#D9F24B] transition-all"
                  >
                    <span className="flex items-center gap-1.5 font-mono font-bold text-[10px] tracking-[0.12em] uppercase text-black/60">
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Previous
                    </span>
                    <span className="block font-display font-bold text-sm mt-2 leading-snug text-black">
                      {stripHtml(prevArticle.title)}
                    </span>
                    <span className="block text-xs text-ink-muted mt-1.5">
                      {categoryMap.get(prevArticle.categorySlug)?.name} · {prevArticle.readTime} min
                    </span>
                  </Link>
                ) : <div className="hidden sm:block" />}
                {nextArticle ? (
                  <Link
                    href={`/${nextArticle.categorySlug}/${nextArticle.slug}`}
                    className="group border-2 border-black rounded-2xl bg-[#FFFDF9] p-5 shadow-[4px_4px_0_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#000] hover:bg-[#D9F24B] transition-all sm:text-right"
                  >
                    <span className="flex items-center gap-1.5 font-mono font-bold text-[10px] tracking-[0.12em] uppercase text-black/60 sm:justify-end">
                      Next <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </span>
                    <span className="block font-display font-bold text-sm mt-2 leading-snug text-black">
                      {stripHtml(nextArticle.title)}
                    </span>
                    <span className="block text-xs text-ink-muted mt-1.5">
                      {categoryMap.get(nextArticle.categorySlug)?.name} · {nextArticle.readTime} min
                    </span>
                  </Link>
                ) : <div className="hidden sm:block" />}
              </nav>
            )}

            {/* Comments */}
            <div className="no-print">
              <GiscusComments slug={article.slug} />
            </div>
          </article>
        </div>
      </div>

      {/* Read Next */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t-2 border-black/15 no-print">
          <div className="flex items-center gap-3 mb-8">
            <div className="heading-chip bg-neon-green" />
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
