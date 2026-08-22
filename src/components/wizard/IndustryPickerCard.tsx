"use client";

import { Check } from "lucide-react";
import { IndustryIcon } from "@/components/templates/IndustryIcon";
import { cn } from "@/lib/utils";

type IndustryPickerCardProps = {
  name: string;
  icon: string;
  featureCount: number;
  accentColor: string;
  selected: boolean;
  onClick: () => void;
};

export function IndustryPickerCard({
  name,
  icon,
  featureCount,
  accentColor,
  selected,
  onClick,
}: IndustryPickerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
        selected
          ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] shadow-[0_4px_16px_rgba(0,80,248,0.14)]"
          : "border-[#e8edf3] bg-white hover:border-[var(--brand-secondary)]/40 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]",
      )}
    >
      {selected ? (
        <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand-secondary)] text-white">
          <Check className="h-3 w-3" strokeWidth={3} />
        </span>
      ) : null}

      <div className="flex items-center gap-3.5">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-xl",
            selected && "bg-[var(--brand-secondary)] text-white shadow-[0_4px_10px_rgba(0,80,248,0.25)]",
          )}
          style={
            selected
              ? undefined
              : { backgroundColor: `${accentColor}14`, color: accentColor }
          }
        >
          <IndustryIcon name={icon} className="h-5 w-5" />
        </div>

        <div className="min-w-0 pr-4">
          <p
            className={cn(
              "font-semibold leading-snug",
              selected ? "text-[var(--brand-secondary)]" : "text-[#475569]",
            )}
          >
            {name}
          </p>
          <p className="mt-0.5 text-xs text-[#94a3b8]">{featureCount} features</p>
        </div>
      </div>
    </button>
  );
}
