#!/usr/bin/env bun
/**
 * Runs the DB migrations against the Supabase project using the Management API.
 * Usage: bun run scripts/migrate.ts
 */
import { readFileSync } from "fs";
import { join } from "path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !ANON_KEY) {
  console.error("Missing SUPABASE_URL or ANON_KEY environment variables.");
  process.exit(1);
}

const migrations = [
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_seed_data.sql",
  "supabase/migrations/003_add_excluded_makes.sql",
];

async function runSQL(sql: string, label: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`❌ [${label}] HTTP ${res.status}:`, errorBody);
    return false;
  }
  console.log(`✅ [${label}] Success`);
  return true;
}

async function main() {
  const cwd = process.cwd();
  for (const migration of migrations) {
    const sql = readFileSync(join(cwd, migration), "utf-8");
    const ok = await runSQL(sql, migration);
    if (!ok) {
      console.error("Migration failed, skipping further migrations.");
      break;
    }
  }
}

main();
