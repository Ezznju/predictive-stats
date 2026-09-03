'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Fullscreen lightbox for images inside article prose. Charts and
 * screenshots are unreadable at column width on mobile — click/tap opens
 * the image fullscreen; click/tap again zooms 2.2x anchored at the click
 * point. Esc or backdrop closes. Skips images inside links.
 */
export function ImageLightbox() {
  const [src, setSrc] = useState<string | null>(null);
  const [alt, setAlt] = useState('');
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  useEffect(() => {
    const prose = document.querySelector('.prose');
    if (!prose) return;
    const imgs = Array.from(prose.querySelectorAll('img'));
    const handlers: [HTMLImageElement, () => void][] = [];

    imgs.forEach((img) => {
      if (img.closest('a')) return; // don't hijack linked images
      img.style.cursor = 'zoom-in';
      const open = () => {
        setSrc(img.currentSrc || img.src);
        setAlt(img.alt || '');
        setZoom(false);
        setOrigin('50% 50%');
      };
      img.addEventListener('click', open);
      handlers.push([img, open]);
    });

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSrc(null); };
    window.addEventListener('keydown', onKey);
    return () => {
      handlers.forEach(([img, open]) => img.removeEventListener('click', open));
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
      onClick={() => setSrc(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      <button
        onClick={() => setSrc(null)}
        aria-label="Close image viewer"
        className="absolute top-4 right-4 p-2.5 bg-white text-black rounded-xl border-2 border-black shadow-pop hover:-translate-y-0.5 transition-transform"
      >
        <X className="w-5 h-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => {
          e.stopPropagation();
          const r = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
          setOrigin(`${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}% ${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
          setZoom((z) => !z);
        }}
        className={`max-w-full max-h-[90vh] object-contain rounded-lg transition-transform duration-200 ${zoom ? 'scale-[2.2]' : 'scale-100'}`}
        style={{ transformOrigin: origin, cursor: zoom ? 'zoom-out' : 'zoom-in' }}
        draggable={false}
      />
      {alt && (
        <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/70 px-10 truncate">
          {alt}
        </p>
      )}
    </div>
  );
}
