"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import type { CarModel } from "@/hooks/useCarModels";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

type CarModelFormProps = {
  makeId: string;
  model?: CarModel;
  onClose: () => void;
  onSuccess: () => void;
};

export function CarModelFormModal({
  makeId,
  model,
  onClose,
  onSuccess,
}: CarModelFormProps) {
  const [name, setName] = useState(model?.name || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError("");
    const supabase = createClient();

    const payload = {
      make_id: makeId,
      name: name.trim(),
    };

    if (model) {
      const { error: dbError } = await supabase
        .from("car_models")
        .update(payload)
        .eq("id", model.id);

      if (dbError) {
        setError(dbError.message);
        setIsSubmitting(false);
        return;
      }
    } else {
      const { error: dbError } = await supabase
        .from("car_models")
        .insert(payload);

      if (dbError) {
        setError(dbError.message);
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <Sheet
      open={true} // Kept original open={true} as isOpen is not defined
      onOpenChange={(open) => !open && onClose()}
    >
      <SheetContent
        side="right"
        className="sm:max-w-md h-full flex flex-col bg-slate-900 border-l border-slate-700 p-0 rounded-none"
      >
        <SheetHeader className="border-b border-slate-800 p-5 text-left shrink-0">
          <SheetTitle className="text-lg font-syne font-semibold text-white">
            {model ? "Edit Trim" : "Add Trim"}
          </SheetTitle>
          <p className="text-xs text-slate-400 mt-1">
            Configure {model ? "this trim" : "a new trim"} for this car make.
          </p>
        </SheetHeader>

        <div className="flex-1 p-5 overflow-y-auto">
          <form
            id="model-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">
                Model Name
              </label>
              <Input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corolla"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg h-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors"
              />
            </div>
          </form>
        </div>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-slate-800 p-4 shrink-0 bg-slate-900/50">
          <button
            type="submit"
            form="model-form"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-teal-500 text-slate-950 font-semibold flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors disabled:opacity-50 text-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : model ? (
              "Save"
            ) : (
              "Add"
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
