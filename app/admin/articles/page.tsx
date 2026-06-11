'use client';

import Link from 'next/link';
import { PlusCircle, Edit, Eye, Trash2 } from 'lucide-react';
import { articles, getAuthorById, getCategoryBySlug, formatDate } from '@/lib/data';

export default function AdminArticlesPage() {
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
            <tbody className="divide-y divide-surface-border">
              {articles.map((article) => {
                const author = getAuthorById(article.authorId);
                const category = getCategoryBySlug(article.categorySlug);
                return (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{article.readTime} min read</p>
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
                        article.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-orange-50 text-amber-600'
                      }`}>
                        {article.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">{formatDate(article.publishDate)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/articles/${article.id}`} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <Link href={`/articles/${article.slug}`} target="_blank" className="p-2 text-gray-500 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors" title="Preview">
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
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
