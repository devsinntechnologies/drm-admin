"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="grid h-14 w-14 place-items-center rounded-xl border border-[#e2e8f0] bg-white text-[#0050f8]">
        <Icon className="h-7 w-7" strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-[#64748b]">{description}</p> : null}
      {primaryAction || secondaryAction ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
