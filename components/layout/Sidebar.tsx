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
    pathname.startsWith("/operations"),
  );

  const handleLogout = async () => {
    const supabase = createClient();
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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/50">
            <Codepen className="w-4 h-4" />
          </div>
          <span className="text-xl font-bold font-syne tracking-tight text-slate-100">
            Sky Insurance
          </span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto">
        {/* DASHBOARDS section */}
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 px-2 pt-2">
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
                  ? "bg-teal-500/10 text-teal-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
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

        {/* Operations collapsible (Only for Operation role) */}
        {role === "operation" && (
          <div className="mt-2">
            <button
              onClick={() => setIsOpsOpen((o) => !o)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isOpsOpen || pathname.startsWith("/operations")
                  ? "text-slate-200"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
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
              <div className="mt-1 ml-3 flex flex-col gap-1 border-l border-slate-800 pl-3">
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
                          ? "bg-teal-500/10 text-teal-400"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
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
      </div>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm shrink-0 uppercase">
              {userEmail.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {userEmail.split("@")[0]}
              </p>
              <p className="text-xs text-slate-500 truncate capitalize">
                {role === "operation" ? "Operations Manager" : "Sales Agent"}
              </p>
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
