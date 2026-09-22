/**
 * Per-isolate TTL cache for the Edge/Workers runtime.
 *
 * Next's `unstable_cache` and fetch-level `revalidate` are not supported on
 * Cloudflare's Workers runtime, so page data bundles are cached in the
 * Worker isolate's memory instead. Entries expire by TTL; there is no global
 * tag purge (isolates recycle on their own).
 *
 * IMPORTANT: slim every payload before caching — an isolate gets ~128MB and
 * article rows carry full HTML bodies (~60KB each). List payloads should
 * strip `content` (cards never render it).
 */
const stores = new Map<string, Map<string, { at: number; data: unknown }>>();

export function cachedByKey<T>(
  namespace: string,
  ttlMs: number,
  loader: (key: string) => Promise<T>
): (key?: string) => Promise<T> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  const s = store;
  return async (key?: string): Promise<T> => {
    const k = key ?? '__default__';
    const hit = s.get(k);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data as T;
    const data = await loader(k);
    s.set(k, { at: Date.now(), data });
    return data;
  };
}

/** Drop heavy `content` fields from article lists before caching. */
export function slimArticles<T extends { content?: string }>(articles: T[]): T[] {
  return articles.map((a) => (a.content ? { ...a, content: '' } : a));
}
