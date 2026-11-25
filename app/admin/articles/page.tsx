'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Eye, Trash2, Loader2, Search, X } from 'lucide-react';

function stripTags(str?: string | null): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const [aRes, cRes, uRes] = await Promise.all([
        fetch('/api/articles?summary=1', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/authors', { cache: 'no-store' }),
      ]);
      setArticles(await aRes.json());
      setCategories(await cRes.json());
      setAuthors(await uRes.json());
      setLoading(false);
    }
    load();
  }, []);

  // Press "/" or Ctrl/Cmd+K anywhere on the page to jump straight to search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const el = document.activeElement as HTMLElement | null;
      const tag = (el?.tagName ?? '').toUpperCase();
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable;
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const categoryMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const c of categories) map.set(c.slug, c);
    return map;
  }, [categories]);

  const authorMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const a of authors) map.set(a.id, a);
    return map;
  }, [authors]);

  const filteredArticles = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return articles.filter((article) => {
      if (statusFilter !== 'all' && article.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && article.category_slug !== categoryFilter) return false;

      if (tokens.length === 0) return true;

      const catName = categoryMap.get(article.category_slug)?.name || '';
      const authorName = authorMap.get(article.author_id)?.name || '';
      const tagsText = Array.isArray(article.tags) ? article.tags.join(' ') : String(article.tags || '');

      const haystack = [
        stripTags(article.title),
        article.slug,
        article.excerpt,
        article.seo_title,
        article.meta_description,
        tagsText,
        catName,
        authorName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return tokens.every((tok) => haystack.includes(tok));
    });
  }, [articles, query, statusFilter, categoryFilter, categoryMap, authorMap]);

  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    searchInputRef.current?.focus();
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasActiveFilters
              ? `Showing ${filteredArticles.length} of ${articles.length} articles`
              : `${articles.length} total articles`}
          </p>
        </div>
        <Link href="/admin/articles/new" className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm">
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, title, slug, tag, or author… (press /)"
              aria-label="Search articles"
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
            {(['all', 'published', 'draft'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3.5 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 rounded-xl transition-colors whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Title</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Author</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Date</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <p className="text-sm font-medium text-gray-700">
                      No articles match {query.trim() ? `"${query.trim()}"` : 'your filters'}.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-xs font-semibold text-orange-600 hover:underline"
                      >
                        Reset search &amp; filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => {
                  const category = categoryMap.get(article.category_slug);
                  const author = authorMap.get(article.author_id);
                  const cleanTitle = stripTags(article.title);
                  return (
                    <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="max-w-md">
                          <Link
                            href={`/admin/articles/${article.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-orange-600 transition-colors block truncate"
                            title={cleanTitle}
                          >
                            {cleanTitle}
                          </Link>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            /{article.slug} · {article.read_time} min read
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        {category && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                            {category.name}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">{author?.name}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-amber-600'
                        }`}>
                          {article.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(article.publish_date)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/articles/${article.id}`} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <Link href={`/${category?.slug || article.category_slug || 'general'}/${article.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-lg transition-colors" title="Preview">
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
