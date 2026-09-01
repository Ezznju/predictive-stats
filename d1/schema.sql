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

-- Seed will be imported from Supabase dump via scripts/import-to-d1.ts
