import fs from 'fs';
import { parse } from 'csv-parse/sync';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

function readCSV(file) {
  const content = fs.readFileSync(file, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
}

async function batchSQL(statements) {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch: statements }),
  });
  const data = await res.json();
  if (!data.success) {
    console.error('BATCH FAILED:', JSON.stringify(data.errors, null, 2));
    process.exit(1);
  }
  return data.result;
}

(async () => {
  const authors = readCSV('data/authors.csv');
  console.log(`Seeding ${authors.length} authors...`);
  await batchSQL(authors.map(a => ({
    sql: `INSERT OR REPLACE INTO authors (id, name, slug, bio, title, avatar, twitter, linkedin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [a.id, a.name, a.slug, a.bio || '', a.title || '', a.avatar || '', a.twitter || null, a.linkedin || null],
  })));
  console.log('Authors seeded.');

  const categories = readCSV('data/categories.csv');
  console.log(`Seeding ${categories.length} categories...`);
  await batchSQL(categories.map(c => ({
    sql: `INSERT OR REPLACE INTO categories (id, name, slug, description, color) VALUES (?, ?, ?, ?, ?)`,
    params: [c.id, c.name, c.slug, c.description || '', c.color || '#000000'],
  })));
  console.log('Categories seeded.');

  const settings = readCSV('data/site_settings.csv');
  console.log(`Seeding ${settings.length} settings rows...`);
  await batchSQL(settings.map(s => ({
    sql: `INSERT OR REPLACE INTO site_settings (id, site_name, site_tagline, site_description, site_url, newsletter_heading, newsletter_body, mission_heading, mission_body, social_twitter, social_linkedin, social_github) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    params: [s.site_name, s.site_tagline, s.site_description, s.site_url, s.newsletter_heading, s.newsletter_body, s.mission_heading, s.mission_body, s.social_twitter, s.social_linkedin, s.social_github],
  })));
  console.log('Settings seeded.');

  const articles = readCSV('data/articles.csv');
  console.log(`Seeding ${articles.length} articles...`);
  const BATCH_SIZE = 20;
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    const batch = articles.slice(i, i + BATCH_SIZE);
    await batchSQL(batch.map(a => {
      let tags = a.tags || '[]';
      if (typeof tags === 'string') { try { JSON.parse(tags); } catch { tags = '[]'; } }
      const featured = (a.featured === 'true' || a.featured === '1') ? 1 : 0;
      const readTime = parseInt(a.read_time) || 5;
      const updatedDate = (a.updated_date === 'null' || !a.updated_date) ? null : a.updated_date;
      const pullQuote = (a.pull_quote === 'null' || !a.pull_quote) ? null : a.pull_quote;
      const seoTitle = (a.seo_title === 'null' || !a.seo_title) ? null : a.seo_title;
      const metaDesc = (a.meta_description === 'null' || !a.meta_description) ? null : a.meta_description;
      return {
        sql: `INSERT OR REPLACE INTO articles (id, title, slug, excerpt, content, featured_image, author_id, category_slug, tags, publish_date, updated_date, read_time, featured, status, seo_title, meta_description, pull_quote) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: [a.id, a.title, a.slug, a.excerpt || '', a.content || '', a.featured_image || '', a.author_id || null, a.category_slug || null, tags, a.publish_date || null, updatedDate, readTime, featured, a.status || 'draft', seoTitle, metaDesc, pullQuote],
      };
    }));
    process.stdout.write(`  ${Math.min(i + BATCH_SIZE, articles.length)}/${articles.length}\r`);
  }
  console.log('\nArticles seeded.');
})();
