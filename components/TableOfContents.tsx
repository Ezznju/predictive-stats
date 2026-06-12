'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// Bright dot colors cycled per item — same palette as the Browse Topics cards
const DOT_COLORS = ['#FF00B8', '#29C5F6', '#FFE642', '#2BD96E', '#9D5CFF', '#FF6B00'];

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const prose = document.querySelector('.prose');
    if (!prose) return;

    const headings = prose.querySelectorAll('h2, h3');
    const tocItems: TocItem[] = [];

    headings.forEach((h, i) => {
      const id = h.id || `heading-${i}`;
      if (!h.id) h.id = id;
      tocItems.push({
        id,
        text: h.textContent || '',
        level: h.tagName === 'H2' ? 2 : 3,
      });
    });

    setItems(tocItems);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null;

  return (
    <nav className="my-8 p-5 rounded-2xl bg-neon-lime card-pop">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left"
      >
        <span className="heading-chip bg-neon-magenta shrink-0" />
        <span className="font-display font-bold text-lg text-black">
          Table of Contents
        </span>
        <span className="ml-auto text-xs font-bold text-black/60">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <ol className="mt-4 space-y-1.5 list-none pl-0">
          {items.map((item, i) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`group flex items-center gap-2.5 text-sm rounded-lg px-2 py-1.5 transition-all duration-150 ${
                  item.level === 3 ? 'ml-5' : 'ml-0'
                } ${
                  activeId === item.id
                    ? 'bg-black text-neon-lime font-bold border-2 border-black shadow-pop-sm'
                    : 'text-black font-medium hover:bg-white hover:border-2 hover:border-black hover:shadow-pop-sm hover:-translate-x-0.5 hover:-translate-y-0.5'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border-2 border-black shrink-0"
                  style={{ backgroundColor: DOT_COLORS[i % DOT_COLORS.length] }}
                />
                {item.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
