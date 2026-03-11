"use client";

import { useState } from "react";
import { CarMakeTable } from "@/components/operations/CarMakeTable";
import { CarModelPanel } from "@/components/operations/CarModelPanel";

export default function CarsPage() {
  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-syne font-semibold text-white">
            Car Catalog
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage car makes, models, and Chinese brand tiers.
          </p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel: Makes */}
        <div className="w-1/2 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <CarMakeTable
            selectedId={selectedMakeId}
            onSelect={setSelectedMakeId}
          />
        </div>

        {/* Right Panel: Models */}
        <div className="w-1/2 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          <CarModelPanel makeId={selectedMakeId} />
        </div>
      </div>
    </div>
  );
}
