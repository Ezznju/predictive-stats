'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { ArticleCard } from '@/components/ArticleCard';
import { Article, Author, Category } from '@/types';

/** Normalizes raw snake_case API rows to the camelCase Article shape. */
function normalizeArticle(a: any): Article {
  return {
    id: a.id,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? '',
    content: '',
    featuredImage: a.featured_image ?? a.featuredImage ?? '',
    authorId: a.author_id ?? a.authorId ?? '',
    categorySlug: a.category_slug ?? a.categorySlug ?? '',
    tags: a.tags ?? [],
    publishDate: a.publish_date ?? a.publishDate ?? '',
    updatedDate: a.updated_date ?? a.updatedDate ?? undefined,
    readTime: a.read_time ?? a.readTime ?? 5,
    featured: a.featured ?? false,
    status: a.status ?? 'published',
  };
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const requestId = useRef(0);

  // Support /search?q=... deep links (Google sitelinks searchbox, shared URLs)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  // Load authors + categories once (needed for the result cards)
  useEffect(() => {
    async function load() {
      try {
        const [auRes, cRes] = await Promise.all([
          fetch('/api/authors'),
          fetch('/api/categories'),
        ]);
        setAuthors(await auRes.json());
        setCategories(await cRes.json());
      } catch {
        console.error('Failed to load metadata');
      }
    }
    load();
  }, []);

  // Debounced server-side full-text search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const rows = await res.json();
        if (id !== requestId.current) return; // stale response
        setResults(Array.isArray(rows) ? rows.map(normalizeArticle) : []);
        setSearched(true);
      } catch {
        if (id === requestId.current) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const authorMap = useMemo(() => new Map(authors.map((a) => [a.id, a])), [authors]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.slug, c])), [categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-4xl text-ink mb-6">Search</h1>

      <div className="relative max-w-2xl mb-10">
        {searching ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-ink-muted" />
        ) : (
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics, tags..."
          className="w-full bg-white border border-white/20 rounded-2xl pl-12 pr-4 py-4 text-ink placeholder:text-ink-faint focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-colors text-lg shadow-sm"
          autoFocus
        />
      </div>

      {searched && !searching && (
        <p className="text-sm text-ink-muted mb-6">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query.trim()}&rdquo;
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            author={authorMap.get(article.authorId)}
            category={categoryMap.get(article.categorySlug)}
          />
        ))}
      </div>

      {searched && !searching && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-ink-secondary text-lg">No articles match your search.</p>
          <p className="text-ink-muted text-sm mt-1">Try different keywords or browse all articles.</p>
        </div>
      )}
    </div>
  );
}
