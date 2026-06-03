"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CarFront,
  Users,
  ListFilter,
  FileText,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Codepen,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { logLogout } from "@/lib/audit-logger";

export default function Sidebar({
  role,
  userEmail,
}: {
  role: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpsOpen, setIsOpsOpen] = useState(
    pathname.startsWith("/operations") || pathname.startsWith("/admin"),
  );

  const handleLogout = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await logLogout(user.id, user.email || userEmail);
    }
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const dashboardItems = [
    {
      title: "Analytics Dashboard",
      href: "/analytics",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      title: "Sales Form",
      href: "/sales",
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const opsItems = [
    {
      title: "Companies",
      href: "/operations/companies",
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Cars Catalog",
      href: "/operations/cars",
      icon: <CarFront className="w-4 h-4" />,
    },
    {
      title: "Quote Rules",
      href: "/operations/quotes",
      icon: <ListFilter className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-card/50 backdrop-blur-md border-r border-border flex flex-col transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/50">
            <Codepen className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-xl font-bold font-syne tracking-tight text-foreground">
            Sky Insurance
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {/* DASHBOARDS section */}
        <div className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1 px-2 pt-2">
          Dashboards
        </div>

        {dashboardItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative",
                isActive
                  ? "bg-teal-500/10 text-teal-500"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-md" />
              )}
              {item.icon}
              {item.title}
            </Link>
          );
        })}

        {/* Operations collapsible (Only for Operation & Super Admin role) */}
        {["operation", "super_admin"].includes(role) && (
          <div className="mt-2">
            <button
              onClick={() => setIsOpsOpen((o) => !o)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isOpsOpen || pathname.startsWith("/operations")
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                Operations
              </div>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpsOpen ? "rotate-180" : "",
                )}
              />
            </button>

            {isOpsOpen && (
              <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-border pl-3">
                {opsItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/operations" &&
                      pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all relative",
                        isActive
                          ? "bg-teal-500/10 text-teal-500"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-teal-500 rounded-r-md" />
                      )}
                      {item.icon}
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Super Admin Links */}
        {role === "super_admin" && (
          <div className="mt-2 text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1 px-2 pt-2 border-t border-border">
            Admin
          </div>
        )}
        {role === "super_admin" && (
          <>
            <Link
              href="/admin/users"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative mt-1",
                pathname === "/admin/users"
                  ? "bg-teal-500/10 text-teal-500"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {pathname === "/admin/users" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-md" />
              )}
              <Users className="w-4 h-4" />
              User Management
            </Link>

            <Link
              href="/admin/audit-logs"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative mt-1",
                pathname === "/admin/audit-logs"
                  ? "bg-teal-500/10 text-teal-500"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {pathname === "/admin/audit-logs" && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-500 rounded-r-md" />
              )}
              <FileText className="w-4 h-4" />
              Audit Logs
            </Link>
          </>
        )}
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm shrink-0 uppercase">
              {userEmail.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userEmail.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate capitalize">
                {role === "operation"
                  ? "Operations Manager"
                  : role === "super_admin"
                    ? "Super Admin"
                    : "Sales Agent"}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-500 p-1.5 transition-colors"
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
