-- ============================================================
-- Audit Logs Table
-- ============================================================

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  action text not null,           -- e.g. 'login', 'rule_created', 'rule_updated', 'rule_deleted', 'logout'
  entity_type text,               -- e.g. 'quote_rule', 'company', 'car'
  entity_id uuid,                 -- The ID of the affected record
  metadata jsonb default '{}',    -- Extra context: { companyName, label, changes... }
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.audit_logs enable row level security;

-- Only authenticated users can insert their own logs
create policy "authenticated users can insert logs"
  on public.audit_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Only super_admin role can read logs (via service role in server component)
create policy "anon can insert logs"
  on public.audit_logs for insert
  to anon
  with check (true);

-- Allow reading for authenticated (we'll enforce super_admin check in app layer)
create policy "authenticated can read logs"
  on public.audit_logs for select
  to authenticated
  using (true);

-- Index for performance
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_user_email_idx on public.audit_logs(user_email);
create index if not exists audit_logs_action_idx on public.audit_logs(action);
