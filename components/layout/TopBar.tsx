"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export default function TopBar({ role }: { role: string }) {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 shrink-0 shadow-sm shadow-black/10">
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-slate-400">Home</BreadcrumbLink>
            </BreadcrumbItem>
            {paths.map((path, index) => {
              const href = `/${paths.slice(0, index + 1).join("/")}`;
              const isLast = index === paths.length - 1;
              const formattedName = path.charAt(0).toUpperCase() + path.slice(1);

              return (
                <React.Fragment key={path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-slate-200 font-medium">
                        {formattedName}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="text-slate-400">
                        {formattedName}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Badge */}
        <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {role === "operation" ? "Operations" : "Sales"}
        </div>
      </div>
    </header>
  );
}
