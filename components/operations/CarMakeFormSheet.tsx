"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { logAction } from "@/lib/audit-logger";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import type { CarMake } from "@/hooks/useCarMakes";

type CarMakeFormProps = {
  make?: CarMake;
  onClose: () => void;
  onSuccess: () => void;
};

export function CarMakeFormSheet({
  make,
  onClose,
  onSuccess,
}: CarMakeFormProps) {
  const [name, setName] = useState(make?.name || "");
  const [isChinese, setIsChinese] = useState(make?.is_chinese ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setError("");
    const supabase = createClient();

    // Simplified: No strict DB tiers anymore, just tracking origin.
    const finalTier = isChinese ? "chinese" : "non_chinese";

    const payload = {
      name: name.trim(),
      is_chinese: isChinese,
      chinese_tier: finalTier,
    };

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id || "";
    const userEmail = userData?.user?.email || "unknown@system";

    if (make) {
      const { error: dbError } = await supabase
        .from("car_makes")
        .update(payload)
        .eq("id", make.id);

      if (dbError) {
        setError(dbError.message);
        setIsSubmitting(false);
        return;
      }
      logAction({
        userId,
        userEmail,
        action: "car_updated",
        entityType: "car_make",
        entityId: make.id,
        metadata: {
          makeName: name.trim(),
        },
      });
    } else {
      const { data: newMake, error: dbError } = await supabase
        .from("car_makes")
        .insert(payload)
        .select("id")
        .single();

      if (dbError) {
        setError(dbError.message);
        setIsSubmitting(false);
        return;
      }
      
      if (newMake) {
        logAction({
          userId,
          userEmail,
          action: "car_created",
          entityType: "car_make",
          entityId: newMake.id,
          metadata: {
            makeName: name.trim(),
          },
        });
      }
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-xl h-full flex flex-col bg-card border-l border-border p-0 rounded-none pt-safe"
      >
        <SheetHeader className="border-b border-border p-6 text-left shrink-0">
          <SheetTitle className="text-xl font-syne font-semibold text-foreground">
            {make ? "Edit Car Make" : "Add New Car Make"}
          </SheetTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {make
              ? "Update make details below."
              : "Enter details for the new car brand."}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="make-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Car Make Name
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Toyota"
                className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-2.5 h-[42px] focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border mt-2">
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  Chinese Brand
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Check if this make originates from China.
                </p>
              </div>
              <Switch
                checked={isChinese}
                onCheckedChange={setIsChinese}
                className="data-[state=checked]:bg-amber-500 data-[state=unchecked]:bg-slate-700"
              />
            </div>
          </form>
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-border p-6 shrink-0 bg-card">
          <button
            type="submit"
            form="make-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : make ? (
              "Save Changes"
            ) : (
              "Add Make"
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
