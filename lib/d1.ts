import { Article, Author, Category, SiteSettings } from '@/types';
import fs from 'fs';
import path from 'path';

// Static JSON fallback (committed to repo, zero egress)
let staticData: { articles: any[]; authors: any[]; categories: any[]; site_settings: any[] } | null = null;
function loadStatic(){
  if(staticData) return staticData;
  try {
    const p = path.join(process.cwd(), 'data', 'db.json');
    if(fs.existsSync(p)){
      staticData = JSON.parse(fs.readFileSync(p, 'utf8'));
      return staticData!;
    }
  } catch {}
  return null;
}

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
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags ?? [],
    publishDate: row.publish_date ?? '',
    updatedDate: row.updated_date ?? undefined,
    readTime: row.read_time ?? 5,
    featured: !!row.featured,
    status: row.status ?? 'draft',
    seoTitle: row.seo_title ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    pullQuote: row.pull_quote ?? undefined,
  };
}
function toAuthor(row: any): Author {
  return {
    id: row.id, name: row.name, slug: row.slug, bio: row.bio ?? '', title: row.title ?? '',
    avatar: row.avatar ?? '', twitter: row.twitter ?? undefined, linkedin: row.linkedin ?? undefined,
  };
}
function toCategory(row: any): Category {
  return { id: row.id, name: row.name, slug: row.slug, description: row.description ?? '', color: row.color ?? '#000000' };
}
function toSettings(row: any): SiteSettings {
  return {
    siteName: row.site_name ?? 'Predictions Market Fans', siteTagline: row.site_tagline ?? '', siteDescription: row.site_description ?? '',
    siteUrl: row.site_url ?? '', newsletterHeading: row.newsletter_heading ?? '', newsletterBody: row.newsletter_body ?? '',
    missionHeading: row.mission_heading ?? '', missionBody: row.mission_body ?? '',
    socialTwitter: row.social_twitter ?? '', socialLinkedin: row.social_linkedin ?? '', socialGithub: row.social_github ?? '',
  };
}

export async function getPublishedArticles(): Promise<Article[]> {
  const d = loadStatic();
  if(d) return d.articles.filter((r: any) => r.status === 'published').sort((a: any,b: any)=> String(b.publish_date).localeCompare(String(a.publish_date))).map(toArticle);
  return [];
}
export async function getFeaturedArticles(): Promise<Article[]> {
  const d = loadStatic();
  if(d) return d.articles.filter((r: any) => r.featured && r.status === 'published').sort((a: any,b: any)=> String(b.publish_date).localeCompare(String(a.publish_date))).map(toArticle);
  return [];
}
export async function getAuthors(): Promise<Author[]> {
  const d = loadStatic();
  if(d) return d.authors.map(toAuthor);
  return [];
}
export async function getCategories(): Promise<Category[]> {
  const d = loadStatic();
  if(d) return d.categories.map(toCategory);
  return [];
}
export async function getSiteSettings(): Promise<SiteSettings> {
  const d = loadStatic();
  if(d && d.site_settings[0]) return toSettings(d.site_settings[0]);
  return { siteName: 'Predictions Market Fans', siteTagline: 'Sharp analysis for uncertain markets', siteDescription: '', siteUrl: '', newsletterHeading: '', newsletterBody: '', missionHeading: '', missionBody: '', socialTwitter: '', socialLinkedin: '', socialGithub: '' };
}
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const d = loadStatic();
  if(d) { const r = d.articles.find((x: any)=> x.slug===slug); return r ? toArticle(r) : null; }
  return null;
}
export async function getArticles(): Promise<Article[]> {
  const d = loadStatic();
  if(d) return d.articles.map(toArticle);
  return [];
}
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
// Re-export others as needed
export async function getLatestArticles(count=10){ const a=await getPublishedArticles(); return a.slice(0,count); }
export async function getRelatedArticles(article: Article, count=3){
  const all=await getPublishedArticles();
  const tagSet=new Set((article.tags??[]).map(t=>t.toLowerCase()));
  const scored=all.filter(a=>a.id!==article.id).map(a=>{
    const shared=(a.tags??[]).filter(t=>tagSet.has(t.toLowerCase())).length;
    const same=a.categorySlug===article.categorySlug?2:0;
    return {a,score:shared*3+same};
  }).sort((x,y)=> y.score - x.score || String(y.a.publishDate).localeCompare(String(x.a.publishDate)));
  const related=scored.filter(s=>s.score>0).map(s=>s.a);
  for(const s of scored){ if(related.length>=count) break; if(s.score===0) related.push(s.a); }
  return related.slice(0,count);
}
