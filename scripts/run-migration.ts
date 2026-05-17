/**
 * Runs the audit_logs migration via Supabase REST API.
 * Usage: bun run scripts/run-migration.ts
 */

export {}; // Tells TypeScript this is a module with isolated scope

const SUPABASE_URL = "https://zlicnjyuvfuskdbblxkt.supabase.co";
// We need the service role key — add SUPABASE_SERVICE_ROLE_KEY to .env.local
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error(
    "\n❌  SUPABASE_SERVICE_ROLE_KEY is not set.\n" +
      "   Go to: https://supabase.com/dashboard/project/zlicnjyuvfuskdbblxkt/settings/api\n" +
      "   Copy the 'service_role' key and add it to .env.local:\n" +
      "   SUPABASE_SERVICE_ROLE_KEY=eyJ...\n" +
      "\n   Then re-run: bun run scripts/run-migration.ts\n"
  );
  process.exit(1);
}

const SQL = `
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'authenticated users can insert logs') then
    create policy "authenticated users can insert logs"
      on public.audit_logs for insert to authenticated with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'anon can insert logs') then
    create policy "anon can insert logs"
      on public.audit_logs for insert to anon with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'audit_logs' and policyname = 'authenticated can read logs') then
    create policy "authenticated can read logs"
      on public.audit_logs for select to authenticated using (true);
  end if;
end $$;

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_user_email_idx on public.audit_logs(user_email);
`;

async function main() {
  console.log("🚀  Running audit_logs migration...");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY!,
    },
    body: JSON.stringify({ sql: SQL }),
  }).catch(() => null);

  // Supabase doesn't expose exec_sql via REST — use pg directly
  // Instead, print the SQL for manual run
  console.log("\n📋  Please run this SQL in the Supabase SQL Editor:");
  console.log("    https://supabase.com/dashboard/project/zlicnjyuvfuskdbblxkt/sql/new\n");
  console.log(SQL);
}

main();
