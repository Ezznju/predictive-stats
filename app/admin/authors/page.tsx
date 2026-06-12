'use client';

import { useEffect, useRef, useState } from 'react';
import { PlusCircle, Edit, Trash2, Check, X, Loader2, Upload, User } from 'lucide-react';

const MAX_AUTHORS = 10;

interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatar: string;
  twitter?: string | null;
  linkedin?: string | null;
}

interface AuthorForm {
  name: string;
  slug: string;
  title: string;
  bio: string;
  avatar: string;
  twitter: string;
  linkedin: string;
}

const emptyForm: AuthorForm = { name: '', slug: '', title: '', bio: '', avatar: '', twitter: '', linkedin: '' };

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (res.ok && json.url) {
      onChange(json.url);
    } else {
      setError(json.error || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Author avatar" className="w-full h-full object-cover" />
        ) : (
          <User className="w-6 h-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="mt-2 w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-orange-300"
        />
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function AuthorFields({
  form,
  setForm,
  autoSlug,
}: {
  form: AuthorForm;
  setForm: (updater: (p: AuthorForm) => AuthorForm) => void;
  autoSlug?: boolean;
}) {
  return (
    <div className="space-y-3">
      <AvatarPicker value={form.avatar} onChange={(url) => setForm((p) => ({ ...p, avatar: url }))} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={form.name}
          onChange={(e) =>
            setForm((p) => ({ ...p, name: e.target.value, ...(autoSlug ? { slug: toSlug(e.target.value) } : {}) }))
          }
          placeholder="Full name"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300"
        />
        <input
          value={form.slug}
          onChange={(e) => setForm((p) => ({ ...p, slug: toSlug(e.target.value) }))}
          placeholder="slug (e.g. jane-doe)"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-300"
        />
        <input
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          placeholder="Role / title (e.g. Markets Analyst)"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300"
        />
        <input
          value={form.twitter}
          onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))}
          placeholder="Twitter / X handle (optional)"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300"
        />
        <input
          value={form.linkedin}
          onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))}
          placeholder="LinkedIn URL (optional)"
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300 md:col-span-2"
        />
        <textarea
          value={form.bio}
          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
          placeholder="Short bio"
          rows={3}
          className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300 md:col-span-2 resize-y"
        />
      </div>
    </div>
  );
}

export default function AdminAuthorsPage() {
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<AuthorForm>(emptyForm);
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState<AuthorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const [auRes, aRes] = await Promise.all([
        fetch('/api/authors', { cache: 'no-store' }),
        fetch('/api/articles', { cache: 'no-store' }),
      ]);
      setAuthors(await auRes.json());
      setArticles(await aRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const articleCount = (authorId: string) =>
    articles.filter((a) => (a.author_id ?? a.authorId) === authorId).length;

  const handleEdit = (au: AuthorRow) => {
    setError('');
    setAdding(false);
    setEditing(au.id);
    setEditForm({
      name: au.name,
      slug: au.slug,
      title: au.title ?? '',
      bio: au.bio ?? '',
      avatar: au.avatar ?? '',
      twitter: au.twitter ?? '',
      linkedin: au.linkedin ?? '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm.name.trim()) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/authors/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    const json = await res.json();
    if (res.ok) {
      setAuthors((prev) => prev.map((a) => (a.id === editing ? { ...a, ...json } : a)));
      setEditing(null);
    } else {
      setError(json.error || 'Failed to save author');
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newForm.name.trim()) return;
    setSaving(true);
    setError('');
    const slug = newForm.slug || toSlug(newForm.name);
    const res = await fetch('/api/authors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, slug }),
    });
    const json = await res.json();
    if (res.ok) {
      setAuthors((prev) => [...prev, json]);
      setNewForm(emptyForm);
      setAdding(false);
    } else {
      setError(json.error || 'Failed to add author');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const count = articleCount(id);
    if (count > 0) {
      alert(`Cannot delete — ${count} article(s) are assigned to this author. Reassign them first.`);
      return;
    }
    if (!confirm('Delete this author?')) return;
    const res = await fetch(`/api/authors/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAuthors((prev) => prev.filter((a) => a.id !== id));
    } else {
      const json = await res.json();
      alert(json.error || 'Failed to delete author');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
      </div>
    );
  }

  const atLimit = authors.length >= MAX_AUTHORS;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Authors</h1>
          <p className="text-sm text-gray-500 mt-1">
            {authors.length} of {MAX_AUTHORS} authors
          </p>
        </div>
        <button
          onClick={() => {
            setError('');
            setEditing(null);
            setAdding(true);
          }}
          disabled={atLimit}
          title={atLimit ? `Author limit reached (max ${MAX_AUTHORS})` : undefined}
          className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PlusCircle className="w-4 h-4" /> Add Author
        </button>
      </div>

      {atLimit && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-6">
          You&apos;ve reached the maximum of {MAX_AUTHORS} authors. Delete one to add another.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5 mb-6 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-3">New Author</h3>
          <AuthorFields form={newForm} setForm={setNewForm} autoSlug />
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleAdd}
              disabled={saving || !newForm.name.trim()}
              className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Add Author
            </button>
            <button
              onClick={() => {
                setAdding(false);
                setNewForm(emptyForm);
                setError('');
              }}
              className="text-gray-500 hover:text-black px-3 py-2 text-sm transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Author list */}
      <div className="space-y-4">
        {authors.map((au) =>
          editing === au.id ? (
            <div key={au.id} className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
              <h3 className="font-display font-semibold text-gray-900 mb-3">Edit Author</h3>
              <AuthorFields form={editForm} setForm={setEditForm} />
              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editForm.name.trim()}
                  className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                </button>
                <button
                  onClick={() => {
                    setEditing(null);
                    setError('');
                  }}
                  className="text-gray-500 hover:text-black px-3 py-2 text-sm transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={au.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-start gap-4"
            >
              <div className="w-14 h-14 rounded-full border-2 border-black overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                {au.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={au.avatar} alt={au.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-semibold text-gray-900">{au.name}</h3>
                  {au.title && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{au.title}</span>
                  )}
                  <span className="text-xs text-gray-400 font-mono">/{au.slug}</span>
                </div>
                {au.bio && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{au.bio}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {articleCount(au.id)} article{articleCount(au.id) === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEdit(au)}
                  className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(au.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
