import { CompanyTable } from "@/components/operations/CompanyTable";

export default function CompaniesPage() {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-syne font-semibold text-white">
            Insurance Companies
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage active insurance providers on the platform.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <CompanyTable />
      </div>
    </div>
  );
}
