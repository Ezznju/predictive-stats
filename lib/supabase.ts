import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (input, init) => {
      return fetch(input, { ...init, cache: 'no-store' as RequestCache });
    },
  },
});

/**
 * Server-side client for write operations (admin API routes only).
 * Sends the x-admin-token header, which database RLS policies verify
 * before allowing INSERT/UPDATE/DELETE on content tables.
 * NEVER import this in client components — ADMIN_API_TOKEN must stay server-side.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: process.env.ADMIN_API_TOKEN
      ? { 'x-admin-token': process.env.ADMIN_API_TOKEN }
      : {},
    fetch: (input, init) => {
      return fetch(input, { ...init, cache: 'no-store' as RequestCache });
    },
  },
});
