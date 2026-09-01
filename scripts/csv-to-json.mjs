import fs from 'fs';
import { parse } from 'csv-parse/sync';

function csvToJson(file){
  const content = fs.readFileSync(file, 'utf8');
  const records = parse(content, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true });
  return records;
}

const articles = csvToJson('data/articles.csv');
const authors = csvToJson('data/authors.csv');
const categories = csvToJson('data/categories.csv');
const site_settings = csvToJson('data/site_settings.csv');

console.log(`articles: ${articles.length}, authors: ${authors.length}, categories: ${categories.length}, site_settings: ${site_settings.length}`);

// Convert tags from string "[\"a\",\"b\"]" to array if needed - keep as string for D1, but lib/d1 handles both
const out = { articles, authors, categories, site_settings };
fs.writeFileSync('data/db.json', JSON.stringify(out, null, 2));
console.log('Wrote data/db.json', (fs.statSync('data/db.json').size/1024).toFixed(1)+'KB');

// Verify
const sample = articles[0];
console.log('Sample article', sample.slug, sample.featured_image?.slice(0,60));
