'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Eye, PlusCircle, FolderOpen, Users, Loader2, Search, X, Edit } from 'lucide-react';

interface DashboardData {
  published: number;
  drafts: number;
  categories: number;
  authors: number;
  allArticles: any[];
}

function stripTags(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [articlesRes, categoriesRes, authorsRes] = await Promise.all([
          fetch('/api/articles?summary=1', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/authors', { cache: 'no-store' }),
        ]);
        const articles = await articlesRes.json();
        const categories = await categoriesRes.json();
        const authors = await authorsRes.json();

        const published = articles.filter((a: any) => a.status === 'published');
        const drafts = articles.filter((a: any) => a.status === 'draft');

        setData({
          published: published.length,
          drafts: drafts.length,
          categories: categories.length,
          authors: authors.length,
          allArticles: articles,
        });
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const searchMatches = useMemo(() => {
    if (!data) return [];
    const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return [];
    return data.allArticles
      .filter((a) => {
        const tagsText = Array.isArray(a.tags) ? a.tags.join(' ') : String(a.tags || '');
        const hay = [
          stripTags(a.title),
          a.slug,
          a.excerpt,
          a.seo_title,
          a.category_slug,
          tagsText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 12);
  }, [data, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load dashboard.</p>;

  const stats = [
    { label: 'Published', value: data.published, icon: FileText, color: '#2ECC71' },
    { label: 'Drafts', value: data.drafts, icon: Eye, color: '#FFBF00' },
    { label: 'Categories', value: data.categories, icon: FolderOpen, color: '#4A6CF7' },
    { label: 'Authors', value: data.authors, icon: Users, color: '#7C3AED' },
  ];

  const showingSearch = query.trim().length > 0;
  const visibleList = showingSearch ? searchMatches : data.allArticles.slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your content and publications.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Quick Article Search */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Quick find an article to edit by keyword, title, slug, or tag…"
            aria-label="Quick search articles"
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              <span className="text-2xl font-display font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent or Matching articles */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-900">
            {showingSearch ? `Search Results (${searchMatches.length})` : 'Recent Articles'}
          </h2>
          <Link href="/admin/articles" className="text-xs text-orange-600 hover:text-orange-600/80 font-medium">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {visibleList.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-gray-500">
              No articles match &ldquo;{query.trim()}&rdquo;.
            </div>
          ) : (
            visibleList.map((article: any) => {
              const cleanTitle = stripTags(article.title);
              return (
                <div key={article.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors block truncate"
                    >
                      {cleanTitle}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      /{article.slug} · {article.read_time} min read
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-amber-600'
                    }`}>
                      {article.status}
                    </span>
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit article"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
