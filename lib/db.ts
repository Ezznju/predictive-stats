import { supabase } from './supabase';
import { Article, Author, Category, SiteSettings } from '@/types';

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
    siteName: row.site_name ?? 'PredictaView',
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
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('publish_date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();
  if (error) return null;
  return toArticle(data);
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

export async function getRelatedArticles(article: Article, count: number = 3): Promise<Article[]> {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category_slug', article.categorySlug)
    .eq('status', 'published')
    .neq('id', article.id)
    .order('publish_date', { ascending: false })
    .limit(count);
  if (error) throw error;
  return (data ?? []).map(toArticle);
}

/* ───── authors ───── */

export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toAuthor);
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
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toCategory);
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
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) {
    return {
      siteName: 'PredictaView',
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
  }
  return toSettings(data);
}

/* ───── date formatting ───── */

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
