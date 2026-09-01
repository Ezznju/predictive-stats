const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

async function exec(sql) {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql }),
  });
  const data = await res.json();
  if (!data.success) { console.error('FAILED:', data.errors); process.exit(1); }
  return data.result;
}

(async () => {
  await exec(`CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'site',
    subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TEXT
  )`);
  console.log('Created newsletter_subscribers');

  await exec(`CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT DEFAULT 'general',
    message TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('Created contact_messages');
})();
