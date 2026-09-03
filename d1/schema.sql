-- D1 schema for predictive-stats (free, no egress)
-- Mirrors Supabase articles/authors/categories/site_settings
-- Run via: wrangler d1 execute predictive-stats-db --file=./d1/schema.sql

CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  bio TEXT,
  title TEXT,
  avatar TEXT,
  twitter TEXT,
  linkedin TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT
);

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  author_id TEXT REFERENCES authors(id),
  category_slug TEXT,
  tags TEXT, -- JSON array stored as TEXT
  publish_date TEXT,
  updated_date TEXT,
  read_time INTEGER,
  featured INTEGER, -- 0/1
  status TEXT,
  seo_title TEXT,
  meta_description TEXT,
  pull_quote TEXT
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(featured);

CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY,
  site_name TEXT,
  site_tagline TEXT,
  site_description TEXT,
  site_url TEXT,
  newsletter_heading TEXT,
  newsletter_body TEXT,
  mission_heading TEXT,
  mission_body TEXT,
  social_twitter TEXT,
  social_linkedin TEXT,
  social_github TEXT
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  token TEXT,
  unsubscribed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS scanner_cache (
  cache_key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS outbound_clicks (
  id TEXT PRIMARY KEY,
  platform_slug TEXT NOT NULL,
  ctx TEXT,
  is_affiliate INTEGER NOT NULL DEFAULT 0,
  referer TEXT,
  country TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_outbound_platform_created ON outbound_clicks(platform_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_created ON outbound_clicks(created_at DESC);
CREATE TABLE IF NOT EXISTS pulse_wallets (
  address TEXT PRIMARY KEY,
  username TEXT,
  bio TEXT,
  profile_image TEXT,
  x_username TEXT,
  rank INTEGER,
  pnl REAL DEFAULT 0,
  volume REAL DEFAULT 0,
  win_rate REAL DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  avg_hold_hours REAL DEFAULT 0,
  is_smart INTEGER DEFAULT 0,
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE TABLE IF NOT EXISTS pulse_whale_trades (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  condition_id TEXT NOT NULL,
  market_title TEXT,
  market_slug TEXT,
  event_slug TEXT,
  side TEXT NOT NULL CHECK (side IN ('BUY','SELL')),
  outcome TEXT,
  size REAL NOT NULL,
  price REAL NOT NULL,
  usdc_size REAL,
  tx_hash TEXT,
  is_whale INTEGER DEFAULT 1,
  anomaly_score REAL DEFAULT 0,
  detected_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_whale_trades_wallet ON pulse_whale_trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_whale_trades_condition ON pulse_whale_trades(condition_id);
CREATE INDEX IF NOT EXISTS idx_whale_trades_detected ON pulse_whale_trades(detected_at DESC);
CREATE TABLE IF NOT EXISTS pulse_market_stats (
  condition_id TEXT PRIMARY KEY,
  market_title TEXT,
  market_slug TEXT,
  event_slug TEXT,
  category TEXT,
  volume_24hr REAL DEFAULT 0,
  liquidity REAL DEFAULT 0,
  whale_volume REAL DEFAULT 0,
  whale_buy_count INTEGER DEFAULT 0,
  whale_sell_count INTEGER DEFAULT 0,
  whale_unique INTEGER DEFAULT 0,
  top_holders TEXT DEFAULT '[]',
  last_synced_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
