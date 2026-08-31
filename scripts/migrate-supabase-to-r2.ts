/**
 * Migrate Supabase Storage (images bucket) -> Cloudflare R2
 * Keeps same keys (articles/...), uploads with immutable cache.
 * 
 * Usage:
 *   npx tsx scripts/migrate-supabase-to-r2.ts              # full migrate
 *   npx tsx scripts/migrate-supabase-to-r2.ts --dry-run    # list only, no upload
 *   npx tsx scripts/migrate-supabase-to-r2.ts --limit=10   # first 10 files
 *   npx tsx scripts/migrate-supabase-to-r2.ts --prefix=articles/2024
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, ADMIN_API_TOKEN (or SUPABASE_SERVICE_ROLE_KEY)
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL (optional)
 */
import { createClient } from '@supabase/supabase-js';
import { getR2Config, r2ObjectUrl, signedR2Headers, publicMediaUrl } from '../lib/r2';

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : Infinity;
const PREFIX_ARG = process.argv.find((a) => a.startsWith('--prefix='))?.split('=')[1] || '';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminToken = process.env.ADMIN_API_TOKEN;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');

  // Prefer service_role if provided (bypasses RLS), otherwise use anon + x-admin-token header pattern used in app
  if (serviceRole) {
    return createClient(url, serviceRole);
  }
  return createClient(url, anonKey, {
    global: {
      headers: adminToken ? { 'x-admin-token': adminToken } : {},
    },
  });
}

async function listAll(supabase: any, prefix: string, out: string[] = []): Promise<string[]> {
  const listPrefix = prefix ? prefix.replace(/\/$/, '') : '';
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from('images').list(listPrefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`list ${listPrefix || '/'} offset ${offset} failed: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data as any[]) {
      const isFolder = !item.id && !item.metadata;
      const fullPath = listPrefix ? `${listPrefix}/${item.name}` : item.name;
      if (isFolder) {
        await listAll(supabase, fullPath, out);
      } else if (item.id) {
        out.push(fullPath);
      }
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return out;
}

async function main() {
  console.log(`[migrate] DRY_RUN=${DRY_RUN} LIMIT=${LIMIT} PREFIX="${PREFIX_ARG}"`);
  const supabase = getSupabaseClient();
  const r2 = getR2Config();
  console.log(`[migrate] Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`[migrate] R2: ${r2.accountId}.r2.cloudflarestorage.com/${r2.bucket} publicUrl=${r2.publicUrl || '(via /api/media)'}`);

  const startPrefix = PREFIX_ARG || '';
  console.log(`[migrate] Listing Supabase Storage "images" under "${startPrefix || '/'}" ...`);
  const keys = await listAll(supabase, startPrefix);
  console.log(`[migrate] Found ${keys.length} files in Supabase Storage`);

  const toProcess = keys.slice(0, LIMIT);
  console.log(`[migrate] Will process ${toProcess.length} files${DRY_RUN ? ' (DRY RUN - no uploads)' : ''}`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const key = toProcess[i];
    const tag = `[${i + 1}/${toProcess.length}] ${key}`;
    try {
      // Download from Supabase
      const { data: blob, error: dlError } = await supabase.storage.from('images').download(key);
      if (dlError || !blob) {
        console.error(`${tag} download failed: ${dlError?.message}`);
        failed++;
        continue;
      }
      const buffer = Buffer.from(await blob.arrayBuffer());
      const contentType = (blob as any).type || 'application/octet-stream';

      if (DRY_RUN) {
        console.log(`${tag} would upload ${buffer.length} bytes (${contentType}) -> ${publicMediaUrl(key, r2)}`);
        uploaded++;
        continue;
      }

      // Optional: check if already exists in R2 via HEAD
      const url = r2ObjectUrl(key, r2);
      const headHeaders = signedR2Headers('GET', url, '', r2);
      // Use HEAD-like check via GET with range 0-0 to avoid full download - just check 200/404
      // Simpler: try PUT directly with --skip-existing flag not implemented; we overwrite for now
      // Upload to R2
      const putHeaders = signedR2Headers('PUT', url, buffer, r2, {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable',
      });

      const res = await fetch(url, { method: 'PUT', headers: putHeaders, body: buffer as unknown as BodyInit });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`${tag} R2 PUT failed ${res.status}: ${text}`);
        failed++;
        continue;
      }

      console.log(`${tag} OK ${buffer.length} bytes -> ${publicMediaUrl(key, r2)}`);
      uploaded++;

      // Small delay to avoid rate limiting
      if (i % 10 === 9) await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`${tag} error:`, e instanceof Error ? e.message : e);
      failed++;
    }
  }

  console.log(`\n[migrate] Done. uploaded=${uploaded} failed=${failed} skipped=${skipped} DRY_RUN=${DRY_RUN}`);
  if (DRY_RUN) console.log('[migrate] Dry run complete - rerun without --dry-run to actually copy');
  else console.log(`[migrate] Verify: check R2 dashboard for ${uploaded} objects, or visit ${r2.publicUrl || '/api/media'}/<key>`);
}

main().catch((e) => {
  console.error('[migrate] fatal:', e);
  process.exit(1);
});



