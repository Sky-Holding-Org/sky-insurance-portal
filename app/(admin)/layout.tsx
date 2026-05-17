import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user?.user_metadata?.role;

  if (role !== "super_admin") {
    redirect("/login");
  }

  const userEmail = user?.email || "Unknown User";

  return (
    <div className="flex h-screen bg-slate-950">
      <AdminSidebar userEmail={userEmail} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0 shadow-sm shadow-black/10">
          <span className="text-sm text-slate-400 font-medium">
            Super Admin Console
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Super Admin
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
