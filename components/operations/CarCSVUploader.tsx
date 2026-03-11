"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, FileUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type CSVRow = {
  make: string;
  isChinese: boolean;
  model: string;
};

type UploaderProps = {
  onSuccess: () => void;
};

export function CarCSVUploader({ onSuccess }: UploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isXLSX = fileName.endsWith(".xlsx");

    if (!isCSV && !isXLSX) {
      setError("Please select a valid CSV or XLSX file (.csv, .xlsx)");
      return;
    }

    try {
      let parsedRows: CSVRow[] = [];

      if (isXLSX) {
        // Dynamically import xlsx for client-side processing
        const XLSX = await import("xlsx");
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (json.length > 0) {
          const headers = (json[0] || []).map((h: any) => String(h).trim().toLowerCase());
          
          if (!headers[0]?.includes("make") || !headers[2]?.includes("model")) {
            setError("Invalid XLSX format. Expected: Make, Is Chinese, Model");
            return;
          }

          for (let i = 1; i < json.length; i++) {
            const cols = json[i];
            if (Array.isArray(cols) && cols.length >= 3) {
              const makeStr = String(cols[0] || "").trim();
              const isChineseStr = String(cols[1] || "").toLowerCase().trim();
              const modelStr = String(cols[2] || "").trim();

              if (makeStr && modelStr) {
                const isChinese =
                  isChineseStr === "true" ||
                  isChineseStr === "1" ||
                  isChineseStr === "yes";
                
                parsedRows.push({
                  make: makeStr,
                  isChinese,
                  model: modelStr,
                });
              }
            }
          }
        }
      } else {
        // Native CSV reading
        const text = await file.text();
        const rows = text
          .split("\n")
          .map((row) => row.trim())
          .filter((row) => row.length > 0);

        if (rows.length > 0) {
          const headers = rows[0].split(",").map((h) => h.trim().toLowerCase());
          
          if (!headers[0]?.includes("make") || !headers[2]?.includes("model")) {
            setError("Invalid CSV format. Expected: Make, Is Chinese, Model");
            return;
          }

          for (let i = 1; i < rows.length; i++) {
            const columns = rows[i].split(",").map((c) => c.trim());
            if (columns.length >= 3) {
              const makeStr = columns[0];
              const isChineseStr = columns[1].toLowerCase();
              const modelStr = columns[2];

              if (makeStr && modelStr) {
                const isChinese =
                  isChineseStr === "true" ||
                  isChineseStr === "1" ||
                  isChineseStr === "yes";
                
                parsedRows.push({
                  make: makeStr,
                  isChinese,
                  model: modelStr,
                });
              }
            }
          }
        }
      }

      if (parsedRows.length === 0) {
        setError("No valid rows found in file.");
        return;
      }

      setPreview(parsedRows);
      setError(null);
    } catch (err) {
      setError("Failed to parse file.");
      console.error(err);
    }
    
    // Reset input
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const processUpload = async () => {
    if (preview.length === 0) return;
    
    setIsProcessing(true);
    setError(null);
    const supabase = createClient();
    let successCount = 0;

    try {
      // Group models by make to avoid duplicate make creations
      const makesMap = new Map<string, { isChinese: boolean; models: Set<string> }>();
      
      for (const row of preview) {
        if (!makesMap.has(row.make)) {
          makesMap.set(row.make, { isChinese: row.isChinese, models: new Set() });
        }
        makesMap.get(row.make)?.models.add(row.model);
      }

      for (const [makeName, data] of Array.from(makesMap.entries())) {
        // 1. Upsert Make
        let makeId: string;
        
        const { data: existingMake } = await supabase
          .from("car_makes")
          .select("id")
          .ilike("name", makeName)
          .single();

        if (existingMake) {
          makeId = existingMake.id;
        } else {
          const { data: newMake, error: makeError } = await supabase
            .from("car_makes")
            .insert({
              name: makeName,
              is_chinese: data.isChinese,
              chinese_tier: data.isChinese ? "chinese" : "non_chinese"
            })
            .select("id")
            .single();

          if (makeError) throw makeError;
          makeId = newMake.id;
        }

        // 2. Upsert Models for this Make
        for (const modelName of Array.from(data.models)) {
          const { data: existingModel } = await supabase
            .from("car_models")
            .select("id")
            .eq("make_id", makeId)
            .ilike("name", modelName)
            .single();

          if (!existingModel) {
            const { error: modelError } = await supabase
              .from("car_models")
              .insert({
                make_id: makeId,
                name: modelName
              });
            
            if (modelError) throw modelError;
          }
          successCount++;
        }
      }

      toast.success(`Successfully imported ${successCount} models across ${makesMap.size} makes`);
      setIsOpen(false);
      setPreview([]);
      onSuccess();

    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to import data");
      toast.error("Import failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!isProcessing) {
      setIsOpen(open);
      if (!open) {
        setPreview([]);
        setError(null);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors border border-slate-700"
        >
          <Upload className="w-4 h-4" />
          Import File
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-syne text-white flex items-center gap-2">
            <FileUp className="w-5 h-5 text-teal-500" />
            Import Car Database
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Upload a CSV or XLSX file containing Make, Chinese Origin (true/false), and Model to bulk import data.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col gap-4">
          <input
            type="file"
            accept=".csv, .xlsx"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileSelect}
          />
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 hover:bg-slate-800/30 rounded-lg p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          >
            <Upload className="w-8 h-8 text-slate-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">Click to browse or drag file here</p>
              <p className="text-xs text-slate-500 mt-1">Format: Make, Is Chinese, Model (.csv or .xlsx)</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-sm text-red-500">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {preview.length > 0 && !error && (
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div className="bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-300 border-b border-slate-800 flex justify-between">
                <span>Preview ({preview.length} rows)</span>
              </div>
              <div className="max-h-[200px] overflow-y-auto p-4 custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Make</th>
                      <th className="pb-2 font-medium">Chinese</th>
                      <th className="pb-2 font-medium">Model</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300 divide-y divide-slate-800">
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="py-2">{row.make}</td>
                        <td className="py-2">
                            {row.isChinese ? (
                                <span className="text-amber-500">Yes</span>
                            ) : (
                                <span className="text-slate-500">No</span>
                            )}
                        </td>
                        <td className="py-2">{row.model}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-slate-500 text-center mt-3 pt-3 border-t border-slate-800">
                    Showing 10 of {preview.length} rows
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4">
          <button
            onClick={() => handleClose(false)}
            disabled={isProcessing}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={processUpload}
            disabled={preview.length === 0 || isProcessing || !!error}
            className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-teal-400 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Confirm Import"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
