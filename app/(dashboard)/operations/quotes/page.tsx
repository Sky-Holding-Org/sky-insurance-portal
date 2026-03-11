import { QuoteRuleTable } from "@/components/operations/QuoteRuleTable";

export default function QuotesPage() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] max-w-[1600px] mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-syne font-semibold text-white">
            Quote Rules Pricing Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Define base rates, age brackets, and coverage conditions.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <QuoteRuleTable />
      </div>
    </div>
  );
}
