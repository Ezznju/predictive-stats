'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Eye, ArrowLeft, Upload, X, Check } from 'lucide-react';
import { RichEditor } from '@/components/admin/RichEditor';
import { categories, authors } from '@/lib/data';

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

export default function NewArticlePage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    authorId: authors[0]?.id || '',
    categorySlug: categories[0]?.slug || '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    seoTitle: '',
    metaDescription: '',
    pullQuote: '',
  });
  const [slugEdited, setSlugEdited] = useState(false);

  const updateField = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleTitleChange = useCallback((val: string) => {
    updateField('title', val);
    if (!slugEdited) updateField('slug', generateSlug(val));
  }, [slugEdited, updateField]);

  const handleSave = () => {
    // For now, show saved state. Once Supabase is connected, this will persist.
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-white hover:bg-surface-overlay rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-white">New Article</h1>
            <p className="text-xs text-slate-500 mt-0.5">{wordCount.toLocaleString()} words · ~{readTime} min read</p>
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
          <button onClick={handleSave} className="bg-brand-red hover:bg-brand-red/90 text-white px-4 py-2 rounded-lg font-display font-semibold text-sm transition-colors flex items-center gap-2">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Article title..."
              className="w-full bg-transparent border-none text-3xl font-display font-bold text-white placeholder:text-slate-700 focus:outline-none"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Excerpt / Summary</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => updateField('excerpt', e.target.value)}
              placeholder="A brief summary of the article (shown on cards and in search results)..."
              rows={3}
              className="w-full bg-surface-raised border border-surface-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors resize-none"
            />
          </div>

          {/* Rich text editor */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Article Content</label>
            <RichEditor
              content={form.content}
              onChange={(html) => updateField('content', html)}
              placeholder="Start writing your article... Use H2 for main sections, H3 for subsections."
            />
          </div>

          {/* Pull Quote */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pull Quote (optional)</label>
            <textarea
              value={form.pullQuote}
              onChange={(e) => updateField('pullQuote', e.target.value)}
              placeholder="A standout quote from the article, displayed prominently..."
              rows={2}
              className="w-full bg-surface-raised border border-surface-border rounded-lg px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors resize-none italic"
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Slug */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">URL Slug</label>
            <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
              <span>/articles/</span>
            </div>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => { setSlugEdited(true); updateField('slug', generateSlug(e.target.value)); }}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red transition-colors font-mono"
            />
          </div>

          {/* Featured Image */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Featured Image</label>
            {form.featuredImage ? (
              <div className="relative rounded-lg overflow-hidden mb-2">
                <img src={form.featuredImage} alt="Featured" className="w-full aspect-video object-cover" />
                <button onClick={() => updateField('featuredImage', '')} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : null}
            <input
              type="url"
              value={form.featuredImage}
              onChange={(e) => updateField('featuredImage', e.target.value)}
              placeholder="Image URL..."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {/* Category */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
            <select
              value={form.categorySlug}
              onChange={(e) => updateField('categorySlug', e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug} className="bg-surface text-white">{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Author */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Author</label>
            <select
              value={form.authorId}
              onChange={(e) => updateField('authorId', e.target.value)}
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
            >
              {authors.map((a) => (
                <option key={a.id} value={a.id} className="bg-surface text-white">{a.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Tags</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField('tags', e.target.value)}
              placeholder="tag1, tag2, tag3..."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-1">Separate with commas</p>
          </div>

          {/* Featured toggle */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Featured Article</span>
              <button
                type="button"
                onClick={() => updateField('featured', !form.featured)}
                className={`w-10 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-brand-green' : 'bg-surface-border'}`}
              >
                <span className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>

          {/* SEO */}
          <div className="bg-surface-raised rounded-xl border border-surface-border p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-yellow">SEO Settings</h3>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">SEO Title</label>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(e) => updateField('seoTitle', e.target.value)}
                placeholder="Custom title for search engines..."
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors"
              />
              <p className="text-[10px] text-slate-600 mt-0.5">{form.seoTitle.length}/60 chars</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">Meta Description</label>
              <textarea
                value={form.metaDescription}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                placeholder="Description for search results..."
                rows={3}
                className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-red transition-colors resize-none"
              />
              <p className="text-[10px] text-slate-600 mt-0.5">{form.metaDescription.length}/160 chars</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
