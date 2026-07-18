/**
 * Bounded-concurrency async mapper + request memoization.
 *
 * Prevents the "fire 200 parallel fetches at once" pattern that rate-limits
 * and exhausts sockets. `pMap` runs at most `concurrency` promises at a time
 * while preserving result order.
 */

export async function pMap<T, R>(
  items: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  concurrency = 8
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

/** Simple TTL memoizer for pure-ish async functions keyed by a string. */
export class TtlCache<K, V> {
  private store = new Map<K, { value: V; expires: number }>();
  constructor(private readonly ttlMs: number) {}

  get(key: K): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (Date.now() > hit.expires) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }

  set(key: K, value: V): void {
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  /** Get or compute-and-set. */
  async wrap(key: K, compute: () => Promise<V>): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await compute();
    this.set(key, value);
    return value;
  }

  clear(): void {
    this.store.clear();
  }
}
