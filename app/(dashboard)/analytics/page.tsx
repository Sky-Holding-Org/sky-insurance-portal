"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Loader2, TrendingUp, Building2, CarFront, FileText } from "lucide-react";

const chartConfig = {
  quotes: {
    label: "Rules",
    color: "#14b8a6", // teal-500
  },
} satisfies ChartConfig;

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    companiesCount: 0,
    makesCount: 0,
    rulesCount: 0,
  });
  
  const [chartData, setChartData] = useState<{ company: string; rules: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      
      // Fetch aggregate counts natively
      const [
        { count: companiesCount },
        { count: makesCount },
        { data: rulesData }
      ] = await Promise.all([
        supabase.from("insurance_companies").select("*", { count: "exact", head: true }),
        supabase.from("car_makes").select("*", { count: "exact", head: true }),
        supabase.from("quote_rules").select(`
          id,
          insurance_companies ( name )
        `)
      ]);

      const counts = {
        companiesCount: companiesCount || 0,
        makesCount: makesCount || 0,
        rulesCount: rulesData?.length || 0,
      };

      setMetrics(counts);

      // Aggregate rules per company for chart
      if (rulesData) {
        const rulesPerCompany = rulesData.reduce((acc, rule: any) => {
          const companyName = rule.insurance_companies?.name || "Unknown";
          if (!acc[companyName]) {
            acc[companyName] = 0;
          }
          acc[companyName]++;
          return acc;
        }, {} as Record<string, number>);

        const formattedChartData = Object.entries(rulesPerCompany)
          .map(([company, rules]) => ({
            company,
            rules,
          }))
          .sort((a, b) => b.rules - a.rules); // Sort desc by rules

        setChartData(formattedChartData);
      }

      setIsLoading(false);
    }
    
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-transparent">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-syne font-bold text-white tracking-tight">
          Analytics Dashboard
        </h1>
        <p className="text-slate-400 mt-1">
          Overview of your insurance operations and market coverage.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Companies</p>
              <h3 className="text-2xl font-bold text-white font-ibm-mono">{metrics.companiesCount}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
              <CarFront className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Supported Makes</p>
              <h3 className="text-2xl font-bold text-white font-ibm-mono">{metrics.makesCount}</h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Rules Active</p>
              <h3 className="text-2xl font-bold text-white font-ibm-mono">{metrics.rulesCount}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white font-syne">Rules per Company</h3>
            <p className="text-sm text-slate-400 mt-1">
              Distribution of pricing rules across active insurance partners.
            </p>
          </div>
          <TrendingUp className="w-5 h-5 text-teal-500 shrink-0" />
        </div>

        <div className="h-[300px] w-full mt-4">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: -20, right: 10 }}>
              <CartesianGrid vertical={false} stroke="#1e293b" />
              <XAxis
                dataKey="company"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + "..." : value}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="rules" fill="var(--color-quotes)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
