-- Outbound click tracking for monetization rails (/go/[slug] redirects).
-- Applied to the predictive-stats Supabase project as migration `create_outbound_clicks`.
-- Kept in the repo for documentation / reproducibility.

create table if not exists public.outbound_clicks (
  id uuid primary key default gen_random_uuid(),
  platform_slug text not null,
  ctx text,                       -- where on the site the click came from (hub-table, review-cta, ...)
  is_affiliate boolean not null default false,
  referer text,
  country text,                   -- from Vercel's x-vercel-ip-country header
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists outbound_clicks_platform_created_idx
  on public.outbound_clicks (platform_slug, created_at desc);

alter table public.outbound_clicks enable row level security;

-- The /go/[slug] route inserts via the anon key (server-side). Insert-only:
-- no select/update/delete policies, so click data is only readable from the
-- Supabase dashboard or with the service role key.
create policy "anon_insert_outbound_clicks"
  on public.outbound_clicks
  for insert
  to anon
  with check (true);
