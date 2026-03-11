"use client";

import { useQuoteStore } from "@/lib/store/quoteStore";
import { useCarMakes } from "@/hooks/useCarMakes";
import { useCarModels } from "@/hooks/useCarModels";
import { useCallback, useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { RotateCcw } from "lucide-react";

export function CarSpecForm() {
  const store = useQuoteStore();
  const { makes, isLoading: isMakesLoading } = useCarMakes();
  const { models, isLoading: isModelsLoading } = useCarModels(store.makeId);
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const [localValue, setLocalValue] = useState(
    store.carValue ? store.carValue.toLocaleString("en-US") : "",
  );
  const [localYear, setLocalYear] = useState(
    store.manufacturingYear ? store.manufacturingYear.toString() : "",
  );

  const triggerSearch = useCallback(async () => {
    store.setIsLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          makeId: store.makeId,
          carValue: store.carValue,
          fuelType: store.fuelType,
          carCondition: store.carCondition,
          manufacturingYear: store.manufacturingYear,
          electricAgencyStatus: store.electricAgencyStatus,
        }),
      });
      const data = await res.json();
      if (data.quotes) {
        store.setResults(data.quotes, data.carAge);
      } else {
        store.setResults([], 0);
      }
    } catch (e) {
      console.error(e);
      store.setResults([], 0);
    }
  }, [
    store.makeId,
    store.carValue,
    store.fuelType,
    store.carCondition,
    store.manufacturingYear,
    store.electricAgencyStatus,
    store.setIsLoading,
    store.setResults,
  ]);

  useEffect(() => {
    // Only fetch if required fields are present
    if (
      store.makeId &&
      store.carValue >= 10000 &&
      store.manufacturingYear >= 1990
    ) {
      triggerSearch();
    }
  }, [
    store.makeId,
    store.modelId,
    store.carValue,
    store.fuelType,
    store.carCondition,
    store.manufacturingYear,
    store.electricAgencyStatus,
    triggerSearch,
  ]);

  const handleValueChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      setLocalValue("");
      return;
    }
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0) {
      setLocalValue(num.toLocaleString("en-US"));
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        store.setField("carValue", num);
      }, 400);
    }
  };

  const handleYearChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setLocalYear(clean);
    const num = parseInt(clean, 10);
    if (
      !isNaN(num) &&
      num >= 1900 &&
      num <= new Date().getFullYear() + 1 &&
      num >= 0
    ) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        store.setField("manufacturingYear", num);
      }, 400);
    }
  };

  const handleReset = () => {
    store.reset();
    setLocalValue("1,000,000");
    setLocalYear(new Date().getFullYear().toString());
  };

  return (
    <div className="flex flex-col gap-5 h-full relative">
      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Car Make
        </label>
        <Combobox
          items={makes}
          itemToStringLabel={(item: any) => (item ? item.name : "")}
          value={makes.find((m) => m.id === store.makeId) || null}
          onValueChange={(val: any) => {
            store.setField("makeId", val ? val.id : null);
            store.setField("modelId", null);
          }}
        >
          <ComboboxInput
            placeholder="Select Make..."
            className="w-full bg-slate-900 border-slate-700 text-slate-100 rounded-lg h-12 text-sm"
          />
          <ComboboxContent className="border-slate-800 bg-slate-900 text-white z-60">
            <ComboboxEmpty>No make found</ComboboxEmpty>
            <ComboboxList>
              {(m: any) => (
                <ComboboxItem
                  key={m.id}
                  value={m}
                  className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                >
                  {m.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Model
        </label>
        <Combobox
          items={models}
          itemToStringLabel={(item: any) => (item ? item.name : "")}
          value={models.find((m) => m.id === store.modelId) || null}
          onValueChange={(val: any) => {
            store.setField("modelId", val ? val.id : null);
          }}
          disabled={!store.makeId || isModelsLoading}
        >
          <ComboboxInput
            placeholder={isModelsLoading ? "Loading..." : "Select Model..."}
            className="w-full bg-slate-900 border-slate-700 text-slate-100 rounded-lg h-12 text-sm"
          />
          <ComboboxContent className="border-slate-800 bg-slate-900 text-white z-60">
            <ComboboxEmpty>No models found</ComboboxEmpty>
            <ComboboxList>
              {(m: any) => (
                <ComboboxItem
                  key={m.id}
                  value={m}
                  className="hover:bg-slate-800 focus:bg-slate-800 cursor-pointer"
                >
                  {m.name}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Car Value (EGP)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-ibm-mono font-medium">
            EGP
          </span>
          <Input
            type="text"
            value={localValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full bg-slate-900 border-slate-700 border text-white font-ibm-mono text-lg rounded-lg h-[50px] pl-12 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none placeholder:text-slate-600 focus-visible:border-slate-700"
            placeholder="1,500,000"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Fuel Type
          </label>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => store.setField("fuelType", "gasoline")}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.fuelType === "gasoline"
                  ? "bg-teal-500 text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Gasoline
            </button>
            <button
              onClick={() => store.setField("fuelType", "electric")}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.fuelType === "electric"
                  ? "bg-teal-500 text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Electric
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Condition
          </label>
          <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            <button
              onClick={() => store.setField("carCondition", "new")}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.carCondition === "new"
                  ? "bg-teal-500 text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              New
            </button>
            <button
              onClick={() => store.setField("carCondition", "used")}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.carCondition === "used"
                  ? "bg-teal-500 text-white"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              Used
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Manufacturing Year
        </label>
        <Input
          type="text"
          value={localYear}
          onChange={(e) => handleYearChange(e.target.value)}
          className="w-full bg-slate-900 border-slate-700 border text-white font-ibm-mono text-lg rounded-lg h-[50px] focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:outline-none focus-visible:border-slate-700"
        />
      </div>

      {store.fuelType === "electric" && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <label className="block text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
            Agency Status (Electric Only)
          </label>
          <div className="flex bg-amber-500/10 rounded-lg p-1 border border-amber-500/20">
            <button
              onClick={() => store.setField("electricAgencyStatus", "agency")}
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.electricAgencyStatus === "agency"
                  ? "bg-amber-500 text-white"
                  : "text-amber-500/70 hover:text-amber-500",
              )}
            >
              With Agency
            </button>
            <button
              onClick={() =>
                store.setField("electricAgencyStatus", "no_agency")
              }
              className={cn(
                "flex-1 text-xs font-medium py-2 rounded-md transition-colors",
                store.electricAgencyStatus === "no_agency"
                  ? "bg-amber-500 text-white"
                  : "text-amber-500/70 hover:text-amber-500",
              )}
            >
              Without Agency
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-slate-800 flex gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center justify-center gap-2 transition-colors border border-slate-700 hover:text-white shrink-0"
          aria-label="Reset form"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={triggerSearch}
          disabled={!store.makeId}
          className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-5 h-5" />
          CALCULATE QUOTES
        </button>
      </div>
    </div>
  );
}
