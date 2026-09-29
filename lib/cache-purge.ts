/**
 * Cloudflare edge-cache purge helpers.
 *
 * The zone caches HTML pages at the edge (7-day TTL) so most requests are
 * served WITHOUT invoking the Pages function — the only way to stay inside
 * the free tier's 10ms CPU-per-request budget. That means publishing must
 * actively purge the affected URLs, or fresh content would wait out the TTL.
 *
 * Best-effort: a purge failure never breaks the write that triggered it.
 */

const ZONE_ID = '4df985a7f042018b02f272240fd29122';
const BASE = 'https://predictionsmarketfans.com';

async function purgeFiles(files: string[]): Promise<void> {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files }),
        signal: AbortSignal.timeout(8000),
      }
    );
    const j = await res.json().catch(() => null);
    if (!j?.success) {
      console.warn('[cache-purge] not applied:', JSON.stringify(j?.errors ?? res.status));
    }
  } catch (err) {
    console.warn('[cache-purge] error:', String(err));
  }
}

/** Purge the pages that change when an article is written. */
export async function purgeArticleUrls(
  categorySlug: string | null | undefined,
  slug: string | null | undefined
): Promise<void> {
  const files: string[] = [
    `${BASE}/`,
    `${BASE}/${categorySlug || 'articles'}`,
    `${BASE}/articles`,
  ];
  if (categorySlug && slug) {
    files.push(`${BASE}/${categorySlug}/${slug}`);
    files.push(`${BASE}/${categorySlug}/${slug}/og`);
  }
  // Also clear the category listing page that may include this article.
  if (categorySlug) files.push(`${BASE}/category/${categorySlug}`);
  await purgeFiles(Array.from(new Set(files)));
}
