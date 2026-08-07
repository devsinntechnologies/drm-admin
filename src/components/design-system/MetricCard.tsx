"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  delta?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info";
  className?: string;
}) {
  const tones = {
    default: "border-[#e2e8f0] bg-white",
    primary: "border-[#001840]/20 bg-[#001840] text-white",
    success: "border-[#059669]/20 bg-[#ecfdf5]",
    warning: "border-[#d97706]/20 bg-[#fffbeb]",
    info: "border-[#0284c7]/20 bg-[#f0f9ff]",
  };

  const isDark = tone === "primary";

  return (
    <article className={cn("rounded-xl border p-4 transition-colors", tones[tone], className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", isDark ? "text-white/70" : "text-[#94a3b8]")}>
            {label}
          </p>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-[#0f172a]")}>{value}</p>
          {sub ? <p className={cn("mt-1 text-xs", isDark ? "text-white/80" : "text-[#64748b]")}>{sub}</p> : null}
        </div>
        {Icon ? (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
              isDark ? "border border-white/15 bg-white/10 text-white" : "border border-[#e2e8f0] bg-[#f8fafc] text-[#0050f8]",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>
        ) : null}
      </div>
      {delta ? (
        <p className={cn("mt-3 text-xs font-semibold", isDark ? "text-[#00d4ff]" : "text-[#059669]")}>{delta}</p>
      ) : null}
    </article>
  );
}
