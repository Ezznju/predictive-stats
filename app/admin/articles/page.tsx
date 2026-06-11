'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Edit, Eye, Trash2, Loader2 } from 'lucide-react';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [aRes, cRes, uRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/categories'),
        fetch('/api/authors'),
      ]);
      setArticles(await aRes.json());
      setCategories(await cRes.json());
      setAuthors(await uRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article? This cannot be undone.')) return;
    await fetch(`/api/articles/${id}`, { method: 'DELETE' });
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const getCat = (slug: string) => categories.find((c: any) => c.slug === slug);
  const getAuthor = (id: string) => authors.find((a: any) => a.id === id);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Articles</h1>
          <p className="text-sm text-gray-500 mt-1">{articles.length} total articles</p>
        </div>
        <Link href="/admin/articles/new" className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm">
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
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
              {articles.map((article) => {
                const category = getCat(article.category_slug);
                const author = getAuthor(article.author_id);
                return (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{article.read_time} min read</p>
                      </div>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {category && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
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
                      <span className="text-xs text-gray-500">{formatDate(article.publish_date)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/articles/${article.id}`} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/articles/${article.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors" title="Preview">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => handleDelete(article.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
