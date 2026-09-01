/**
 * Export Supabase -> JSON for D1/static fallback (free, no egress after)
 * Run when Supabase is up (after Sep 8) or via Dashboard SQL:
 *   npx tsx scripts/export-supabase-to-json.ts
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dump(table: string){
  const { data, error } = await supabase.from(table).select('*');
  if(error) throw new Error(`${table}: ${error.message}`);
  return data;
}

async function main(){
  const tables = ['articles','authors','categories','site_settings'];
  const out: Record<string, any> = {};
  for(const t of tables){
    console.log(`Dumping ${t}...`);
    out[t] = await dump(t);
    console.log(`${t}: ${out[t].length} rows`);
  }
  fs.mkdirSync('data', { recursive: true });
  fs.writeFileSync('data/db.json', JSON.stringify(out, null, 2));
  console.log('Wrote data/db.json');
  // Also split for easier D1 import
  for(const t of tables){
    fs.writeFileSync(`data/${t}.json`, JSON.stringify(out[t], null, 2));
  }
  console.log('Done. Commit data/*.json and lib/d1.ts will read from it when Supabase is down.');
}
main().catch(e=>{console.error(e); process.exit(1)});
