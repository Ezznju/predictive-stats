import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Calendar, Share2, Twitter, Linkedin, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { NewsletterBlock } from '@/components/NewsletterBlock';
import {
  articles,
  getArticleBySlug,
  getAuthorById,
  getCategoryBySlug,
  getRelatedArticles,
  formatDate,
  siteSettings,
} from '@/lib/data';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return articles
    .filter((a) => a.status === 'published')
    .map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  if (!article) return { title: 'Article Not Found' };
  const author = getAuthorById(article.authorId);

  return {
    title: article.seoTitle || article.title,
    description: article.metaDescription || article.excerpt,
    authors: author ? [{ name: author.name }] : undefined,
    openGraph: {
      type: 'article',
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: [{ url: article.featuredImage, width: 1200, height: 630 }],
      publishedTime: article.publishDate,
      modifiedTime: article.updatedDate,
      authors: author ? [author.name] : undefined,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.seoTitle || article.title,
      description: article.metaDescription || article.excerpt,
      images: [article.featuredImage],
    },
  };
}

export default function ArticlePage({ params }: Props) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const author = getAuthorById(article.authorId);
  const category = getCategoryBySlug(article.categorySlug);
  const related = getRelatedArticles(article, 3);
  const articleUrl = `${siteSettings.siteUrl}/articles/${article.slug}`;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.featuredImage,
    datePublished: article.publishDate,
    dateModified: article.updatedDate || article.publishDate,
    author: author
      ? { '@type': 'Person', name: author.name, url: `${siteSettings.siteUrl}/author/${author.slug}` }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteSettings.siteName,
      url: siteSettings.siteUrl,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    wordCount: article.content.split(/\s+/).length,
    articleSection: category?.name,
    keywords: article.tags.join(', '),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/articles" className="hover:text-ink transition-colors">Articles</Link>
          {category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/category/${category.slug}`} className="hover:text-ink transition-colors">{category.name}</Link>
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
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-ink leading-tight">
            {article.title}
          </h1>
          <p className="text-lg text-ink-secondary mt-4 leading-relaxed">{article.excerpt}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pb-6 border-b border-white/20">
            {author && (
              <Link href={`/author/${author.slug}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-sm font-medium text-ink group-hover:text-black transition-colors">{author.name}</span>
                  <span className="text-xs text-ink-muted block">{author.title}</span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-4 text-xs text-ink-muted ml-auto">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(article.publishDate)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
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

        {/* Pull Quote */}
        {article.pullQuote && (
          <blockquote className="border-l-4 border-black pl-6 py-2 my-8 text-xl font-display text-ink/80 italic">
            {article.pullQuote}
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
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-white/20">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 text-xs bg-white/15 text-ink-secondary rounded-full border border-white/20">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="flex items-center gap-3 mt-6 pb-8 border-b border-white/20">
          <span className="text-sm text-ink-muted font-medium">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black hover:bg-surface-border transition-all"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black hover:bg-surface-border transition-all"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>

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
          <NewsletterBlock variant="inline" />
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-white/15 rounded-xl border border-white/20">
          <p className="text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink-secondary">Disclaimer:</strong> This content is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or trading guidance. Prediction market participation involves risk of loss. Always conduct your own research before making any financial decisions.
          </p>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-white/20">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-brand-green rounded-full" />
            <h2 className="font-display font-bold text-2xl text-ink">Related Articles</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
