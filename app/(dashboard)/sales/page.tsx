import { CarSpecForm } from "@/components/sales/CarSpecForm";
import { QuoteResultGrid } from "@/components/sales/QuoteResultGrid";

export default function SalesPage() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col xl:flex-row gap-6">
      {/* Left Panel: Form */}
      <div className="w-full xl:w-[400px] shrink-0 bg-card rounded-xl border border-border flex flex-col p-5 h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
        <h2 className="font-syne text-xl font-semibold tracking-tight text-white mb-6">
          Quick Quote Calculator
        </h2>
        <CarSpecForm />
      </div>

      {/* Right Panel: Results */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-7rem)]">
        <QuoteResultGrid />
      </div>
    </div>
  );
}
