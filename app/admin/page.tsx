'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Eye, PlusCircle, TrendingUp, FolderOpen, Users, Loader2 } from 'lucide-react';

interface DashboardData {
  published: number;
  drafts: number;
  categories: number;
  authors: number;
  recentArticles: any[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [articlesRes, categoriesRes, authorsRes] = await Promise.all([
          fetch('/api/articles'),
          fetch('/api/categories'),
          fetch('/api/authors'),
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
          recentArticles: articles.slice(0, 5),
        });
      } catch (err) {
        console.error('Failed to load dashboard', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
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

      {/* Recent articles */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-display font-semibold text-gray-900">Recent Articles</h2>
          <Link href="/admin/articles" className="text-xs text-orange-600 hover:text-orange-600/80 font-medium">View all →</Link>
        </div>
        <div className="divide-y divide-gray-100">
          {data.recentArticles.map((article: any) => (
            <div key={article.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-900">{article.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{article.read_time} min read</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  article.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-amber-600'
                }`}>
                  {article.status}
                </span>
                <Link href={`/admin/articles/${article.id}`} className="p-1.5 text-gray-400 hover:text-orange-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
