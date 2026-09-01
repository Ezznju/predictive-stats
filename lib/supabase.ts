import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getClient(admin = false): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = admin
    ? process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase is not configured — reads use static JSON, writes are unavailable');
  }

  if (admin) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(url, key, {
        global: {
          headers: process.env.ADMIN_API_TOKEN
            ? { 'x-admin-token': process.env.ADMIN_API_TOKEN }
            : {},
          fetch: (input, init) =>
            fetch(input, { ...init, cache: 'no-store' as RequestCache }),
        },
      });
    }
    return _supabaseAdmin;
  }

  if (!_supabase) {
    _supabase = createClient(url, key, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, cache: 'no-store' as RequestCache }),
      },
    });
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient(false) as any)[prop];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getClient(true) as any)[prop];
  },
});
