-- Shared cache for the free scanner tools (LP reward scanner & arbitrage scanner).
-- Applied to the predictive-stats Supabase project as migration `create_scanner_cache`.
-- Kept in the repo for documentation / reproducibility.
--
-- Why: each cold serverless instance used to re-run the 10-15s upstream scan
-- because the cache lived in per-instance memory. This table lets every
-- instance share ONE cached result set, so the heavy scan runs at most once
-- per TTL window globally and visitors get an instant response.
--
-- Security: scanner output is public (it's the same data shown to every
-- visitor), so reads are open to anon. Writes go through the security-definer
-- RPC below, gated by the same Vault secret `admin_api_token` that the admin
-- analytics RPC uses (= the Vercel ADMIN_API_TOKEN env var).

create table if not exists public.scanner_cache (
  cache_key  text primary key,
  payload    jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.scanner_cache enable row level security;

-- Public read: the cached payload is the same public scanner output.
drop policy if exists "anon_select_scanner_cache" on public.scanner_cache;
create policy "anon_select_scanner_cache"
  on public.scanner_cache
  for select
  to anon
  using (true);

-- No direct anon insert/update — writes only via the token-gated RPC.
create or replace function public.scanner_cache_set(
  p_token   text,
  p_key     text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'admin_api_token';

  if v_secret is null or p_token is distinct from v_secret then
    raise exception 'unauthorized';
  end if;

  insert into public.scanner_cache (cache_key, payload, updated_at)
  values (p_key, p_payload, now())
  on conflict (cache_key)
  do update set payload = excluded.payload, updated_at = now();
end;
$$;

revoke all on function public.scanner_cache_set(text, text, jsonb) from public;
grant execute on function public.scanner_cache_set(text, text, jsonb)
  to anon, authenticated, service_role;
