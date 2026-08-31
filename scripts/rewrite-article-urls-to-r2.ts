/**
 * Rewrite Supabase Storage URLs in DB -> R2 URLs
 * Keeps same object keys, just swaps host.
 *   Before: https://xyz.supabase.co/storage/v1/object/public/images/articles/2024-01-01/foo.jpg
 *   After:  https://<R2_PUBLIC_URL>/articles/2024-01-01/foo.jpg  (or /api/media/articles/...)
 *
 * Safe: dry-run by default, shows diff before writing.
 *
 * Usage:
 *   npx tsx scripts/rewrite-article-urls-to-r2.ts --dry-run          # preview
 *   npx tsx scripts/rewrite-article-urls-to-r2.ts --apply            # actually update DB
 *   npx tsx scripts/rewrite-article-urls-to-r2.ts --apply --limit=5
 *   npx tsx scripts/rewrite-article-urls-to-r2.ts --dry-run --verbose
 *
 * Env:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY or ADMIN_API_TOKEN
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */
import { createClient } from '@supabase/supabase-js';
import { getR2Config, publicMediaUrl } from '../lib/r2';

const DRY_RUN = !process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const LIMIT_ARG = process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1];
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : Infinity;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!url || !anonKey) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (serviceRole) return createClient(url, serviceRole);
  return createClient(url, anonKey, {
    global: { headers: adminToken ? { 'x-admin-token': adminToken } : {} },
  });
}

