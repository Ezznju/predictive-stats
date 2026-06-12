import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Twitter, Linkedin, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { getAuthorBySlug, getArticlesByAuthor, getAuthors, getCategories } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthorBySlug(params.slug);
  if (!author) return { title: 'Author Not Found' };
  return {
    title: author.name,
    description: author.bio,
    openGraph: { title: `${author.name} | Predictions Market Fans`, description: author.bio, images: author.avatar ? [{ url: author.avatar }] : undefined },
  };
}

export default async function AuthorPage({ params }: Props) {
  const author = await getAuthorBySlug(params.slug);
  if (!author) notFound();

  const [authorArticles, allAuthors, categories] = await Promise.all([
    getArticlesByAuthor(author.id),
    getAuthors(),
    getCategories(),
  ]);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(categories.map(c => [c.slug, c]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-muted mb-6">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-ink-secondary">{author.name}</span>
      </nav>

      {/* Author header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-10 p-6 bg-white rounded-2xl border border-white/20 shadow-sm">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-amber/30">
          <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl text-ink">{author.name}</h1>
          <p className="text-black text-sm mt-1">{author.title}</p>
          <p className="text-ink-secondary mt-3 leading-relaxed max-w-2xl">{author.bio}</p>
          <div className="flex items-center gap-3 mt-4">
            {author.twitter && (
              <a href={`https://twitter.com/${author.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {author.linkedin && (
              <a href={`https://linkedin.com/in/${author.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/15 rounded-lg text-ink-secondary hover:text-black transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-black rounded-full" />
        <h2 className="font-display font-bold text-xl text-ink">Articles by {author.name}</h2>
        <span className="text-sm text-ink-muted">({authorArticles.length})</span>
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
