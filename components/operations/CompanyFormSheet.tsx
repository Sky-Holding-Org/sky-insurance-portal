"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

type CompanyFormProps = {
  company?: { id: string; name: string; name_ar: string; is_active: boolean };
  onClose: () => void;
  onSuccess: () => void;
};

export function CompanyFormSheet({
  company,
  onClose,
  onSuccess,
}: CompanyFormProps) {
  const [name, setName] = useState(company?.name || "");
  const [nameAr, setNameAr] = useState(company?.name_ar || "");
  const [isActive, setIsActive] = useState(company?.is_active ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    const supabase = createClient();

    const payload = {
      name,
      name_ar: nameAr,
      is_active: isActive,
    };

    if (company) {
      await supabase
        .from("insurance_companies")
        .update(payload)
        .eq("id", company.id);
    } else {
      await supabase.from("insurance_companies").insert(payload);
    }

    setIsSubmitting(false);
    onSuccess();
  };

  return (
    <Sheet
      open={true}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <SheetContent
        side="right"
        className="sm:max-w-xl h-full flex flex-col bg-slate-900 border-l border-slate-800 p-0 rounded-none pt-safe"
      >
        <SheetHeader className="border-b border-slate-800 p-6 text-left shrink-0">
          <SheetTitle className="text-xl font-syne font-semibold text-white">
            {company ? "Edit Company" : "Add New Company"}
          </SheetTitle>
          <p className="text-sm text-slate-400 mt-1">
            {company
              ? "Update company details below."
              : "Enter the details for the new insurance partner."}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form
            id="company-form"
            onSubmit={handleSubmit}
            className="flex flex-col gap-6"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Company Name (English)
              </label>
              <Input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MADA Insurances"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 h-[42px] focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                Company Name (Arabic){" "}
                <span className="text-slate-500 text-xs">optional</span>
              </label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مدي للتأمين"
                dir="rtl"
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-4 py-2.5 h-[42px] focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-500 transition-colors font-sans"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 border border-slate-700 mt-2">
              <div>
                <h4 className="text-sm font-medium text-slate-200">
                  Active Status
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Inactive companies will not appear in sales quotes.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                className="data-[state=checked]:bg-teal-500 data-[state=unchecked]:bg-slate-700"
              />
            </div>
          </form>
        </div>

        <SheetFooter className="flex-row justify-end gap-3 border-t border-slate-800 p-6 shrink-0 bg-slate-900">
          <button
            type="submit"
            form="company-form"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg bg-teal-500 text-slate-950 font-semibold flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : company ? (
              "Save Changes"
            ) : (
              "Create Company"
            )}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
