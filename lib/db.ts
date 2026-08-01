import { supabase } from './supabase';
import { Article, Author, Category, SiteSettings } from '@/types';

/* ───── cache ───── */

const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

/* ───── helpers ───── */

function toArticle(row: any): Article {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    content: row.content ?? '',
    featuredImage: row.featured_image ?? '',
    authorId: row.author_id ?? '',
    categorySlug: row.category_slug ?? '',
    tags: row.tags ?? [],
    publishDate: row.publish_date ?? '',
    updatedDate: row.updated_date ?? undefined,
    readTime: row.read_time ?? 5,
    featured: row.featured ?? false,
    status: row.status ?? 'draft',
    seoTitle: row.seo_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    pullQuote: row.pull_quote ?? undefined,
  };
}

function toAuthor(row: any): Author {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    bio: row.bio ?? '',
    title: row.title ?? '',
    avatar: row.avatar ?? '',
    twitter: row.twitter ?? undefined,
    linkedin: row.linkedin ?? undefined,
  };
}

function toCategory(row: any): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    color: row.color ?? '#000000',
  };
}

function toSettings(row: any): SiteSettings {
  return {
    siteName: row.site_name ?? 'Predictions Market Fans',
    siteTagline: row.site_tagline ?? '',
    siteDescription: row.site_description ?? '',
    siteUrl: row.site_url ?? '',
    newsletterHeading: row.newsletter_heading ?? '',
    newsletterBody: row.newsletter_body ?? '',
    missionHeading: row.mission_heading ?? '',
    missionBody: row.mission_body ?? '',
    socialTwitter: row.social_twitter ?? '',
    socialLinkedin: row.social_linkedin ?? '',
    socialGithub: row.social_github ?? '',
  };
}

/* ───── public queries ───── */

export async function getArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

export async function getPublishedArticles(): Promise<Article[]> {
  const cached = getCached<Article[]>('published_articles');
  if (cached) return cached;
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  const articles = (data ?? []).map(toArticle);
  setCache('published_articles', articles);
  return articles;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const cached = getCached<Article>(`article_${slug}`);
  if (cached) return cached;
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  const article = toArticle(data);
  setCache(`article_${slug}`, article);
  return article;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return toArticle(data);
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category_slug', categorySlug)
    .eq('status', 'published')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

export async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('author_id', authorId)
    .eq('status', 'published')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('featured', true)
    .eq('status', 'published')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

export async function getLatestArticles(count: number = 10): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false })
    .limit(count);
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

/**
 * "Read next" recommendations: ranks all other published articles by
 * shared tags (3 pts each) + same category (2 pts), recency as tiebreak.
 * Falls back to most recent articles so the section is never empty.
 */
export async function getRelatedArticles(article: Article, count: number = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .neq('id', article.id)
    .order('publish_date', { ascending: false })
    .limit(100);
  if (error) throw error;

  const tagSet = new Set((article.tags ?? []).map((t) => t.toLowerCase()));
  const scored = (data ?? []).map(toArticle).map((a) => {
    const sharedTags = (a.tags ?? []).filter((t) => tagSet.has(t.toLowerCase())).length;
    const sameCategory = a.categorySlug === article.categorySlug ? 2 : 0;
    return { article: a, score: sharedTags * 3 + sameCategory };
  });

  scored.sort(
    (x, y) =>
      y.score - x.score ||
      String(y.article.publishDate).localeCompare(String(x.article.publishDate))
  );

  const related = scored.filter((s) => s.score > 0).map((s) => s.article);
  for (const s of scored) {
    if (related.length >= count) break;
    if (s.score === 0) related.push(s.article);
  }
  return related.slice(0, count);
}

/* ───── authors ───── */

export async function getAuthors(): Promise<Author[]> {
  const cached = getCached<Author[]>('authors');
  if (cached) return cached;
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('name');
  if (error) throw error;
  const authors = (data ?? []).map(toAuthor);
  setCache('authors', authors);
  return authors;
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return toAuthor(data);
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return toAuthor(data);
}

/* ───── categories ───── */

export async function getCategories(): Promise<Category[]> {
  const cached = getCached<Category[]>('categories');
  if (cached) return cached;
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  const categories = (data ?? []).map(toCategory);
  setCache('categories', categories);
  return categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return toCategory(data);
}

/* ───── site settings ───── */

export async function getSiteSettings(): Promise<SiteSettings> {
  const cached = getCached<SiteSettings>('site_settings');
  if (cached) return cached;
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) {
    const defaults = {
      siteName: 'Predictions Market Fans',
      siteTagline: 'Sharp analysis for uncertain markets',
      siteDescription: '',
      siteUrl: '',
      newsletterHeading: '',
      newsletterBody: '',
      missionHeading: '',
      missionBody: '',
      socialTwitter: '',
      socialLinkedin: '',
      socialGithub: '',
    };
    return defaults;
  }
  const settings = toSettings(data);
  setCache('site_settings', settings);
  return settings;
}

/* ───── date formatting ───── */

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
