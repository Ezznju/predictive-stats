'use client';

import { useState } from 'react';
import { PlusCircle, Edit, Trash2, Check, X } from 'lucide-react';
import { categories, articles } from '@/lib/data';

export default function AdminCategoriesPage() {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Categories</h1>
          <p className="text-sm text-slate-500 mt-1">{categories.length} categories</p>
        </div>
        <button className="bg-brand-red hover:bg-brand-red/90 text-white px-4 py-2.5 rounded-lg font-display font-semibold text-sm transition-colors flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const count = articles.filter((a) => a.categorySlug === cat.slug).length;
          return (
            <div key={cat.id} className="bg-surface-raised rounded-xl border border-surface-border p-5 group hover:border-brand-red/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <div>
                    <h3 className="font-display font-semibold text-white">{cat.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-slate-500 hover:text-white hover:bg-surface-overlay rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-slate-500 hover:text-brand-red hover:bg-surface-overlay rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-400 mt-2 line-clamp-2">{cat.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
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
