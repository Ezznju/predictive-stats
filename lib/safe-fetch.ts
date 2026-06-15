/**
 * Resilient fetch layer for all external API calls.
 *
 * Wraps the native `fetch` with:
 *  - per-request timeout via AbortController (no hung upstream eats the
 *    serverless time budget)
 *  - automatic retries with exponential backoff + jitter on 5xx / network errors
 *  - 429 rate-limit handling that respects the `Retry-After` header
 *  - optional Zod schema validation so an upstream shape change fails *loudly*
 *    with a clear error instead of silently returning empty data
 *
 * Use `safeFetchJson` for endpoints that must succeed (the caller can decide to
 * serve a stale cache on throw). Use a try/catch around it for best-effort
 * calls (e.g. per-event lookups) where one failure shouldn't kill the batch.
 */

import type { ZodType } from 'zod';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface SafeFetchConfig {
  /** Number of retry attempts after the first try. Default 3. */
  retries?: number;
  /** Per-attempt timeout in milliseconds. Default 8000. */
  timeoutMs?: number;
  /** Base backoff in milliseconds (grows exponentially). Default 300. */
  backoffBaseMs?: number;
  /** Max time to honor a Retry-After header, in ms. Default 5000. */
  maxRetryAfterMs?: number;
  /** Label used in error messages / logs. */
  label?: string;
}

const DEFAULTS: Required<Omit<SafeFetchConfig, 'label'>> = {
  retries: 3,
  timeoutMs: 8000,
  backoffBaseMs: 300,
  maxRetryAfterMs: 5000,
};

export class FetchError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly url?: string
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

/**
 * Fetch a URL with retries, timeout and rate-limit handling.
 * Throws `FetchError` only after all attempts are exhausted.
 */
export async function safeFetch(
  url: string,
  init: RequestInit = {},
  config: SafeFetchConfig = {}
): Promise<Response> {
  const cfg = { ...DEFAULTS, ...config };
  const label = config.label ?? url;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= cfg.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), cfg.timeoutMs);

    try {
      const res = await fetch(url, {
        ...init,
        headers: { Accept: 'application/json', ...(init.headers ?? {}) },
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Rate limited — wait and retry (respecting Retry-After when sane)
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const waitMs = Number.isFinite(retryAfter)
          ? Math.min(retryAfter * 1000, cfg.maxRetryAfterMs)
          : cfg.backoffBaseMs * 2 ** attempt;
        if (attempt < cfg.retries) {
          await sleep(waitMs);
          continue;
        }
        throw new FetchError(`${label}: rate limited (429)`, 429, url);
      }

      // Server errors are retryable
      if (res.status >= 500) {
        if (attempt < cfg.retries) {
          await sleep(backoff(cfg.backoffBaseMs, attempt));
          continue;
        }
        throw new FetchError(
          `${label}: upstream ${res.status}`,
          res.status,
          url
        );
      }

      // 4xx (other than 429) are not retryable — fail immediately
      if (!res.ok) {
        throw new FetchError(`${label}: ${res.status}`, res.status, url);
      }

      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;

      // Non-retryable client errors bubble up immediately
      if (err instanceof FetchError && err.status && err.status < 500 && err.status !== 429) {
        throw err;
      }

      if (attempt < cfg.retries) {
        await sleep(backoff(cfg.backoffBaseMs, attempt));
        continue;
      }
    }
  }

  throw new FetchError(
    `${label}: failed after ${cfg.retries + 1} attempts — ${String(lastErr)}`,
    undefined,
    url
  );
}

/**
 * Fetch + parse JSON, optionally validating against a Zod schema.
 * On validation failure throws a descriptive error (fail loud, not silent).
 */
export async function safeFetchJson<T>(
  url: string,
  schema?: ZodType<T>,
  init: RequestInit = {},
  config: SafeFetchConfig = {}
): Promise<T> {
  const res = await safeFetch(url, init, config);
  const json = await res.json();

  if (!schema) return json as T;

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const label = config.label ?? url;
    console.error(
      `[safe-fetch] schema validation failed for ${label}:`,
      parsed.error.issues.slice(0, 3)
    );
    throw new FetchError(
      `${label}: response did not match expected shape`,
      undefined,
      url
    );
  }
  return parsed.data;
}

function backoff(base: number, attempt: number): number {
  return base * 2 ** attempt + Math.random() * 200;
}
