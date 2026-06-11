'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { Article, Author, Category } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [aRes, auRes, cRes] = await Promise.all([
          fetch('/api/articles'),
          fetch('/api/authors'),
          fetch('/api/categories'),
        ]);
        const allArticles = await aRes.json();
        setArticles(allArticles.filter((a: any) => a.status === 'published'));
        setAuthors(await auRes.json());
        setCategories(await cRes.json());
      } catch {
        console.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const authorMap = useMemo(() => new Map(authors.map(a => [a.id, a])), [authors]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.slug, c])), [categories]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return articles.filter((a: any) =>
      a.title?.toLowerCase().includes(q) ||
      a.excerpt?.toLowerCase().includes(q) ||
      (a.tags || []).some((t: string) => t.toLowerCase().includes(q)) ||
      (a.category_slug || a.categorySlug || '').replace(/-/g, ' ').includes(q)
    );
  }, [query, articles]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display font-bold text-4xl text-ink mb-6">Search</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-ink mb-6">Search</h1>

      <div className="relative max-w-2xl mb-10">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics, tags..."
          className="w-full bg-white border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-colors text-lg shadow-sm"
          autoFocus
        />
      </div>

      {query.trim() && (
        <p className="text-sm text-ink-muted mb-6">{results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((article: any) => (
          <ArticleCard
            key={article.id}
            article={article}
            author={authorMap.get(article.authorId || article.author_id)}
            category={categoryMap.get(article.categorySlug || article.category_slug)}
          />
        ))}
      </div>

      {query.trim() && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-lg">No articles match your search.</p>
          <p className="text-ink-muted text-sm mt-1">Try different keywords or browse all articles.</p>
        </div>
      )}
    </div>
  );
}
