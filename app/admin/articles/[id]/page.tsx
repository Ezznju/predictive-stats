'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, X, Check, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { RichEditor } from '@/components/admin/RichEditor';

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    authorId: '',
    categorySlug: '',
    tags: '',
    status: 'draft' as 'draft' | 'published',
    featured: false,
    seoTitle: '',
    metaDescription: '',
    pullQuote: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const [artRes, cRes, aRes] = await Promise.all([
          fetch(`/api/articles/${params.id}`, { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
          fetch('/api/authors', { cache: 'no-store' }),
        ]);

        if (!artRes.ok) { setNotFound(true); setLoading(false); return; }

        const article = await artRes.json();
        setCategories(await cRes.json());
        setAuthors(await aRes.json());

        setForm({
          title: article.title || '',
          slug: article.slug || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          featuredImage: article.featured_image || '',
          authorId: article.author_id || '',
          categorySlug: article.category_slug || '',
          tags: (article.tags || []).join(', '),
          status: article.status || 'draft',
          featured: article.featured || false,
          seoTitle: article.seo_title || '',
          metaDescription: article.meta_description || '',
          pullQuote: article.pull_quote || '',
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  const updateField = useCallback(<K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        updateField('featuredImage', data.url);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) handleImageUpload(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const wordCount = form.content ? form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
      const readTime = Math.max(1, Math.ceil(wordCount / 250));

      const body = {
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        featuredImage: form.featuredImage,
        authorId: form.authorId,
        categorySlug: form.categorySlug,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        readTime,
        featured: form.featured,
        status: form.status,
        seoTitle: form.seoTitle || null,
        metaDescription: form.metaDescription || null,
        pullQuote: form.pullQuote || null,
        updatedDate: new Date().toISOString().split('T')[0],
      };

      const res = await fetch(`/api/articles/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Save failed');
      }
    } catch {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Article not found.</p>
        <button onClick={() => router.push('/admin/articles')} className="text-orange-600 mt-2">← Back to articles</button>
      </div>
    );
  }

  const wordCount = form.content ? form.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length : 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 250));

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-600 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="font-display font-bold text-xl text-gray-900">Edit Article</h1>
            <p className="text-xs text-gray-500 mt-0.5">{wordCount.toLocaleString()} words · ~{readTime} min read</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateField('status', form.status === 'draft' ? 'published' : 'draft')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              form.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-amber-600'
            }`}
          >
            {form.status}
          </button>
          <button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-600/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-display font-semibold text-sm transition-colors flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <input type="text" value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full bg-transparent border-none text-3xl font-display font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none" />
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Excerpt</label>
            <textarea value={form.excerpt} onChange={(e) => updateField('excerpt', e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 transition-colors resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Content</label>
            <RichEditor content={form.content} onChange={(html) => updateField('content', html)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Pull Quote</label>
            <textarea value={form.pullQuote} onChange={(e) => updateField('pullQuote', e.target.value)} rows={2} className="w-full bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 transition-colors resize-none italic" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">URL Slug</label>
            <input type="text" value={form.slug} onChange={(e) => updateField('slug', generateSlug(e.target.value))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-300 transition-colors font-mono" />
          </div>

          {/* Featured Image with Upload */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Featured Image</label>
            {form.featuredImage ? (
              <div className="relative rounded-lg overflow-hidden mb-2">
                <img src={form.featuredImage} alt="" className="w-full aspect-video object-cover" />
                <button onClick={() => updateField('featuredImage', '')} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-orange-300 transition-colors mb-2"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 mx-auto text-orange-600 animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs text-gray-500">Drop an image or click to upload</p>
                    <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, GIF, WebP · Max 5MB</p>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            <input type="url" value={form.featuredImage} onChange={(e) => updateField('featuredImage', e.target.value)} placeholder="Or paste image URL..." className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 transition-colors" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category</label>
            <select value={form.categorySlug} onChange={(e) => updateField('categorySlug', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-300 transition-colors">
              {categories.map((cat: any) => <option key={cat.id} value={cat.slug}>{cat.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Author</label>
            <select value={form.authorId} onChange={(e) => updateField('authorId', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-orange-300 transition-colors">
              {authors.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Tags</label>
            <input type="text" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-300 transition-colors" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Featured</span>
              <button type="button" onClick={() => updateField('featured', !form.featured)} className={`w-10 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-green-500' : 'bg-gray-200'}`}>
                <span className={`block w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform shadow-sm ${form.featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600">SEO</h3>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">SEO Title</label>
              <input type="text" value={form.seoTitle} onChange={(e) => updateField('seoTitle', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-orange-300 transition-colors" />
              <p className="text-[10px] text-gray-400 mt-0.5">{form.seoTitle.length}/60</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Meta Description</label>
              <textarea value={form.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-orange-300 transition-colors resize-none" />
              <p className="text-[10px] text-gray-400 mt-0.5">{form.metaDescription.length}/160</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
