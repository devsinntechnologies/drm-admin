"use client";

import { Globe2, LayoutDashboard, Smartphone } from "lucide-react";
import {
  isBusinessProductEnabled,
  type BusinessProductFlags,
} from "@/lib/business-products";
import { cn } from "@/lib/utils";

const CHIPS = [
  { key: "websiteEnabled" as const, label: "Website", icon: Globe2 },
  { key: "portalEnabled" as const, label: "Portal", icon: LayoutDashboard },
  { key: "softwareEnabled" as const, label: "Software", icon: Smartphone },
];

type BusinessProductBadgesProps = {
  flags: BusinessProductFlags;
  className?: string;
};

export function BusinessProductBadges({ flags, className }: BusinessProductBadgesProps) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {CHIPS.map(({ key, label, icon: Icon }) => {
        const on = isBusinessProductEnabled(flags[key]);
        return (
          <span
            key={key}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold",
              on
                ? "border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]"
                : "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", on ? "bg-[#059669]" : "bg-[#cbd5e1]")}
              aria-hidden
            />
            <Icon className="h-3 w-3" />
            {label}
          </span>
        );
      })}
    </div>
  );
}
