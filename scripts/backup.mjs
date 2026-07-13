// Dumps every table to a timestamped JSON file in backups/.
// Usage: npm run backup
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)])
);

const TABLES = [
  "assets",
  "asset_snapshots",
  "categories",
  "transactions",
  "recurring_transactions",
  "investments",
  "goals",
];

const headers = {
  apikey: env.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
};

const dump = { exported_at: new Date().toISOString(), tables: {} };

for (const table of TABLES) {
  const rows = [];
  // Page through in chunks so large histories don't get truncated.
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(
      `${env.SUPABASE_URL}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`,
      { headers }
    );
    if (!res.ok) throw new Error(`${table}: HTTP ${res.status} ${await res.text()}`);
    const chunk = await res.json();
    rows.push(...chunk);
    if (chunk.length < 1000) break;
  }
  dump.tables[table] = rows;
  console.log(`${table}: ${rows.length} rows`);
}

const dir = fileURLToPath(new URL("../backups", import.meta.url));
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
const file = join(dir, `backup-${stamp}.json`);
writeFileSync(file, JSON.stringify(dump, null, 2));
console.log(`\nSaved ${file}`);
