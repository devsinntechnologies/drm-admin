"use client";

import { cn } from "@/lib/utils";

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "business" | "subscription" | "user" | "payment" | "system";
};

const typeColors: Record<ActivityItem["type"], string> = {
  business: "bg-[#0050f8]",
  subscription: "bg-[#7c3aed]",
  user: "bg-[#059669]",
  payment: "bg-[#d97706]",
  system: "bg-[#64748b]",
};

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <ul className={cn("space-y-0", className)}>
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cn(
            "flex gap-3 py-3",
            index < items.length - 1 && "border-b border-[#f1f5f9]",
          )}
        >
          <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", typeColors[item.type])} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#0f172a]">{item.title}</p>
            <p className="mt-0.5 text-xs text-[#64748b]">{item.description}</p>
          </div>
          <time className="shrink-0 text-[11px] font-medium text-[#94a3b8]">{item.time}</time>
        </li>
      ))}
    </ul>
  );
}
