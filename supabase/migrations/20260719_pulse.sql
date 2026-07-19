-- Prediction Pulse: whale tracking tables.
-- Stores wallet profiles, whale trades, and market statistics
-- for the live intelligence dashboard.

-- Tracked wallets (whales identified from leaderboard + holders).
create table if not exists public.pulse_wallets (
  address        text primary key,
  username       text,
  bio            text,
  profile_image  text,
  x_username     text,
  rank           integer,
  pnl            numeric default 0,
  volume         numeric default 0,
  win_rate       numeric default 0,
  trade_count    integer default 0,
  avg_hold_hours numeric default 0,
  is_smart       boolean default false,
  last_synced_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.pulse_wallets enable row level security;

drop policy if exists "anon_select_pulse_wallets" on public.pulse_wallets;
create policy "anon_select_pulse_wallets"
  on public.pulse_wallets
  for select
  to anon
  using (true);

-- Whale trades detected by the system.
create table if not exists public.pulse_whale_trades (
  id              uuid primary key default gen_random_uuid(),
  wallet_address  text not null references public.pulse_wallets(address) on delete cascade,
  condition_id    text not null,
  market_title    text,
  market_slug     text,
  event_slug      text,
  side            text not null check (side in ('BUY', 'SELL')),
  outcome         text,
  size            numeric not null,
  price           numeric not null,
  usdc_size       numeric,
  tx_hash         text,
  is_whale        boolean default true,
  anomaly_score   numeric default 0,
  detected_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table public.pulse_whale_trades enable row level security;

drop policy if exists "anon_select_pulse_whale_trades" on public.pulse_whale_trades;
create policy "anon_select_pulse_whale_trades"
  on public.pulse_whale_trades
  for select
  to anon
  using (true);

create index if not exists idx_whale_trades_wallet on public.pulse_whale_trades(wallet_address);
create index if not exists idx_whale_trades_condition on public.pulse_whale_trades(condition_id);
create index if not exists idx_whale_trades_detected on public.pulse_whale_trades(detected_at desc);

-- Market-level whale activity summary.
create table if not exists public.pulse_market_stats (
  condition_id     text primary key,
  market_title     text,
  market_slug      text,
  event_slug       text,
  category         text,
  volume_24hr      numeric default 0,
  liquidity        numeric default 0,
  whale_volume     numeric default 0,
  whale_buy_count  integer default 0,
  whale_sell_count integer default 0,
  whale_unique     integer default 0,
  top_holders      jsonb default '[]'::jsonb,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.pulse_market_stats enable row level security;

drop policy if exists "anon_select_pulse_market_stats" on public.pulse_market_stats;
create policy "anon_select_pulse_market_stats"
  on public.pulse_market_stats
  for select
  to anon
  using (true);

-- RPC for token-gated writes (same pattern as scanner_cache).
create or replace function public.pulse_upsert_wallet(
  p_token     text,
  p_address   text,
  p_username  text,
  p_bio       text,
  p_profile_image text,
  p_x_username text,
  p_rank      integer,
  p_pnl       numeric,
  p_volume    numeric,
  p_win_rate  numeric,
  p_trade_count integer,
  p_is_smart  boolean
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

  insert into public.pulse_wallets (
    address, username, bio, profile_image, x_username,
    rank, pnl, volume, win_rate, trade_count, is_smart,
    last_synced_at, updated_at
  ) values (
    p_address, p_username, p_bio, p_profile_image, p_x_username,
    p_rank, p_pnl, p_volume, p_win_rate, p_trade_count, p_is_smart,
    now(), now()
  )
  on conflict (address)
  do update set
    username = excluded.username,
    bio = excluded.bio,
    profile_image = excluded.profile_image,
    x_username = excluded.x_username,
    rank = excluded.rank,
    pnl = excluded.pnl,
    volume = excluded.volume,
    win_rate = excluded.win_rate,
    trade_count = excluded.trade_count,
    is_smart = excluded.is_smart,
    last_synced_at = now(),
    updated_at = now();
end;
$$;

revoke all on function public.pulse_upsert_wallet(text, text, text, text, text, text, integer, numeric, numeric, numeric, integer, boolean) from public;
grant execute on function public.pulse_upsert_wallet(text, text, text, text, text, text, integer, numeric, numeric, numeric, integer, boolean)
  to anon, authenticated, service_role;
