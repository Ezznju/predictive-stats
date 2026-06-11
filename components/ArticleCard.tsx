import Link from 'next/link';
import Image from 'next/image';
import { Article, Category, Author } from '@/types';
import { getAuthorById, getCategoryBySlug, formatDate } from '@/lib/data';

type Variant = 'default' | 'featured' | 'compact' | 'horizontal';

interface ArticleCardProps {
  article: Article;
  variant?: Variant;
}

export function ArticleCard({ article, variant = 'default' }: ArticleCardProps) {
  const author = getAuthorById(article.authorId);
  const category = getCategoryBySlug(article.categorySlug);

  if (variant === 'featured') {
    return (
      <Link href={`/articles/${article.slug}`} className="group block">
        <div className="relative overflow-hidden rounded-2xl aspect-[16/9] mb-4">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 66vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {category && (
              <span
                className="category-badge mb-3"
                style={{ backgroundColor: category.color, color: '#000' }}
              >
                {category.name}
              </span>
            )}
            <h2 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight group-hover:text-brand-yellow transition-colors">
              {article.title}
            </h2>
            <p className="text-slate-300 text-sm mt-2 line-clamp-2">{article.excerpt}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
              {author && <span>{author.name}</span>}
              <span>·</span>
              <span>{formatDate(article.publishDate)}</span>
              <span>·</span>
              <span>{article.readTime} min read</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Link href={`/articles/${article.slug}`} className="group flex gap-4 items-start">
        <div className="relative w-24 h-24 md:w-28 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="120px"
          />
        </div>
        <div className="flex-1 min-w-0">
          {category && (
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: category.color }}>
              {category.name}
            </span>
          )}
          <h3 className="font-display font-semibold text-sm text-white leading-snug group-hover:text-brand-red transition-colors line-clamp-2 mt-0.5">
            {article.title}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">{article.readTime} min read</span>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/articles/${article.slug}`} className="group block">
        <h3 className="font-display font-semibold text-sm text-white leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
          {category && <span style={{ color: category.color }}>{category.name}</span>}
          <span>·</span>
          <span>{article.readTime} min</span>
        </div>
      </Link>
    );
  }

  // Default card
  return (
    <Link href={`/articles/${article.slug}`} className="group block card-hover">
      <div className="bg-surface-raised rounded-xl overflow-hidden border border-surface-border hover:border-brand-red/30 transition-all">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {category && (
            <span
              className="absolute top-3 left-3 category-badge"
              style={{ backgroundColor: category.color, color: '#000' }}
            >
              {category.name}
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="font-display font-bold text-lg text-white leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
            {article.title}
          </h3>
          <p className="text-sm text-slate-400 mt-2 line-clamp-2 leading-relaxed">{article.excerpt}</p>
          <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              {author && <span className="text-slate-400">{author.name}</span>}
              <span>·</span>
              <span>{formatDate(article.publishDate)}</span>
            </div>
            <span className="text-brand-yellow font-medium">{article.readTime} min</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
