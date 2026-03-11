"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, CarFront, Car } from "lucide-react";
import type { CarModel } from "@/hooks/useCarModels";
import { CarModelFormModal } from "./CarModelFormModal";
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
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type CarModelPanelProps = {
  makeId: string | null;
};

export function CarModelPanel({ makeId }: CarModelPanelProps) {
  const [models, setModels] = useState<CarModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchModels = async (id: string) => {
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("car_models")
      .select("*")
      .eq("make_id", id)
      .order("name");
    if (data) setModels(data);
    setIsLoading(false);
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<CarModel | undefined>(
    undefined,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (makeId) {
      fetchModels(makeId);
    } else {
      setModels([]);
    }
  }, [makeId]);

  const confirmDelete = async () => {
    if (!deletingId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("car_models")
      .delete()
      .eq("id", deletingId);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      if (makeId) fetchModels(makeId);
    }
    setDeletingId(null);
  };

  if (!makeId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Empty>
          <EmptyMedia>
            <Car className="w-5 h-5 text-slate-600" />
          </EmptyMedia>
          <EmptyTitle>Select a make</EmptyTitle>
          <EmptyDescription>
            Choose a car make from the left to manage its models
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  const filtered = models.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0 bg-slate-900">
        <h3 className="font-syne font-semibold text-white">Models</h3>
        <button
          onClick={() => {
            setEditingModel(undefined);
            setIsModalOpen(true);
          }}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
        >
          <Plus className="w-4 h-4" />
          Add Model
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            placeholder="Search models..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-3 py-2 text-white h-[38px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-slate-800/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8">
            {search ? (
              <Empty>
                <EmptyMedia>
                  <Search className="w-5 h-5 text-slate-600" />
                </EmptyMedia>
                <EmptyTitle>No models matching "{search}"</EmptyTitle>
              </Empty>
            ) : (
              <Empty>
                <EmptyMedia>
                  <CarFront className="w-5 h-5 text-slate-600" />
                </EmptyMedia>
                <EmptyTitle>No models added</EmptyTitle>
                <EmptyDescription>
                  Add models for this make using the button above
                </EmptyDescription>
              </Empty>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
            {filtered.map((model) => (
              <div
                key={model.id}
                className="group flex items-center justify-between p-3 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors"
              >
                <span className="font-medium text-slate-200">{model.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingModel(model);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(model.id)}
                    className="p-1.5 text-slate-400 hover:text-danger rounded hover:bg-danger/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && makeId && (
        <CarModelFormModal
          makeId={makeId}
          model={editingModel}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchModels(makeId);
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
              car model from the database.
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
              Delete Model
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
