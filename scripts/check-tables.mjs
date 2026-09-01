const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}`;

(async () => {
  const res = await fetch(`${BASE}/raw`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql: `SELECT name FROM sqlite_master WHERE type='table'` }),
  });
  const data = await res.json();
  const rows = data.result[0].results.rows;
  for (const row of rows) {
    console.log(row[0]);
  }
})();
