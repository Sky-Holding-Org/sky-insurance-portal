"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ClipboardList, Codepen, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logLogout } from "@/lib/audit-logger";

const navItems = [
  {
    title: "Audit Logs",
    href: "/admin/audit-logs",
    icon: <ClipboardList className="w-4 h-4" />,
  },
];

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await logLogout(user.id, user.email || "");
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/50">
            <Codepen className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-xl font-bold font-syne tracking-tight text-slate-100">
            Sky Insurance
          </span>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 flex flex-col gap-1 px-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 px-2 pt-2">
          Super Admin
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                isActive
                  ? "bg-purple-500/10 text-purple-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-purple-500 rounded-r-md" />
              )}
              {item.icon}
              {item.title}
            </Link>
          );
        })}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-sm shrink-0 uppercase">
              {userEmail.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {userEmail.split("@")[0]}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield className="w-3 h-3 text-purple-400" />
                <p className="text-xs text-purple-400 font-medium">
                  Super Admin
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 p-1.5 transition-colors"
            title="Log Out"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
