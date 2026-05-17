"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  LogIn,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Search,
  RefreshCcw,
  Activity,
  Shield,
  Building2,
  Car,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const ACTION_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  login: {
    label: "Logged In",
    icon: <LogIn className="w-3.5 h-3.5" />,
    color: "text-teal-400",
    bg: "bg-teal-500/10 border-teal-500/20",
  },
  logout: {
    label: "Logged Out",
    icon: <LogOut className="w-3.5 h-3.5" />,
    color: "text-slate-400",
    bg: "bg-slate-800 border-slate-700",
  },
  rule_created: {
    label: "Rule Created",
    icon: <Plus className="w-3.5 h-3.5" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  rule_updated: {
    label: "Rule Updated",
    icon: <Edit2 className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  rule_deleted: {
    label: "Rule Deleted",
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  company_created: {
    label: "Company Created",
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  company_updated: {
    label: "Company Updated",
    icon: <Building2 className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  company_deleted: {
    label: "Company Deleted",
    icon: <Trash2 className="w-3.5 h-3.5" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  car_created: {
    label: "Car Added",
    icon: <Car className="w-3.5 h-3.5" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  car_updated: {
    label: "Car Updated",
    icon: <Car className="w-3.5 h-3.5" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  car_deleted: {
    label: "Car Deleted",
    icon: <Car className="w-3.5 h-3.5" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

const FILTER_ACTIONS = [
  { label: "All", value: "all" },
  { label: "Login / Logout", value: "auth" },
  { label: "Rules", value: "rule" },
  { label: "Companies", value: "company" },
  { label: "Cars", value: "car" },
];

function getActionConfig(action: string) {
  return (
    ACTION_CONFIG[action] ?? {
      label: action.replace(/_/g, " "),
      icon: <Activity className="w-3.5 h-3.5" />,
      color: "text-slate-400",
      bg: "bg-slate-800 border-slate-700",
    }
  );
}

function MetadataCell({ metadata }: { metadata: Record<string, any> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-slate-600 italic">—</span>;
  }

  const entries = Object.entries(metadata).slice(0, 3);
  return (
    <div className="flex flex-col gap-0.5">
      {entries.map(([key, val]) => (
        <span key={key} className="text-slate-500 text-xs">
          <span className="text-slate-400">{key}:</span>{" "}
          {typeof val === "object" ? JSON.stringify(val) : String(val)}
        </span>
      ))}
      {Object.keys(metadata).length > 3 && (
        <span className="text-slate-600 text-xs">
          +{Object.keys(metadata).length - 3} more
        </span>
      )}
    </div>
  );
}

export default function AuditLogTable({ logs: initialLogs }: { logs: AuditLog[] }) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to clear all audit logs? This action cannot be undone.")) return;
    
    setIsClearing(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("clear_all_audit_logs");
    
    if (error) {
      alert("Failed to clear logs: " + error.message);
    } else {
      setLogs([]);
    }
    setIsClearing(false);
  };

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.user_email.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filterAction === "all" ||
        (filterAction === "auth" &&
          (log.action === "login" || log.action === "logout")) ||
        (filterAction !== "auth" && log.action.startsWith(filterAction));

      return matchesSearch && matchesFilter;
    });
  }, [logs, search, filterAction]);

  // Summary stats
  const stats = useMemo(() => {
    const logins = logs.filter((l) => l.action === "login").length;
    const mutations = logs.filter((l) =>
      ["created", "updated", "deleted"].some((s) => l.action.endsWith(s)),
    ).length;
    const uniqueUsers = new Set(logs.map((l) => l.user_email)).size;
    return { logins, mutations, uniqueUsers, total: logs.length };
  }, [logs]);

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total Events",
            value: stats.total,
            icon: <Activity className="w-4 h-4" />,
            color: "text-teal-400",
            bg: "bg-teal-500/10 border-teal-500/20",
          },
          {
            label: "Logins",
            value: stats.logins,
            icon: <LogIn className="w-4 h-4" />,
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            label: "Mutations",
            value: stats.mutations,
            icon: <Edit2 className="w-4 h-4" />,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: "Unique Users",
            value: stats.uniqueUsers,
            icon: <Shield className="w-4 h-4" />,
            color: "text-purple-400",
            bg: "bg-purple-500/10 border-purple-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                s.bg,
                s.color,
              )}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-xl font-bold font-ibm-mono text-white">
                {s.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by user or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 h-9"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {FILTER_ACTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterAction(f.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
                filterAction === f.value
                  ? "bg-purple-500 text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 ml-auto flex items-center gap-3">
          <span>{filtered.length} of {logs.length} events</span>
          <button
            onClick={handleClearLogs}
            disabled={isClearing || logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? <Activity className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            Clear Logs
          </button>
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-380px)]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
              <tr className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                <th className="text-left px-5 py-3 w-48">Timestamp</th>
                <th className="text-left px-5 py-3 w-52">User</th>
                <th className="text-left px-5 py-3 w-44">Action</th>
                <th className="text-left px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-16 text-slate-500 text-sm"
                  >
                    <RefreshCcw className="w-5 h-5 mx-auto mb-2 opacity-40" />
                    No audit events found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const cfg = getActionConfig(log.action);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Timestamp */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-ibm-mono text-xs text-slate-300">
                            {format(
                              new Date(log.created_at),
                              "dd MMM yyyy, HH:mm:ss",
                            )}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {formatDistanceToNow(new Date(log.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0 uppercase">
                            {log.user_email.charAt(0)}
                          </div>
                          <span className="text-slate-300 text-xs truncate max-w-[160px]">
                            {log.user_email}
                          </span>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                            cfg.bg,
                            cfg.color,
                          )}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>

                      {/* Details */}
                      <td className="px-5 py-3.5">
                        <MetadataCell metadata={log.metadata} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
