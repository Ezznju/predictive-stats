import fs from 'fs';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function execSQL(sql) {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  if (!data.success) { console.error('FAILED:', data.errors); process.exit(1); }
  return data.result;
}

const schema = fs.readFileSync('d1/schema.sql', 'utf8');
const statements = schema.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));

console.log(`Applying ${statements.length} schema statements...`);
for (const stmt of statements) {
  console.log(`  > ${stmt.slice(0, 80)}...`);
  await execSQL(stmt);
}
console.log('Schema applied successfully.');
