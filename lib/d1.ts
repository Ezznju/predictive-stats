import { Article, Author, Category, SiteSettings } from '@/types';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const DATABASE_ID = process.env.D1_DATABASE_ID!;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function d1Query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    console.error('D1 query failed:', data.errors);
    return [];
  }
  const result = data.result;
  if (Array.isArray(result) && result[0]?.results?.rows) {
    const cols: string[] = result[0].results.columns || [];
    return result[0].results.rows.map((row: any[]) => {
      const obj: any = {};
      cols.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }
  return [];
}

async function d1Execute(sql: string, params?: any[]): Promise<{ changes: number; last_row_id: number }> {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    console.error('D1 execute failed:', data.errors);
    return { changes: 0, last_row_id: 0 };
  }
  const meta = data.result?.meta || {};
  return { changes: meta.changes || 0, last_row_id: meta.last_row_id || 0 };
}

// ─── Mappers ────────────────────────────────────────────────────────

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
    readTime: Number(row.read_time) || 5,
    featured: row.featured === 1 || row.featured === true,
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

// ─── Query Functions ────────────────────────────────────────────────

export async function getPublishedArticles(): Promise<Article[]> {
  const rows = await d1Query(
    `SELECT * FROM articles WHERE status = 'published' ORDER BY publish_date DESC`
  );
  return rows.map(toArticle);
}

export async function getFeaturedArticles(): Promise<Article[]> {
  const rows = await d1Query(
    `SELECT * FROM articles WHERE featured = 1 AND status = 'published' ORDER BY publish_date DESC`
  );
  return rows.map(toArticle);
}

