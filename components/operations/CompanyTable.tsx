"use client";
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, Building2 } from "lucide-react";
import { CompanyFormSheet } from "./CompanyFormSheet";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { motion } from "framer-motion";

type Company = {
  id: string;
  name: string;
  name_ar: string;
  is_active: boolean;
};

export function CompanyTable() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | undefined>(
    undefined,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCompanies = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("insurance_companies")
      .select("*")
      .order("name");
    if (data) setCompanies(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const toggleActive = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase
      .from("insurance_companies")
      .update({ is_active: !current })
      .eq("id", id);
    fetchCompanies();
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("insurance_companies")
      .delete()
      .eq("id", deletingId);
    if (error) {
      alert("Failed to delete processing: " + error.message);
    } else {
      fetchCompanies();
    }
    setDeletingId(null);
  };

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.name_ar?.includes(search),
  );

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Search Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-slate-900/50">
        <div className="flex items-center gap-4">
          <h3 className="font-syne font-semibold text-white">
            Companies
            <span className="text-teal-400 bg-teal-500/10 px-2 py-1 rounded text-sm ml-2 font-ibm-mono font-medium">
              {companies.length} Total
            </span>
          </h3>
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 h-[38px] text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditingCompany(undefined);
            setIsFormOpen(true);
          }}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Table Content */}
      <div className="relative flex-1 overflow-auto bg-slate-950/20">
        <Table className="w-full text-left text-sm text-slate-300">
          <TableHeader className="bg-slate-900 sticky top-0 border-b border-slate-800 text-xs uppercase font-medium text-slate-400 z-10 shadow-sm">
            <TableRow className="border-b-0 hover:bg-transparent">
              <TableHead className="px-6 py-4 h-auto">Company Name</TableHead>
              <TableHead className="px-6 py-4 h-auto">Arabic Name</TableHead>
              <TableHead className="px-6 py-4 h-auto">Status</TableHead>
              <TableHead className="px-6 py-4 text-right h-auto">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-800/50">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <TableRow
                  key={i}
                  className="animate-pulse border-b-0 hover:bg-transparent"
                >
                  <TableCell className="px-6 py-5">
                    <div className="h-4 bg-slate-800/60 rounded w-32"></div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="h-4 bg-slate-800/60 rounded w-24"></div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="h-5 bg-slate-800/60 rounded-full w-10"></div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <div className="h-4 bg-slate-800/60 rounded w-16 ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableCell colSpan={4} className="px-6 py-16">
                  {search ? (
                    <Empty>
                      <EmptyMedia>
                        <Search className="w-5 h-5 text-slate-600" />
                      </EmptyMedia>
                      <EmptyTitle>
                        No companies found matching "{search}"
                      </EmptyTitle>
                    </Empty>
                  ) : (
                    <Empty>
                      <EmptyMedia>
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </EmptyMedia>
                      <EmptyTitle>No companies yet</EmptyTitle>
                      <EmptyDescription>
                        Add your first insurance company to get started
                      </EmptyDescription>
                    </Empty>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((company, index) => (
                <motion.tr
                  key={company.id}
                  className="hover:bg-slate-800/30 transition-all duration-200 group border-b-0 cursor-default"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <TableCell className="px-6 py-5 font-medium text-slate-200">
                    {company.name}
                  </TableCell>
                  <TableCell className="px-6 py-5 font-sans" dir="rtl">
                    {company.name_ar}
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Switch
                      checked={company.is_active}
                      onCheckedChange={() =>
                        toggleActive(company.id, company.is_active)
                      }
                      className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-slate-700"
                    />
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingCompany(company);
                          setIsFormOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        aria-label={`Edit company ${company.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(company.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        aria-label={`Delete company ${company.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {isFormOpen && (
        <CompanyFormSheet
          company={editingCompany}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchCompanies();
          }}
        />
      )}

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete this
              company and remove all its quote rules.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete Company
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
