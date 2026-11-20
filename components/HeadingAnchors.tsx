'use client';

import { useEffect } from 'react';

/**
 * Injects a hover-only "#" copy-link button into every h2/h3 inside the
 * article prose. Stays completely hidden at rest so headings remain razor-clean,
 * and shows a crisp "Copied ✓" pill on click.
 */
export function HeadingAnchors() {
  useEffect(() => {
    const prose = document.querySelector('.prose');
    if (!prose) return;
    const headings = prose.querySelectorAll('h2, h3');
    const used = new Set<string>();
    const cleanups: (() => void)[] = [];

    headings.forEach((h) => {
      if (!h.id) {
        const base =
          (h.textContent || 'section')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .slice(0, 60) || 'section';
        let id = `sec-${base}`;
        let n = 2;
        while (used.has(id) || document.getElementById(id)) id = `sec-${base}-${n++}`;
        h.id = id;
      }
      used.add(h.id);

      if (h.querySelector(':scope > .heading-anchor')) return;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'heading-anchor';
      btn.setAttribute('aria-label', 'Copy link to this section');
      btn.setAttribute('title', 'Copy link to section');
      btn.textContent = '#';
      let t: ReturnType<typeof setTimeout> | undefined;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = `${window.location.origin}${window.location.pathname}#${h.id}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        btn.textContent = 'Copied ✓';
        btn.classList.add('is-copied');
        if (t) clearTimeout(t);
        t = setTimeout(() => {
          btn.textContent = '#';
          btn.classList.remove('is-copied');
        }, 1600);
        window.history.replaceState(null, '', `#${h.id}`);
      });
      h.appendChild(btn);
      cleanups.push(() => {
        if (t) clearTimeout(t);
        btn.remove();
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
