-- Newsletter welcome-email support:
-- 1. unsubscribe_token on newsletter_subscribers (unguessable uuid per subscriber)
-- 2. newsletter_subscribe() RPC: inserts and returns the token ONLY for brand-new
--    signups (re-subscribing an existing email returns NULL so tokens can't be harvested)
-- 3. newsletter_unsubscribe() RPC: deletes by token

alter table public.newsletter_subscribers
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists newsletter_subscribers_unsubscribe_token_key
  on public.newsletter_subscribers (unsubscribe_token);

create or replace function public.newsletter_subscribe(p_email text, p_source text default 'site')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if p_email is null or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'invalid email';
  end if;

  insert into public.newsletter_subscribers (email, source)
  values (lower(trim(p_email)), coalesce(p_source, 'site'))
  on conflict (email) do nothing
  returning unsubscribe_token into v_token;

  -- NULL means the email was already subscribed
  return v_token;
end;
$$;

create or replace function public.newsletter_unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.newsletter_subscribers where unsubscribe_token = p_token;
  return found;
end;
$$;

revoke all on function public.newsletter_subscribe(text, text) from public;
revoke all on function public.newsletter_unsubscribe(uuid) from public;
grant execute on function public.newsletter_subscribe(text, text) to anon, authenticated, service_role;
grant execute on function public.newsletter_unsubscribe(uuid) to anon, authenticated, service_role;
