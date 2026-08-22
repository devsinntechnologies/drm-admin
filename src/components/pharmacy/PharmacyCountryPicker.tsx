"use client";

import { PHARMACY_COUNTRY_OPTIONS, type PharmacyMarketCode } from "@/lib/pharmacy-market";
import { cn } from "@/lib/utils";

export function PharmacyCountryPicker({
  value,
  onChange,
}: {
  value: PharmacyMarketCode;
  onChange: (code: PharmacyMarketCode) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="wizard-label">Country</p>
      <p className="wizard-help">Tax and prescription rules follow this market.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PHARMACY_COUNTRY_OPTIONS.map((option) => {
          const selected = value === option.code;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              className={cn(
                "wizard-card wizard-card-surface px-4 py-4 text-left",
                selected
                  ? "border-[var(--brand-secondary)] bg-white ring-2 ring-[var(--brand-secondary)]/20"
                  : "hover:border-[#cbd5e1]",
              )}
            >
              <span className={cn("block text-sm font-semibold", selected ? "text-[#475569]" : "text-[#64748b]")}>
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-[#94a3b8]">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
