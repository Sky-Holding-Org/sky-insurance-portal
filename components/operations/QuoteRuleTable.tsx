"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Edit2,
  Trash2,
  Plus,
  Filter,
  Search,
  FileText,
  ListFilter,
} from "lucide-react";
import type { QuoteRule } from "@/lib/quote-engine";
import { formatEGP } from "@/lib/quote-engine";
import { cn } from "@/lib/utils";
import { QuoteRuleFormSheet } from "./QuoteRuleFormSheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { motion } from "framer-motion";
export function QuoteRuleTable() {
  const [rules, setRules] = useState<QuoteRule[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"alphabet" | "recent">("alphabet");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<QuoteRule | undefined>(
    undefined,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("quote_rules")
      .select(
        `
        *,
        insurance_companies ( id, name )
      `,
      )
      .order("created_at", { ascending: false });

    if (data) {
      const normalized = data.map((r) => ({
        id: r.id,
        companyId: r.insurance_companies.id,
        companyName: r.insurance_companies.name,
        policyType: r.policy_type,
        fuelType: r.fuel_type,
        carCondition: r.car_condition,
        chineseTier: r.chinese_tier,
        priceMin: r.price_min,
        priceMax: r.price_max,
        ageMinYears: r.age_min_years ?? 0,
        ageMaxYears: r.age_max_years,
        maxCarAgeYears: r.max_car_age_years,
        electricAgencyStatus: r.electric_agency_status,
        ratePercentage: r.rate_percentage,
        conditions: r.conditions ?? [],
        conditionsEn: r.conditions_en ?? [],
        label: r.label,
        applicableMakeIds: r.applicable_make_ids,
        excludedMakeIds: r.excluded_make_ids,
        is_active: r.is_active, // Note: extending type locally for the table
      }));

      if (sortBy === "alphabet") {
        normalized.sort((a, b) => a.companyName.localeCompare(b.companyName));
      } else {
        // already sorted descending by created_at in the DB query
      }

      setRules(normalized as any);
    }

    // Explicitly fetch all active companies to populate the form correctly
    const { data: companiesData } = await supabase
      .from("insurance_companies")
      .select("id, name")
      .order("name", { ascending: true });

    if (companiesData) {
      setCompanies(companiesData);
    }

    // Fetch makes to map IDs to names
    const { data: makesData } = await supabase
      .from("car_makes")
      .select("id, name");

    if (makesData) {
      setMakes(makesData);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, [sortBy]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("quote_rules")
      .delete()
      .eq("id", deletingId);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== deletingId));
      fetchRules();
    }
    setDeletingId(null);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("quote_rules")
      .delete()
      .in("id", selectedIds);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      setSelectedIds([]);
      setIsDeletingBulk(false);
      fetchRules();
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map((f) => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    }
  };

  const toggleActiveStatus = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update
    setRules(
      (prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, is_active: !currentStatus } : r,
        ) as any,
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("quote_rules")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      alert("Failed to update status: " + error.message);
      // Revert optimistic update
      setRules(
        (prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, is_active: currentStatus } : r,
          ) as any,
      );
    }
  };

  const filtered = rules.filter(
    (r) =>
      r.companyName.toLowerCase().includes(search.toLowerCase()) ||
      r.label?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <h3 className="font-syne font-semibold text-white">
            Pricing Rules
            <span className="text-teal-400 bg-teal-500/10 px-2 py-1 rounded text-sm ml-2 font-ibm-mono font-medium">
              {rules.length} Total
            </span>
          </h3>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search companies or labels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 h-[38px] text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
            />
          </div>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-40 bg-slate-950 border-slate-800 text-slate-300 h-[38px] hover:bg-slate-900 transition-colors focus:ring-1 focus:ring-teal-500">
              <div className="flex items-center gap-2 text-sm">
                <ListFilter className="w-4 h-4 text-teal-500" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem
                value="alphabet"
                className="cursor-pointer focus:bg-slate-800 focus:text-white"
              >
                Alphabetical
              </SelectItem>
              <SelectItem
                value="recent"
                className="cursor-pointer focus:bg-slate-800 focus:text-white"
              >
                Last Added
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsDeletingBulk(true)}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedIds.length})
            </button>
          )}
          <button
            onClick={() => {
              setEditingRule(undefined);
              setIsFormOpen(true);
            }}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-auto bg-slate-950/20">
        <Table className="w-full text-left text-sm text-slate-300">
          <TableHeader className="bg-slate-900 sticky top-0 border-b border-slate-800 text-xs uppercase font-medium text-slate-400 z-10 shadow-sm">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="w-12 px-6 py-4 h-auto">
                <Checkbox
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === filtered.length
                  }
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Company & Policy
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Fuel Type
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Included Makes
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Price Range
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Insurance Year
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Rate %
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Est. Premium*
              </TableHead>

              <TableHead className="px-6 py-4 whitespace-nowrap h-auto">
                Status
              </TableHead>
              <TableHead className="px-6 py-4 whitespace-nowrap text-right h-auto">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-800/50">
            {isLoading ? (
              <TableRow className="hover:bg-transparent border-b-0">
                <TableCell colSpan={10} className="p-0">
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={10} className="px-6 py-16">
                  {search ? (
                    <Empty>
                      <EmptyMedia>
                        <Search className="w-5 h-5 text-slate-600" />
                      </EmptyMedia>
                      <EmptyTitle>No rules matching "{search}"</EmptyTitle>
                    </Empty>
                  ) : (
                    <Empty>
                      <EmptyMedia>
                        <FileText className="w-5 h-5 text-slate-600" />
                      </EmptyMedia>
                      <EmptyTitle>No quote rules</EmptyTitle>
                      <EmptyDescription>
                        Create your first pricing rule to start calculating
                        quotes
                      </EmptyDescription>
                    </Empty>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rule, index) => {
                const estPremium = Math.round(
                  (1000000 * rule.ratePercentage) / 100,
                );

                // Map makes
                const makesIncluded =
                  rule.applicableMakeIds && rule.applicableMakeIds.length > 0
                    ? rule.applicableMakeIds
                        .slice(0, 2)
                        .map(
                          (id: string) =>
                            makes.find((m) => m.id === id)?.name || "Unknown",
                        )
                        .join(", ") +
                      (rule.applicableMakeIds.length > 2
                        ? ` + ${rule.applicableMakeIds.length - 2} more`
                        : "")
                    : "All Makes";

                const makesExcluded =
                  rule.excludedMakeIds && rule.excludedMakeIds.length > 0
                    ? rule.excludedMakeIds
                        .slice(0, 2)
                        .map(
                          (id: string) =>
                            makes.find((m) => m.id === id)?.name || "Unknown",
                        )
                        .join(", ") +
                      (rule.excludedMakeIds.length > 2
                        ? ` + ${rule.excludedMakeIds.length - 2} more`
                        : "")
                    : null;

                return (
                  <motion.tr
                    key={rule.id}
                    className={cn(
                      "hover:bg-slate-800/30 transition-all duration-200 group border-b-0 cursor-default",
                      !rule.is_active && "opacity-50 grayscale",
                    )}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <TableCell className="px-6 py-5">
                      <Checkbox
                        checked={selectedIds.includes(rule.id)}
                        onCheckedChange={(c) => handleSelectOne(!!c, rule.id)}
                        aria-label={`Select rule for ${rule.companyName}`}
                      />
                    </TableCell>
                    <TableCell className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">
                          {rule.companyName}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded capitalize",
                              rule.policyType === "gold"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700",
                            )}
                          >
                            {rule.policyType}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="capitalize text-slate-300">
                            {rule.fuelType}
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-slate-300">{makesIncluded}</span>
                        {makesExcluded && (
                          <span className="text-red-400 font-medium whitespace-normal">
                            Excludes: {makesExcluded}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5 font-ibm-mono text-xs">
                      <div className="flex flex-col text-slate-400">
                        <span>
                          Min:{" "}
                          {formatEGP(rule.priceMin).replace("EGP", "").trim()}
                        </span>
                        <span>
                          Max:{" "}
                          {rule.priceMax
                            ? formatEGP(rule.priceMax).replace("EGP", "").trim()
                            : "Unlimited"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5 text-xs text-slate-400">
                      <div>
                        Age: {rule.ageMinYears} - {rule.ageMaxYears || "Max"}{" "}
                        yrs
                      </div>
                      {rule.maxCarAgeYears && (
                        <div className="text-red-400/80 mt-0.5">
                          Cutoff: &gt; {rule.maxCarAgeYears} yrs
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="px-6 py-5 text-right">
                      <span className="font-ibm-mono font-bold text-teal-400 text-base">
                        {rule.ratePercentage.toFixed(2)}%
                      </span>
                    </TableCell>

                    <TableCell className="px-6 py-5 text-right font-ibm-mono text-slate-300">
                      {formatEGP(estPremium)}
                    </TableCell>

                    <TableCell className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider",
                            (rule as any).is_active
                              ? "text-teal-500/80"
                              : "text-slate-500",
                          )}
                        >
                          {(rule as any).is_active ? "Active" : "Off"}
                        </span>
                        <Switch
                          checked={(rule as any).is_active}
                          onCheckedChange={() =>
                            toggleActiveStatus(rule.id, (rule as any).is_active)
                          }
                          aria-label="Toggle rule activation"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                          aria-label={`Edit rule for ${rule.companyName}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(rule.id)}
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded transition-colors"
                          aria-label={`Delete rule for ${rule.companyName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="p-3 border-t border-border bg-slate-900/50 text-xs text-slate-500 text-center shrink-0">
        Total number of rules: {rules.length}
      </div>

      {isFormOpen && (
        <QuoteRuleFormSheet
          rule={editingRule}
          companies={companies}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchRules();
          }}
        />
      )}

      <AlertDialog
        open={!!deletingId || isDeletingBulk}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingId(null);
            setIsDeletingBulk(false);
          }
        }}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete{" "}
              {isDeletingBulk
                ? "the selected pricing rules"
                : "this pricing rule"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={isDeletingBulk ? confirmBulkDelete : confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete {isDeletingBulk ? "Selected" : "Rule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
