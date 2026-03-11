"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, ChevronRight, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CarMake } from "@/hooks/useCarMakes";
import { CarMakeFormSheet } from "./CarMakeFormSheet";
import { CarCSVUploader } from "./CarCSVUploader";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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

type CarMakeTableProps = {
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function CarMakeTable({ selectedId, onSelect }: CarMakeTableProps) {
  const [makes, setMakes] = useState<CarMake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMakes = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("car_makes").select("*").order("name");
    if (data) setMakes(data);
    setIsLoading(false);
  };

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMake, setEditingMake] = useState<CarMake | undefined>(
    undefined,
  );

  useEffect(() => {
    fetchMakes();
  }, []);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("car_makes")
      .delete()
      .eq("id", deletingId);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      if (selectedId === deletingId) onSelect("");
      fetchMakes();
    }
    setDeletingId(null);
  };

  const filtered = makes.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <h3 className="font-syne font-semibold text-white">
          Car Makes
          <span className="text-teal-400 bg-teal-500/10 px-2 py-1 rounded text-sm ml-2 font-ibm-mono font-medium">
            {makes.length} Total
          </span>
        </h3>
        <div className="flex items-center gap-2">
            <CarCSVUploader onSuccess={fetchMakes} />
            <button
            onClick={() => {
                setEditingMake(undefined);
                setIsFormOpen(true);
            }}
            className="p-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded transition-colors"
            >
            <Plus className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="p-3 border-b border-border shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            placeholder="Search makes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 text-white h-[38px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isLoading ? (
          <div className="p-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No makes found
          </div>
        ) : (
          filtered.map((make) => {
            const isSelected = selectedId === make.id;
            return (
              <div
                key={make.id}
                onClick={() => onSelect(make.id)}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border",
                  isSelected
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-800/50 hover:border-slate-700/50",
                )}
              >
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "font-medium",
                      isSelected ? "text-teal-400" : "text-slate-200",
                    )}
                  >
                    {make.name}
                  </span>
                  {make.is_chinese && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/80 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50"></span>
                      {make.chinese_tier.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                      isSelected && "opacity-100",
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMake(make);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(make.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-danger/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isSelected
                        ? "text-teal-500 translate-x-1"
                        : "text-slate-600",
                    )}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {isFormOpen && (
        <CarMakeFormSheet
          make={editingMake}
          onClose={() => setIsFormOpen(false)}
          onSuccess={() => {
            setIsFormOpen(false);
            fetchMakes();
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
              car make and all its associated models.
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
              Delete Make
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
