-- ============================================================
-- Audit Logs Auto-Pruning Trigger & Clear RPC
-- ============================================================

-- Function to prune logs older than 1 month
create or replace function public.prune_old_audit_logs() returns trigger as $$
begin
  delete from public.audit_logs where created_at < now() - interval '1 month';
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to run pruning on every new insert
drop trigger if exists prune_audit_logs_trigger on public.audit_logs;
create trigger prune_audit_logs_trigger
  after insert on public.audit_logs
  for each statement
  execute function public.prune_old_audit_logs();

-- RPC to manually clear all logs
create or replace function public.clear_all_audit_logs() returns void as $$
begin
  -- Supabase safeupdate requires a WHERE clause for DELETEs
  delete from public.audit_logs where true;
end;
$$ language plpgsql security definer;
