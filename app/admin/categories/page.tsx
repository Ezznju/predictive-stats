'use client';

import { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2, Check, X, Loader2, Save } from 'lucide-react';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '', color: '' });
  const [adding, setAdding] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', slug: '', description: '', color: '#4A6CF7' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const [cRes, aRes] = await Promise.all([
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/articles', { cache: 'no-store' }),
      ]);
      setCategories(await cRes.json());
      setArticles(await aRes.json());
      setLoading(false);
    }
    load();
  }, []);

  const handleEdit = (cat: CategoryRow) => {
    setEditing(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description, color: cat.color });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const res = await fetch(`/api/categories/${editing}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setCategories(prev => prev.map(c => c.id === editing ? { ...c, ...editForm } : c));
      setEditing(null);
    }
    setSaving(false);
  };

  const handleAdd = async () => {
    if (!newForm.name.trim()) return;
    setSaving(true);
    const slug = newForm.slug || toSlug(newForm.name);
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newForm, slug }),
    });
    if (res.ok) {
      const cat = await res.json();
      setCategories(prev => [...prev, cat]);
      setNewForm({ name: '', slug: '', description: '', color: '#4A6CF7' });
      setAdding(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    const count = articles.filter(a => a.category_slug === cat?.slug).length;
    if (count > 0) {
      alert(`Cannot delete — ${count} article(s) use this category.`);
      return;
    }
    if (!confirm('Delete this category?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    setCategories(prev => prev.filter(c => c.id !== id));
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
          <h1 className="font-display font-bold text-2xl text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-white rounded-2xl border border-orange-200 p-5 mb-6 shadow-sm">
          <h3 className="font-display font-semibold text-gray-900 mb-3">New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value, slug: toSlug(e.target.value) }))} placeholder="Category name" className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300" />
            <input value={newForm.slug} onChange={e => setNewForm(p => ({ ...p, slug: e.target.value }))} placeholder="slug" className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-orange-300" />
            <input value={newForm.description} onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300 md:col-span-2" />
            <div className="flex items-center gap-2">
              <input type="color" value={newForm.color} onChange={e => setNewForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded border-0 cursor-pointer" />
              <span className="text-xs text-gray-500">{newForm.color}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} disabled={saving} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const count = articles.filter((a: any) => a.category_slug === cat.slug).length;
          const isEditing = editing === cat.id;

          if (isEditing) {
            return (
              <div key={cat.id} className="bg-white rounded-2xl border border-orange-200 p-5 shadow-sm">
                <div className="space-y-2">
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-300" />
                  <input value={editForm.slug} onChange={e => setEditForm(p => ({ ...p, slug: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-orange-300" />
                  <input value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-300" />
                  <div className="flex items-center gap-2">
                    <input type="color" value={editForm.color} onChange={e => setEditForm(p => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded border-0 cursor-pointer" />
                    <span className="text-xs text-gray-500">{editForm.color}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSaveEdit} disabled={saving} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditing(null)} className="text-gray-500 hover:bg-gray-50 p-1.5 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-gray-200 p-5 group hover:border-orange-300/30 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <h3 className="font-display font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(cat)} className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{cat.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span>{count} article{count !== 1 ? 's' : ''}</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.color}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
