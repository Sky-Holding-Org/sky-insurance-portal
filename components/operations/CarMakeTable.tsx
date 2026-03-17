"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Edit2,
  Trash2,
  Plus,
  Search,
  ChevronRight,
  Car,
  ListFilter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CarMake } from "@/hooks/useCarMakes";
import { CarMakeFormSheet } from "./CarMakeFormSheet";
import { CarCSVUploader } from "./CarCSVUploader";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [sortBy, setSortBy] = useState<"alphabet" | "recent">("alphabet");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const fetchMakes = async () => {
    setIsLoading(true);
    const supabase = createClient();
    let query = supabase.from("car_makes").select("*");

    if (sortBy === "alphabet") {
      query = query.order("name", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
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
  }, [sortBy]);

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
      setSelectedIds(prev => prev.filter(id => id !== deletingId));
      fetchMakes();
    }
    setDeletingId(null);
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("car_makes")
      .delete()
      .in("id", selectedIds);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      if (selectedId && selectedIds.includes(selectedId)) onSelect("");
      setSelectedIds([]);
      setIsDeletingBulk(false);
      fetchMakes();
    }
  };

  const filtered = makes.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

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
          {selectedIds.length > 0 && (
            <button
              onClick={() => setIsDeletingBulk(true)}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 font-semibold px-2 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors border border-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {selectedIds.length}
            </button>
          )}
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

      <div className="p-3 border-b border-border shrink-0 flex items-center gap-2">
        <Checkbox 
          checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
          onCheckedChange={handleSelectAll}
          aria-label="Select all"
          className="mr-1"
        />
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            placeholder="Search makes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 text-white h-[38px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
          />
        </div>
        <div className="shrink-0 w-36">
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-full bg-slate-950 border-slate-800 text-slate-300 h-[38px] hover:bg-slate-900 transition-colors focus:ring-1 focus:ring-teal-500">
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
                  "group flex items-center p-3 rounded-lg cursor-pointer transition-all border",
                  isSelected
                    ? "bg-teal-500/10 border-teal-500/30 text-teal-400"
                    : "bg-transparent border-transparent text-slate-300 hover:bg-slate-800/50 hover:border-slate-700/50",
                )}
              >
                <div 
                  className="mr-3 shrink-0" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox 
                    checked={selectedIds.includes(make.id)}
                    onCheckedChange={(c) => handleSelectOne(!!c, make.id)}
                    aria-label={`Select ${make.name}`}
                  />
                </div>
                
                <div className="flex flex-col flex-1">
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
              This action cannot be undone. This will permanently delete {isDeletingBulk ? "the selected car makes" : "this car make"} and all associated models.
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
              Delete {isDeletingBulk ? "Selected" : "Make"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