export async function getArticles(): Promise<Article[]> {
  const rows = await d1Query(`SELECT * FROM articles ORDER BY publish_date DESC`);
  return rows.map(toArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const rows = await d1Query(`SELECT * FROM articles WHERE slug = ? LIMIT 1`, [slug]);
  return rows.length > 0 ? toArticle(rows[0]) : null;
}

export async function getArticleById(id: string): Promise<Article | null> {
  const rows = await d1Query(`SELECT * FROM articles WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0 ? toArticle(rows[0]) : null;
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
  const rows = await d1Query(
    `SELECT * FROM articles WHERE category_slug = ? AND status = 'published' ORDER BY publish_date DESC`,
    [categorySlug]
  );
  return rows.map(toArticle);
}

export async function getArticlesByAuthor(authorId: string): Promise<Article[]> {
  const rows = await d1Query(
    `SELECT * FROM articles WHERE author_id = ? AND status = 'published' ORDER BY publish_date DESC`,
    [authorId]
  );
  return rows.map(toArticle);
}

export async function getAuthors(): Promise<Author[]> {
  const rows = await d1Query(`SELECT * FROM authors ORDER BY name`);
  return rows.map(toAuthor);
}

export async function getAuthorById(id: string): Promise<Author | null> {
  const rows = await d1Query(`SELECT * FROM authors WHERE id = ? LIMIT 1`, [id]);
  return rows.length > 0 ? toAuthor(rows[0]) : null;
}

export async function getAuthorBySlug(slug: string): Promise<Author | null> {
  const rows = await d1Query(`SELECT * FROM authors WHERE slug = ? LIMIT 1`, [slug]);
  return rows.length > 0 ? toAuthor(rows[0]) : null;
}

export async function getCategories(): Promise<Category[]> {
  const rows = await d1Query(`SELECT * FROM categories ORDER BY name`);
  return rows.map(toCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const rows = await d1Query(`SELECT * FROM categories WHERE slug = ? LIMIT 1`, [slug]);
  return rows.length > 0 ? toCategory(rows[0]) : null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const rows = await d1Query(`SELECT * FROM site_settings WHERE id = 1 LIMIT 1`);
  return rows.length > 0 ? toSettings(rows[0]) : {
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
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export async function getLatestArticles(count = 10): Promise<Article[]> {
  const rows = await d1Query(
    `SELECT * FROM articles WHERE status = 'published' ORDER BY publish_date DESC LIMIT ?`,
    [count]
  );
  return rows.map(toArticle);
}

export async function getRelatedArticles(article: Article, count = 3): Promise<Article[]> {
  const tagConditions = (article.tags ?? []).map(() => `tags LIKE ?`).join(' OR ');
  const params: any[] = [];
  const tagLikes: string[] = [];
  for (const tag of (article.tags ?? [])) {
    tagLikes.push(`%${tag}%`);
    params.push(`%${tag}%`);
  }

  let rows: any[];
  if (tagConditions) {
    rows = await d1Query(
      `SELECT * FROM articles
       WHERE id != ? AND status = 'published'
       AND (${tagConditions} OR category_slug = ?)
       ORDER BY publish_date DESC
       LIMIT ?`,
      [article.id, ...tagLikes, article.categorySlug, count * 3]
    );
  } else {
    rows = await d1Query(
      `SELECT * FROM articles
       WHERE id != ? AND status = 'published' AND category_slug = ?
       ORDER BY publish_date DESC
       LIMIT ?`,
      [article.id, article.categorySlug, count * 3]
    );
  }

  // Score and rank
  const tagSet = new Set((article.tags ?? []).map(t => t.toLowerCase()));
  const scored = rows.map(r => {
    const a = toArticle(r);
    const shared = (a.tags ?? []).filter(t => tagSet.has(t.toLowerCase())).length;
    const same = a.categorySlug === article.categorySlug ? 2 : 0;
    return { a, score: shared * 3 + same };
  }).sort((x, y) => y.score - x.score || String(y.a.publishDate).localeCompare(String(x.a.publishDate)));

  const related = scored.filter(s => s.score > 0).map(s => s.a);
  for (const s of scored) {
    if (related.length >= count) break;
    if (s.score === 0 && !related.find(r => r.id === s.a.id)) related.push(s.a);
  }
  return related.slice(0, count);
}

// ─── Write Functions (for admin API routes) ─────────────────────────

export async function insertArticle(row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(k => row[k] === undefined ? null : row[k]);
  await d1Execute(
    `INSERT INTO articles (${cols.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return row;
}

export async function updateArticle(id: string, row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  if (cols.length === 0) return row;
  const setClauses = cols.map(k => `${k} = ?`).join(', ');
  const values = cols.map(k => row[k]);
  values.push(id);
  await d1Execute(
    `UPDATE articles SET ${setClauses} WHERE id = ?`,
    values
  );
  return { id, ...row };
}

export async function deleteArticle(id: string): Promise<void> {
  await d1Execute(`DELETE FROM articles WHERE id = ?`, [id]);
}

export async function insertCategory(row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(k => row[k] === undefined ? null : row[k]);
  await d1Execute(
    `INSERT INTO categories (${cols.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return row;
}

export async function updateCategory(id: string, row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  if (cols.length === 0) return row;
  const setClauses = cols.map(k => `${k} = ?`).join(', ');
  const values = cols.map(k => row[k]);
  values.push(id);
  await d1Execute(
    `UPDATE categories SET ${setClauses} WHERE id = ?`,
    values
  );
  return { id, ...row };
}

export async function deleteCategory(id: string): Promise<void> {
  await d1Execute(`DELETE FROM categories WHERE id = ?`, [id]);
}

export async function insertAuthor(row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(', ');
  const values = cols.map(k => row[k] === undefined ? null : row[k]);
  await d1Execute(
    `INSERT INTO authors (${cols.join(', ')}) VALUES (${placeholders})`,
    values
  );
  return row;
}

export async function updateAuthor(id: string, row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  if (cols.length === 0) return row;
  const setClauses = cols.map(k => `${k} = ?`).join(', ');
  const values = cols.map(k => row[k]);
  values.push(id);
  await d1Execute(
    `UPDATE authors SET ${setClauses} WHERE id = ?`,
    values
  );
  return { id, ...row };
}

export async function deleteAuthor(id: string): Promise<void> {
  await d1Execute(`DELETE FROM authors WHERE id = ?`, [id]);
}

export async function countArticlesByAuthor(authorId: string): Promise<number> {
  const rows = await d1Query(`SELECT COUNT(*) as c FROM articles WHERE author_id = ?`, [authorId]);
  return rows[0]?.c ?? 0;
}

export async function countAuthors(): Promise<number> {
  const rows = await d1Query(`SELECT COUNT(*) as c FROM authors`);
  return rows[0]?.c ?? 0;
}

export async function updateSiteSettings(row: Record<string, any>): Promise<any> {
  const cols = Object.keys(row);
  if (cols.length === 0) return row;
  const setClauses = cols.map(k => `${k} = ?`).join(', ');
  const values = cols.map(k => row[k]);
  await d1Execute(
    `UPDATE site_settings SET ${setClauses} WHERE id = 1`,
    values
  );
  return row;
}

export async function searchArticles(query: string): Promise<any[]> {
  const like = `%${query}%`;
  const rows = await d1Query(
    `SELECT id, title, slug, excerpt, featured_image, author_id, category_slug, tags, publish_date, read_time, featured, status
     FROM articles
     WHERE status = 'published' AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
     ORDER BY publish_date DESC
     LIMIT 24`,
    [like, like, like]
  );
  return rows;
}

// Newsletter
export async function newsletterSubscribe(email: string, source: string, token: string): Promise<boolean> {
  try {
    await d1Execute(
      `INSERT INTO newsletter_subscribers (email, source, token) VALUES (?, ?, ?)`,
      [email, source, token]
    );
    return true;
  } catch {
    return false;
  }
}

export async function newsletterUnsubscribe(token: string): Promise<boolean> {
  const result = await d1Execute(
    `UPDATE newsletter_subscribers SET unsubscribed_at = CURRENT_TIMESTAMP WHERE token = ? AND unsubscribed_at IS NULL`,
    [token]
  );
  return result.changes > 0;
}

// Contact
export async function insertContactMessage(name: string, email: string, subject: string, message: string): Promise<void> {
  await d1Execute(
    `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
    [name, email, subject, message]
  );
}

// Outbound clicks (monetization tracking)
export async function insertOutboundClick(row: {
  platform_slug: string;
  ctx?: string | null;
  is_affiliate?: boolean;
  referer?: string | null;
  country?: string | null;
  user_agent?: string | null;
}): Promise<void> {
  await d1Execute(
    `INSERT INTO outbound_clicks (id, platform_slug, ctx, is_affiliate, referer, country, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      row.platform_slug,
      row.ctx ?? null,
      row.is_affiliate ? 1 : 0,
      row.referer ?? null,
      row.country ?? null,
      row.user_agent ?? null,
    ]
  );
}

// Analytics (replaces Supabase admin_analytics RPC)
export async function getAnalytics(days: number) {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const [totalAll, totalPeriod, affiliatePeriod, byPlatform, byDay, byCtx, byCountry, topReferers, recent, subTotal, subNew, subByDay, subBySource, subRecent, contactTotal, contactUnread] = await Promise.all([
    d1Query(`SELECT COUNT(*) as c FROM outbound_clicks`),
    d1Query(`SELECT COUNT(*) as c FROM outbound_clicks WHERE created_at >= ?`, [since]),
    d1Query(`SELECT COUNT(*) as c FROM outbound_clicks WHERE created_at >= ? AND is_affiliate = 1`, [since]),
    d1Query(`SELECT platform_slug, COUNT(*) as clicks, SUM(CASE WHEN is_affiliate=1 THEN 1 ELSE 0 END) as affiliate_clicks FROM outbound_clicks WHERE created_at >= ? GROUP BY platform_slug ORDER BY clicks DESC`, [since]),
    d1Query(`SELECT date(created_at) as day, COUNT(*) as clicks FROM outbound_clicks WHERE created_at >= ? GROUP BY day ORDER BY day`, [since]),
    d1Query(`SELECT COALESCE(ctx,'(none)') as ctx, COUNT(*) as clicks FROM outbound_clicks WHERE created_at >= ? GROUP BY ctx ORDER BY clicks DESC LIMIT 10`, [since]),
    d1Query(`SELECT COALESCE(country,'??') as country, COUNT(*) as clicks FROM outbound_clicks WHERE created_at >= ? GROUP BY country ORDER BY clicks DESC LIMIT 10`, [since]),
    d1Query(`SELECT COALESCE(referer,'(direct)') as referer, COUNT(*) as clicks FROM outbound_clicks WHERE created_at >= ? GROUP BY referer ORDER BY clicks DESC LIMIT 10`, [since]),
    d1Query(`SELECT platform_slug, ctx, is_affiliate, country, referer, created_at FROM outbound_clicks ORDER BY created_at DESC LIMIT 15`),
    d1Query(`SELECT COUNT(*) as c FROM newsletter_subscribers`),
    d1Query(`SELECT COUNT(*) as c FROM newsletter_subscribers WHERE created_at >= ?`, [since]),
    d1Query(`SELECT date(created_at) as day, COUNT(*) as signups FROM newsletter_subscribers WHERE created_at >= ? GROUP BY day ORDER BY day`, [since]),
    d1Query(`SELECT COALESCE(source,'(unknown)') as source, COUNT(*) as signups FROM newsletter_subscribers GROUP BY source ORDER BY signups DESC`),
    d1Query(`SELECT email, source, created_at FROM newsletter_subscribers ORDER BY created_at DESC LIMIT 10`),
    d1Query(`SELECT COUNT(*) as c FROM contact_messages`),
    d1Query(`SELECT COUNT(*) as c FROM contact_messages WHERE read = 0`),
  ]);
  return {
    days,
    clicks: {
      total_all_time: totalAll[0]?.c ?? 0,
      total_period: totalPeriod[0]?.c ?? 0,
      affiliate_period: affiliatePeriod[0]?.c ?? 0,
      by_platform: byPlatform.map((r: any) => ({ platform_slug: r.platform_slug, clicks: Number(r.clicks), affiliate_clicks: Number(r.affiliate_clicks) })),
      by_day: byDay.map((r: any) => ({ day: r.day, clicks: Number(r.clicks) })),
      by_ctx: byCtx.map((r: any) => ({ ctx: r.ctx, clicks: Number(r.clicks) })),
      by_country: byCountry.map((r: any) => ({ country: r.country, clicks: Number(r.clicks) })),
      top_referers: topReferers.map((r: any) => ({ referer: r.referer, clicks: Number(r.clicks) })),
      recent: recent.map((r: any) => ({ platform_slug: r.platform_slug, ctx: r.ctx, is_affiliate: !!r.is_affiliate, country: r.country, referer: r.referer, created_at: r.created_at })),
    },
    subscribers: {
      total: subTotal[0]?.c ?? 0,
      new_period: subNew[0]?.c ?? 0,
      by_day: subByDay.map((r: any) => ({ day: r.day, signups: Number(r.signups) })),
      by_source: subBySource.map((r: any) => ({ source: r.source, signups: Number(r.signups) })),
      recent: subRecent.map((r: any) => ({ email: r.email, source: r.source, created_at: r.created_at })),
    },
    contact_messages: { total: contactTotal[0]?.c ?? 0, unread: contactUnread[0]?.c ?? 0 },
  };
}

// Pulse
export async function getPulseWhaleTrades(conditionId: string) {
  return d1Query(
    `SELECT wallet_address, condition_id, side, outcome, price, usdc_size FROM pulse_whale_trades WHERE condition_id = ?`,
    [conditionId]
  );
}
