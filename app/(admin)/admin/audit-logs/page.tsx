import { createServerClient } from "@/lib/supabase/server";
import AuditLogTable from "@/components/admin/AuditLogTable";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const supabase = await createServerClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-syne font-bold text-white">Audit Logs</h1>
        <p className="text-sm text-slate-400 mt-1">
          Full history of user actions, logins, and system events.
        </p>
      </div>
      <AuditLogTable logs={logs || []} />
    </div>
  );
}
