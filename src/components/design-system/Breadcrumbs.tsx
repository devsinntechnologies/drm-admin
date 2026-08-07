"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex flex-wrap items-center gap-1 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
            {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-[#94a3b8]" aria-hidden /> : null}
            {item.href && !isLast ? (
              <Link href={item.href} className="font-medium text-[#64748b] transition hover:text-[#0050f8]">
                {item.label}
              </Link>
            ) : (
              <span className={cn("font-semibold", isLast ? "text-[#0f172a]" : "text-[#64748b]")}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
