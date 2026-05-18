import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
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
