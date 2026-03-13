"use client";

import { useState } from "react";
import { CarMakeTable } from "@/components/operations/CarMakeTable";
import { CarModelPanel } from "@/components/operations/CarModelPanel";

export function CarsDashboardManager() {
  const [selectedMakeId, setSelectedMakeId] = useState<string | null>(null);

  return (
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
  );
}
