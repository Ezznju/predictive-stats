import { Article } from '@/types';

export interface HomepageContent {
  hero: Article | null;
  subFeatured: Article[];
  trending: Article[];
  latest: Article[];
  popularReads: Article[];
}

/**
 * Builds the homepage sections with a single `used` set threaded through,
 * so NO article appears twice on the page. Sections that can't fill
 * themselves with fresh articles return fewer items (or none) — the layout
 * then hides them. Fixes the 17-cards-from-7-articles repetition.
 *
 * Priority order = order of the take() calls. Swap `latest`/`trending` if
 * you'd rather keep the hero-rail numbered list populated over the grid.
 */
export function buildHomepageContent(featured: Article[], all: Article[]): HomepageContent {
  const used = new Set<string>();

  const take = (pool: Article[], n: number): Article[] => {
    const out: Article[] = [];
    for (const a of pool) {
      if (used.has(a.id)) continue;
      out.push(a);
      used.add(a.id);
      if (out.length >= n) break;
    }
    return out;
  };

  const hero = take(featured, 1)[0] ?? take(all, 1)[0] ?? null;
  const subFeatured = take(featured, 2);
  const latest = take(all, 6);
  const trending = take(all, 4);
  const popularReads = take(all, 4);

  return { hero, subFeatured, trending, latest, popularReads };
}
