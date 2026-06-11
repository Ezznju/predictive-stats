'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, X, Check } from 'lucide-react';
import { RichEditor } from '@/components/admin/RichEditor';
import { articles, categories, authors } from '@/lib/data';

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const article = articles.find((a) => a.id === params.id);

  const [form, setForm] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    featuredImage: article?.featuredImage || '',
    authorId: article?.authorId || authors[0]?.id || '',
    categorySlug: article?.categorySlug || categories[0]?.slug || '',
    tags: article?.tags.join(', ') || '',
    status: (article?.status || 'draft') as 'draft' | 'published',
    featured: article?.featured || false,
    seoTitle: article?.seoTitle || '',
    metaDescription: article?.metaDescription || '',
    pullQuote: article?.pullQuote || '',
  });

  const updateField = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!article) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-muted text-lg">Article not found.</p>
        <button onClick={() => router.push('/admin/articles')} className="text-brand-orange mt-2">← Back to articles</button>
      </div>
    );
  }

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-ink-secondary hover:text-brand-orange hover:bg-surface-overlay rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-ink">Edit Article</h1>
            <p className="text-xs text-ink-muted mt-0.5">{wordCount.toLocaleString()} words · ~{readTime} min read</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateField('status', form.status === 'draft' ? 'published' : 'draft')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              form.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-yellow/10 text-brand-yellow'
            }`}
          >
            {form.status}
          </button>
          <button onClick={handleSave} className="bg-brand-orange hover:bg-brand-orange/90 text-ink px-4 py-2 rounded-lg font-display font-semibold text-sm transition-colors flex items-center gap-2">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className="lg:col-span-2 space-y-6">
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full bg-transparent border-none text-3xl font-display font-bold text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              rows={3}
              className="w-full bg-surface-raised border border-surface-border rounded-lg px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Content</label>
            <RichEditor content={form.content} onChange={(html) => updateField('content', html)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Pull Quote</label>
            <textarea
              value={form.pullQuote}
              onChange={(e) => updateField('pullQuote', e.target.value)}
              rows={2}
              className="w-full bg-surface-raised border border-surface-border rounded-lg px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber transition-colors resize-none italic"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">URL Slug</label>
            <input type="text" value={form.slug} onChange={(e) => updateField('slug', generateSlug(e.target.value))} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-amber transition-colors font-mono" />
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Featured Image</label>
            {form.featuredImage && (
              <div className="relative rounded-lg overflow-hidden mb-2">
                <img src={form.featuredImage} alt="" className="w-full aspect-video object-cover" />
                <button onClick={() => updateField('featuredImage', '')} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-ink"><X className="w-3 h-3" /></button>
              </div>
            )}
            <input type="url" value={form.featuredImage} onChange={(e) => updateField('featuredImage', e.target.value)} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber transition-colors" />
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Category</label>
            <select value={form.categorySlug} onChange={(e) => updateField('categorySlug', e.target.value)} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-amber transition-colors">
              {categories.map((cat) => <option key={cat.id} value={cat.slug} className="bg-surface-raised">{cat.name}</option>)}
            </select>
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Author</label>
            <select value={form.authorId} onChange={(e) => updateField('authorId', e.target.value)} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-amber transition-colors">
              {authors.map((a) => <option key={a.id} value={a.id} className="bg-surface-raised">{a.name}</option>)}
            </select>
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Tags</label>
            <input type="text" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-amber transition-colors" />
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">Featured</span>
              <button type="button" onClick={() => updateField('featured', !form.featured)} className={`w-10 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-brand-green' : 'bg-surface-border'}`}>
                <span className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
          <div className="bg-surface-raised rounded-2xl border border-surface-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-yellow">SEO</h3>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1">SEO Title</label>
              <input type="text" value={form.seoTitle} onChange={(e) => updateField('seoTitle', e.target.value)} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand-amber transition-colors" />
              <p className="text-[10px] text-ink-faint mt-0.5">{form.seoTitle.length}/60</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-1">Meta Description</label>
              <textarea value={form.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} rows={3} className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand-amber transition-colors resize-none" />
              <p className="text-[10px] text-ink-faint mt-0.5">{form.metaDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
