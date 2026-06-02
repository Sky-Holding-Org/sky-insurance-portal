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
import ThemeToggle from "./ThemeToggle";

export default function TopBar({ role }: { role: string }) {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-card/80 backdrop-blur-xl border-b border-border shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            {paths.map((path, index) => {
              const href = `/${paths.slice(0, index + 1).join("/")}`;
              const isLast = index === paths.length - 1;
              const formattedName =
                path.charAt(0).toUpperCase() + path.slice(1);

              return (
                <React.Fragment key={path}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-foreground font-medium">
                        {formattedName}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href} className="text-muted-foreground hover:text-foreground transition-colors">
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

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* Role Badge */}
        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-sm ${
            role === "super_admin"
              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
              : role === "operation"
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                : "bg-teal-500/10 border border-teal-500/20 text-teal-500"
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${
              role === "super_admin"
                ? "bg-purple-400"
                : role === "operation"
                  ? "bg-amber-500"
                  : "bg-teal-500"
            }`}
          />
          {role === "super_admin"
            ? "Super Admin"
            : role === "operation"
              ? "Operations"
              : "Sales"}
        </div>
      </div>
    </header>
  );
}
