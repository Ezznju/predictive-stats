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
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/articles" className="hover:text-white transition-colors">Articles</Link>
          {category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/category/${category.slug}`} className="hover:text-white transition-colors">{category.name}</Link>
            </>
          )}
        </nav>

        {/* Header */}
        <header className="mb-8">
          {category && (
            <span
              className="category-badge mb-4 inline-block"
              style={{ backgroundColor: category.color, color: '#000' }}
            >
              {category.name}
            </span>
          )}
          <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-white leading-tight">
            {article.title}
          </h1>
          <p className="text-lg text-slate-400 mt-4 leading-relaxed">{article.excerpt}</p>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pb-6 border-b border-surface-border">
            {author && (
              <Link href={`/author/${author.slug}`} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="text-sm font-medium text-white group-hover:text-brand-red transition-colors">{author.name}</span>
                  <span className="text-xs text-slate-500 block">{author.title}</span>
                </div>
              </Link>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-500 ml-auto">
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(article.publishDate)}</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.readTime} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-10">
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
          <blockquote className="border-l-4 border-brand-red pl-6 py-2 my-8 text-xl font-display text-white/80 italic">
            {article.pullQuote}
          </blockquote>
        )}

        {/* Article Body */}
        <div
          className="prose prose-invert prose-lg max-w-none
            prose-headings:font-display
            prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:text-white prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white
            prose-blockquote:border-l-brand-red prose-blockquote:text-slate-400
            prose-code:text-brand-yellow prose-code:bg-surface-overlay prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-li:text-slate-300"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        <div className="mt-10 pt-6 border-t border-surface-border">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 text-xs bg-surface-overlay text-slate-400 rounded-full border border-surface-border">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Share */}
        <div className="flex items-center gap-3 mt-6 pb-8 border-b border-surface-border">
          <span className="text-sm text-slate-500 font-medium">Share:</span>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-surface-overlay rounded-lg text-slate-400 hover:text-brand-cyan hover:bg-surface-border transition-all"
          >
            <Twitter className="w-4 h-4" />
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(article.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-surface-overlay rounded-lg text-slate-400 hover:text-brand-cyan hover:bg-surface-border transition-all"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        </div>

        {/* Author Bio */}
        {author && (
          <div className="mt-8 p-6 bg-surface-raised rounded-xl border border-surface-border">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <Link href={`/author/${author.slug}`} className="font-display font-bold text-white hover:text-brand-red transition-colors">{author.name}</Link>
                <p className="text-xs text-brand-yellow mt-0.5">{author.title}</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{author.bio}</p>
              </div>
            </div>
          </div>
        )}

        {/* Inline Newsletter */}
        <div className="mt-10">
          <NewsletterBlock variant="inline" />
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-surface-overlay rounded-lg border border-surface-border">
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-400">Disclaimer:</strong> This content is for informational and educational purposes only. It does not constitute financial advice, investment recommendations, or trading guidance. Prediction market participation involves risk of loss. Always conduct your own research before making any financial decisions.
          </p>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-surface-border">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1 h-6 bg-brand-green rounded-full" />
            <h2 className="font-display font-bold text-2xl text-white">Related Articles</h2>
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
