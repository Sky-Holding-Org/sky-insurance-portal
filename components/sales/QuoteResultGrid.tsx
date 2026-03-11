"use client";

import { useQuoteStore } from "@/lib/store/quoteStore";
import { QuoteResultCard } from "./QuoteResultCard";
import { Copy, AlertTriangle, Calculator, SearchX } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function QuoteResultGrid() {
  const { quotes, isLoading, carAge, hasSearched } = useQuoteStore();

  const handleCopyAll = () => {
    // Collect text from all quotes
    const text = quotes
      .map(
        (q, i) =>
          `Option ${i + 1}: ${q.companyName} (${q.policyType}) - EGP ${q.annualPremium}`,
      )
      .join("\n");
    navigator.clipboard.writeText(`Car Insurance Quotes:\n\n${text}`);
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
        <div className="w-10 h-10 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
        <span className="text-sm font-medium animate-pulse">
          Calculating optimal rates...
        </span>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Empty className="h-full min-h-[400px]">
          <EmptyMedia>
            <Calculator className="w-5 h-5 text-slate-600" />
          </EmptyMedia>
          <EmptyTitle>Enter car specs</EmptyTitle>
          <EmptyDescription className="max-w-[280px]">
            Fill in the car details on the left to see all available quotes from
            every insurance company.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  if (!quotes || quotes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <Empty className="h-full min-h-[400px]">
          <EmptyMedia>
            <SearchX className="w-5 h-5 text-slate-600" />
          </EmptyMedia>
          <EmptyTitle>No matching quotes</EmptyTitle>
          <EmptyDescription className="max-w-[280px]">
            Try adjusting the car specs or check that rules are active on the
            operations table.
          </EmptyDescription>
        </Empty>
      </div>
    );
  }

  // Count active companies
  const companyCounts = new Set(quotes.map((q) => q.companyId)).size;

  // Group quotes by companyName
  const groupedQuotes = quotes.reduce((acc, quote) => {
    if (!acc[quote.companyName]) {
      acc[quote.companyName] = [];
    }
    acc[quote.companyName].push(quote);
    return acc;
  }, {} as Record<string, typeof quotes>);

  // Sort companies by the lowest quote first
  const sortedCompanies = Object.keys(groupedQuotes).sort((a, b) => {
    const minA = Math.min(...groupedQuotes[a].map(q => q.annualPremium));
    const minB = Math.min(...groupedQuotes[b].map(q => q.annualPremium));
    return minA - minB;
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between px-1 shrink-0">
        <h3 className="font-syne text-lg font-medium text-slate-200">
          Available Quotes{" "}
          <span className="text-teal-400  bg-teal-500/10 px-2 py-1 rounded text-sm ml-2">
            {quotes.length} found
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-400">
            {companyCounts} Companies
          </span>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Summary
          </button>
        </div>
      </div>

      {carAge > 10 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-3 shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400 font-medium leading-snug">
            ⚠️ Cars over 10 years old have very limited insurance options. The
            results below only reflect standard rules and may require special
            approval.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 pb-6 space-y-8">
        {sortedCompanies.map((companyName, compIdx) => (
          <div key={companyName} className="space-y-4">
            <h4 className="font-syne font-semibold text-slate-300 text-base border-b border-slate-800 pb-2">
              {companyName}
            </h4>
            <div className="space-y-4">
              {groupedQuotes[companyName].map((quote, idx) => (
                <QuoteResultCard key={quote.ruleId} quote={quote} rank={idx + 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
