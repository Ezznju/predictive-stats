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
          <h1 className="font-display font-bold text-2xl text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <button className="bg-orange-600 hover:bg-orange-600/90 text-white px-4 py-2.5 rounded-xl font-display font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm">
          <PlusCircle className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => {
          const count = articles.filter((a) => a.categorySlug === cat.slug).length;
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
                  <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-gray-50 rounded-lg transition-colors">
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
