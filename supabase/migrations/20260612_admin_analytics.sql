-- Admin analytics RPC for the /admin/analytics dashboard.
--
-- outbound_clicks and newsletter_subscribers are insert-only under RLS (the
-- anon key cannot read them). Instead of shipping the service-role key to the
-- app, this migration adds a token-gated SECURITY DEFINER function:
--
--   admin_analytics(p_token text, p_days int) -> jsonb
--
-- The token is stored in Supabase Vault under the name 'admin_api_token' and
-- must equal the ADMIN_API_TOKEN env var used by the Next.js admin API routes.
-- The /api/analytics route calls this RPC server-side; the middleware session
-- cookie protects the route itself.
--
-- NOTE: the vault.create_secret() call below uses a placeholder in this repo
-- copy. The applied migration used the real ADMIN_API_TOKEN value.

-- 1. Make sure newsletter_subscribers has a created_at for growth charts.
alter table public.newsletter_subscribers
  add column if not exists created_at timestamptz not null default now();

-- 2. Store the admin token in Vault (idempotent).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'admin_api_token') then
    perform vault.create_secret('REPLACE_WITH_ADMIN_API_TOKEN', 'admin_api_token');
  end if;
end $$;

-- 3. The analytics RPC.
create or replace function public.admin_analytics(p_token text, p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_since timestamptz;
  result jsonb;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'admin_api_token';

  if v_secret is null or p_token is distinct from v_secret then
    raise exception 'unauthorized';
  end if;

  v_since := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));

  select jsonb_build_object(
    'days', greatest(1, least(coalesce(p_days, 30), 365)),
    'clicks', jsonb_build_object(
      'total_all_time', (select count(*) from outbound_clicks),
      'total_period', (select count(*) from outbound_clicks where created_at >= v_since),
      'affiliate_period', (select count(*) from outbound_clicks where created_at >= v_since and is_affiliate),
      'by_platform', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select platform_slug, count(*)::int as clicks,
                 (count(*) filter (where is_affiliate))::int as affiliate_clicks
          from outbound_clicks where created_at >= v_since
          group by platform_slug order by clicks desc
        ) t),
      'by_day', (
        select coalesce(jsonb_agg(t order by t.day), '[]'::jsonb) from (
          select (created_at at time zone 'utc')::date as day, count(*)::int as clicks
          from outbound_clicks where created_at >= v_since
          group by 1
        ) t),
      'by_ctx', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select coalesce(ctx, '(none)') as ctx, count(*)::int as clicks
          from outbound_clicks where created_at >= v_since
          group by 1 order by clicks desc limit 10
        ) t),
      'by_country', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select coalesce(country, '??') as country, count(*)::int as clicks
          from outbound_clicks where created_at >= v_since
          group by 1 order by clicks desc limit 10
        ) t),
      'top_referers', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select coalesce(referer, '(direct)') as referer, count(*)::int as clicks
          from outbound_clicks where created_at >= v_since
          group by 1 order by clicks desc limit 10
        ) t),
      'recent', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select platform_slug, ctx, is_affiliate, country, referer, created_at
          from outbound_clicks order by created_at desc limit 15
        ) t)
    ),
    'subscribers', jsonb_build_object(
      'total', (select count(*) from newsletter_subscribers),
      'new_period', (select count(*) from newsletter_subscribers where created_at >= v_since),
      'by_day', (
        select coalesce(jsonb_agg(t order by t.day), '[]'::jsonb) from (
          select (created_at at time zone 'utc')::date as day, count(*)::int as signups
          from newsletter_subscribers where created_at >= v_since
          group by 1
        ) t),
      'by_source', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select coalesce(source, '(unknown)') as source, count(*)::int as signups
          from newsletter_subscribers group by 1 order by signups desc
        ) t),
      'recent', (
        select coalesce(jsonb_agg(t), '[]'::jsonb) from (
          select email, source, created_at
          from newsletter_subscribers order by created_at desc limit 10
        ) t)
    ),
    'contact_messages', jsonb_build_object(
      'total', (select count(*) from contact_messages),
      'unread', (select count(*) from contact_messages where read = false)
    )
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_analytics(text, int) from public;
grant execute on function public.admin_analytics(text, int) to anon, authenticated, service_role;
