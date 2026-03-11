import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role || "sales";
  const userEmail = user?.email || "Unknown User";

  return (
    <div className="flex h-screen bg-background">
      <Sidebar role={role} userEmail={userEmail} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar role={role} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background/50 bg-[url('/noise.svg')] bg-repeat opacity-95">
          {children}
        </main>
      </div>
    </div>
  );
}
