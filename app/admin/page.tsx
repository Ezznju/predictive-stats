'use client';

import Link from 'next/link';
import { FileText, Eye, PlusCircle, TrendingUp, FolderOpen, Users } from 'lucide-react';
import { articles, categories, authors } from '@/lib/data';

export default function AdminDashboard() {
  const published = articles.filter((a) => a.status === 'published');
  const drafts = articles.filter((a) => a.status === 'draft');

  const stats = [
    { label: 'Published', value: published.length, icon: FileText, color: '#2ECC71' },
    { label: 'Drafts', value: drafts.length, icon: Eye, color: '#FFBF00' },
    { label: 'Categories', value: categories.length, icon: FolderOpen, color: '#4A6CF7' },
    { label: 'Authors', value: authors.length, icon: Users, color: '#7C3AED' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">Manage your content and publications.</p>
        </div>
        <Link
          href="/admin/articles/new"
          className="bg-brand-orange hover:bg-brand-orange/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-surface-raised rounded-2xl border border-surface-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              <span className="text-2xl font-display font-bold text-ink">{stat.value}</span>
            </div>
            <p className="text-xs text-ink-muted font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent articles */}
      <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-display font-semibold text-ink">Recent Articles</h2>
          <Link href="/admin/articles" className="text-xs text-brand-orange hover:text-brand-orange/80 font-medium">View all →</Link>
        </div>
        <div className="divide-y divide-surface-border">
          {articles.slice(0, 5).map((article) => (
            <Link
              key={article.id}
              href={`/admin/articles/${article.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-surface-overlay transition-colors group"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-ink truncate group-hover:text-brand-orange transition-colors">{article.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-ink-muted">
                  <span>{article.publishDate}</span>
                  <span>{article.readTime} min read</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                article.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-amber/10 text-brand-amber'
              }`}>
                {article.status}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Link href="/admin/articles/new" className="p-5 bg-surface-raised rounded-2xl border border-surface-border hover:border-brand-orange/30 hover:shadow-md transition-all group">
          <PlusCircle className="w-6 h-6 text-brand-orange mb-3" />
          <h3 className="font-display font-semibold text-ink group-hover:text-brand-orange transition-colors">Write New Article</h3>
          <p className="text-xs text-ink-muted mt-1">Create a new article with the rich text editor.</p>
        </Link>
        <Link href="/admin/categories" className="p-5 bg-surface-raised rounded-2xl border border-surface-border hover:border-brand-amber/30 hover:shadow-md transition-all group">
          <FolderOpen className="w-6 h-6 text-brand-amber mb-3" />
          <h3 className="font-display font-semibold text-ink group-hover:text-brand-amber transition-colors">Manage Categories</h3>
          <p className="text-xs text-ink-muted mt-1">Add, edit, or reorganize content categories.</p>
        </Link>
        <Link href="/admin/settings" className="p-5 bg-surface-raised rounded-2xl border border-surface-border hover:border-brand-green/30 hover:shadow-md transition-all group">
          <TrendingUp className="w-6 h-6 text-brand-green mb-3" />
          <h3 className="font-display font-semibold text-ink group-hover:text-brand-green transition-colors">Site Settings</h3>
          <p className="text-xs text-ink-muted mt-1">Configure site name, SEO, and newsletter settings.</p>
        </Link>
      </div>
    </div>
  );
}
