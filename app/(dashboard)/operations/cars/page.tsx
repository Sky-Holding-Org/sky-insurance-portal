import { CarsDashboardManager } from "@/components/operations/CarsDashboardManager";

export default function CarsPage() {
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

      <CarsDashboardManager />
    </div>
  );
}