// Matches any Supabase Storage public URL for the images bucket
const SUPABASE_IMAGE_RE = /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/images\/([^"'()\s>]+)/g;
const API_MEDIA_RE = /\/api\/media\/([^"'()\s>]+)/g;

function rewriteUrlText(text: string, r2: ReturnType<typeof getR2Config>): { rewritten: string; count: number } {
  let count = 0;
  let out = text;
  out = out.replace(SUPABASE_IMAGE_RE, (_match, key: string) => {
    try {
      const cleanKey = decodeURIComponent(key).replace(/\/$/, '');
      count++;
      return publicMediaUrl(cleanKey, r2);
    } catch {
      count++;
      return publicMediaUrl(key, r2);
    }
  });
  if (r2.publicUrl) {
    out = out.replace(API_MEDIA_RE, (_match, key: string) => {
      try {
        const cleanKey = decodeURIComponent(key).replace(/\/$/, '');
        count++;
        return publicMediaUrl(cleanKey, r2);
      } catch {
        count++;
        return publicMediaUrl(key, r2);
      }
    });
  }
  return { rewritten: out, count };
}

async function main() {
  console.log(`[rewrite] mode=${DRY_RUN ? 'DRY-RUN (use --apply to write)' : 'APPLY'} limit=${LIMIT} verbose=${VERBOSE}`);
  const supabase = getSupabaseAdmin();
  const r2 = getR2Config();
  console.log(`[rewrite] Supabase: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`[rewrite] R2 publicUrl: ${r2.publicUrl || '(fallback /api/media)'} -> example: ${publicMediaUrl('articles/2024-01-01/test.jpg', r2)}`);

  // --- Articles ---
  console.log('\n[rewrite] Fetching articles...');
  const { data: articles, error: artErr } = await supabase.from('articles').select('id, slug, featured_image, content, title');
  if (artErr) throw new Error(`fetch articles failed: ${artErr.message}`);
  console.log(`[rewrite] Found ${articles?.length || 0} articles`);

  let articlesToUpdate: Array<{ id: string; slug: string; patch: Record<string, string>; changes: number }> = [];

  for (const row of (articles || []).slice(0, LIMIT)) {
    const patch: Record<string, string> = {};
    let changes = 0;

    if (row.featured_image && (SUPABASE_IMAGE_RE.test(row.featured_image) || (r2.publicUrl && API_MEDIA_RE.test(row.featured_image)))) {
      SUPABASE_IMAGE_RE.lastIndex = 0;
      API_MEDIA_RE.lastIndex = 0;
      const { rewritten, count } = rewriteUrlText(row.featured_image, r2);
      if (count > 0 && rewritten !== row.featured_image) {
        patch['featured_image'] = rewritten;
        changes += count;
        if (VERBOSE) console.log(`  [article ${row.slug}] featured_image: ${row.featured_image} -> ${rewritten}`);
      }
    }
    // Reset regex state
    SUPABASE_IMAGE_RE.lastIndex = 0;
    API_MEDIA_RE.lastIndex = 0;
    if (row.content && (SUPABASE_IMAGE_RE.test(row.content) || (r2.publicUrl && API_MEDIA_RE.test(row.content)))) {
      SUPABASE_IMAGE_RE.lastIndex = 0;
      API_MEDIA_RE.lastIndex = 0;
      const { rewritten, count } = rewriteUrlText(row.content, r2);
      if (count > 0 && rewritten !== row.content) {
        patch['content'] = rewritten;
        changes += count;
        if (VERBOSE) {
          const supMatches = [...row.content.matchAll(SUPABASE_IMAGE_RE)];
          const apiMatches = r2.publicUrl ? [...row.content.matchAll(API_MEDIA_RE)] : [];
          const beforeMatches = supMatches.length ? supMatches : apiMatches;
          const key = beforeMatches[0]?.[1] || 'unknown';
          console.log(`  [article ${row.slug}] content: ${count} urls, e.g. ${beforeMatches[0]?.[0] || 'unknown'} -> ${publicMediaUrl(key, r2)}`);
        }
      }
    }

    if (changes > 0) {
      articlesToUpdate.push({ id: row.id, slug: row.slug, patch, changes });
    }
  }

  console.log(`[rewrite] Articles needing update: ${articlesToUpdate.length} (total url replacements: ${articlesToUpdate.reduce((s, a) => s + a.changes, 0)})`);
  if (articlesToUpdate.length > 0) {
    console.log('[rewrite] Sample:');
    for (const a of articlesToUpdate.slice(0, 3)) {
      console.log(`  - ${a.slug} (${a.id}):`, Object.keys(a.patch).join(', '), `changes=${a.changes}`);
      if (VERBOSE) console.log('    patch:', JSON.stringify(a.patch).slice(0, 500));
    }
  }

  // --- Authors ---
  console.log('\n[rewrite] Fetching authors...');
  const { data: authors, error: authErr } = await supabase.from('authors').select('id, slug, avatar');
  if (authErr) console.warn(`[rewrite] fetch authors failed (non-fatal): ${authErr.message}`);
  else {
    console.log(`[rewrite] Found ${authors?.length || 0} authors`);
    let authorPatches: typeof articlesToUpdate = [];
    for (const row of authors || []) {
      if (row.avatar && (SUPABASE_IMAGE_RE.test(row.avatar) || (r2.publicUrl && API_MEDIA_RE.test(row.avatar)))) {
        SUPABASE_IMAGE_RE.lastIndex = 0;
        API_MEDIA_RE.lastIndex = 0;
        const { rewritten, count } = rewriteUrlText(row.avatar, r2);
        if (count > 0 && rewritten !== row.avatar) {
          authorPatches.push({ id: row.id, slug: row.slug, patch: { avatar: rewritten }, changes: count });
        }
      }
      SUPABASE_IMAGE_RE.lastIndex = 0;
      API_MEDIA_RE.lastIndex = 0;
    }
    console.log(`[rewrite] Authors needing update: ${authorPatches.length}`);
    // Merge into same apply loop later
    // @ts-ignore - reuse
    articlesToUpdate = [...articlesToUpdate, ...authorPatches.map((p) => ({ ...p, _table: 'authors' }))] as any;
    // Actually handle separately below
    if (!DRY_RUN && authorPatches.length > 0) {
      for (const p of authorPatches) {
        const { error } = await supabase.from('authors').update(p.patch).eq('id', p.id);
        if (error) console.error(`  [author ${p.slug}] update failed: ${error.message}`);
        else console.log(`  [author ${p.slug}] updated`);
      }
    } else if (DRY_RUN && authorPatches.length > 0) {
      console.log('[rewrite] (dry-run) would update authors:', authorPatches.map((p) => p.slug).join(', '));
    }
    // Remove author patches from articlesToUpdate for article loop
    articlesToUpdate = articlesToUpdate.filter((a: any) => !(a as any)._table);
  }

  if (DRY_RUN) {
    console.log(`\n[rewrite] DRY RUN complete. ${articlesToUpdate.length} articles would be updated. Rerun with --apply to write.`);
    if (articlesToUpdate.length > 0) {
      console.log('[rewrite] To apply: npx tsx scripts/rewrite-article-urls-to-r2.ts --apply');
    }
    return;
  }

  console.log(`\n[rewrite] Applying updates to ${articlesToUpdate.length} articles...`);
  let ok = 0;
  let fail = 0;
  for (const item of articlesToUpdate) {
    const { error } = await supabase.from('articles').update(item.patch).eq('id', item.id);
    if (error) {
      console.error(`  [${item.slug}] failed: ${error.message}`);
      fail++;
    } else {
      console.log(`  [${item.slug}] updated (${item.changes} urls)`);
      ok++;
    }
  }
  console.log(`\n[rewrite] Done. ok=${ok} fail=${fail}`);
  console.log('[rewrite] Next: run migrate-supabase-to-r2.ts to ensure R2 actually has those keys, then verify site images load from R2 (check Network tab for supabase.co -> should be 0)');
}

main().catch((e) => {
  console.error('[rewrite] fatal:', e);
  process.exit(1);
});
