"use client";

import { QuoteResult, formatEGP } from "@/lib/quote-engine";
import { cn } from "@/lib/utils";
import { Copy, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  quote: QuoteResult;
  rank: number;
}

export function QuoteResultCard({ quote, rank }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBest = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  const handleCopy = () => {
    const text = `Insurance Quote 🚘
Company: ${quote.companyName}
Policy: ${quote.policyType === "private" ? "Private" : "Gold"}
Rate: ${quote.ratePercentage}%
Annual Premium: ${formatEGP(quote.annualPremium)}

Conditions:
${quote.conditions.map((c) => `- ${c}`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.05 }}
      className={cn(
        "relative rounded-xl border bg-card overflow-hidden transition-all duration-300",
        isBest
          ? "border-teal-500/50 shadow-[0_0_15px_rgba(0,212,180,0.1)]"
          : "border-border",
        "hover:border-teal-500/30",
      )}
    >
      {/* Top Banner for Best Rate */}
      {isBest && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-teal-400 to-teal-600" />
      )}

      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full font-ibm-mono text-sm font-bold border",
                isBest
                  ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
                  : isSecond
                    ? "bg-slate-300/10 text-slate-300 border-slate-300/30"
                    : isThird
                      ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700",
              )}
            >
              {rank}
            </div>
            <div>
              <h4 className="font-syne font-bold text-lg text-slate-100 flex items-center gap-2">
                {quote.companyName}
                {isBest && (
                  <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded font-sans tracking-wide">
                    BEST RATE ⭐
                  </span>
                )}
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded border capitalize",
                quote.policyType === "gold"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-slate-800 text-slate-300 border-slate-700",
              )}
            >
              {quote.policyType}
            </span>
          </div>
        </div>

        <div className="flex flex-col mb-5">
          <div className="flex justify-between items-end mb-1">
             <span className="text-xs text-slate-500 font-medium">
               Annual Premium
             </span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-3 flex-wrap">
              <span className="font-ibm-mono text-3xl font-bold text-white tracking-tight">
                {formatEGP(quote.annualPremium).replace("EGP", "").trim()}{" "}
                <span className="text-lg text-slate-400 font-medium">EGP</span>
              </span>
              <span className="text-sm text-teal-400 mb-1 font-medium bg-teal-500/10 px-2 py-0.5 rounded">
                Rate: {quote.ratePercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors group py-1"
          >
            <span className="font-medium">
              {quote.conditions.length} Conditions applied
            </span>
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white px-3 py-1.5 rounded transition-colors shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-teal-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-2 border-t border-slate-800/50">
                <ul
                  className="space-y-2 text-right text-sm text-slate-300 leading-relaxed font-sans"
                  dir="rtl"
                >
                  {quote.conditions.map((condition, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 justify-start"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-500/50 shrink-0" />
                      <span>{condition}</span>
                    </li>
                  ))}
                  {quote.conditions.length === 0 && (
                    <li className="text-slate-500 text-center">
                      No special conditions
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
