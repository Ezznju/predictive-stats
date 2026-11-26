export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<T = Record<string, unknown>>(): Promise<{ success?: boolean; results?: T[] }>;
  run(): Promise<{ success?: boolean; meta?: { changes?: number; last_row_id?: number } }>;
}

export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
}

interface CloudflareRequestContextLike {
  env?: Record<string, unknown>;
  ctx?: { waitUntil?: (p: Promise<unknown>) => void };
}

const CF_REQUEST_CONTEXT_SYMBOL = Symbol.for('__cloudflare-request-context__');

/**
 * Safely reads the Cloudflare Pages (`@cloudflare/next-on-pages`) request
 * context directly from `globalThis[Symbol.for('__cloudflare-request-context__')]`
 * without importing `server-only` (since `lib/db.ts` is shared with client
 * utilities like `formatDate`). Returns null outside Cloudflare Workers.
 */
function safeRequestContext(): CloudflareRequestContextLike | null {
  try {
    const g = globalThis as unknown as Record<symbol, CloudflareRequestContextLike | undefined>;
    return g[CF_REQUEST_CONTEXT_SYMBOL] ?? null;
  } catch {
    return null;
  }
}

/**
 * Returns the native in-datacenter Cloudflare D1 binding if configured in
 * Cloudflare Pages (bound as `DB`, `D1`, or `DATABASE`). When null, callers
 * seamlessly fall back to the Cloudflare D1 HTTP REST API.
 */
export function getCloudflareD1(): D1DatabaseLike | null {
  const env = safeRequestContext()?.env;
  if (!env) return null;
  const candidate = (env.DB ?? env.D1 ?? env.DATABASE) as D1DatabaseLike | undefined;
  if (candidate && typeof candidate.prepare === 'function') {
    return candidate;
  }
  return null;
}

/**
 * Schedules background work using Cloudflare Workers' real `ctx.waitUntil()`.
 * Replaces `@vercel/functions`'s `waitUntil` which is a no-op on Cloudflare Pages.
 */
export function cfWaitUntil(promise: Promise<unknown>): void {
  const safePromise = promise.catch((err) => {
    console.warn('[cfWaitUntil] background task failed:', String(err));
  });
  const ctx = safeRequestContext()?.ctx;
  if (ctx && typeof ctx.waitUntil === 'function') {
    try {
      ctx.waitUntil(safePromise);
      return;
    } catch {
      // fall through
    }
  }
  void safePromise;
}
