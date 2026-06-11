import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Twitter, Linkedin, ChevronRight } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { authors, getAuthorBySlug, getArticlesByAuthor } from '@/lib/data';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = getAuthorBySlug(params.slug);
  if (!author) return { title: 'Author Not Found' };
  return {
    title: author.name,
    description: author.bio,
    openGraph: { title: `${author.name} | PredictaView`, description: author.bio, images: [{ url: author.avatar }] },
  };
}

export default function AuthorPage({ params }: Props) {
  const author = getAuthorBySlug(params.slug);
  if (!author) notFound();

  const authorArticles = getArticlesByAuthor(author.id)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-300">{author.name}</span>
      </nav>

      {/* Author header */}
      <div className="flex flex-col md:flex-row items-start gap-6 mb-10 p-6 bg-surface-raised rounded-xl border border-surface-border">
        <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-brand-red/30">
          <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="font-display font-bold text-3xl text-white">{author.name}</h1>
          <p className="text-brand-yellow text-sm mt-1">{author.title}</p>
          <p className="text-slate-400 mt-3 leading-relaxed max-w-2xl">{author.bio}</p>
          <div className="flex items-center gap-3 mt-4">
            {author.twitter && (
              <a href={`https://twitter.com/${author.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-overlay rounded-lg text-slate-400 hover:text-brand-cyan transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {author.linkedin && (
              <a href={`https://linkedin.com/in/${author.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface-overlay rounded-lg text-slate-400 hover:text-brand-cyan transition-colors">
                <Linkedin className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-brand-red rounded-full" />
        <h2 className="font-display font-bold text-xl text-white">Articles by {author.name}</h2>
        <span className="text-sm text-slate-500">({authorArticles.length})</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authorArticles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
