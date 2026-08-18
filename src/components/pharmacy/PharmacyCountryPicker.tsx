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
      <p className="text-sm font-medium text-[#374151]">Pharmacy country *</p>
      <p className="text-xs text-[#64748b]">
        POS, tax, patient IDs, prescriptions, and controlled-drug rules follow this market.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PHARMACY_COUNTRY_OPTIONS.map((option) => {
          const selected = value === option.code;
          return (
            <button
              key={option.code}
              type="button"
              onClick={() => onChange(option.code)}
              className={cn(
                "rounded-2xl border px-4 py-4 text-left transition",
                selected
                  ? "border-[#16a34a] bg-[#f0fdf4] ring-2 ring-[#16a34a]/30"
                  : "border-[#e2e8f0] bg-white hover:border-[#86efac]",
              )}
            >
              <span className="block text-sm font-semibold text-[#0f172a]">{option.label}</span>
              <span className="mt-1 block text-xs text-[#64748b]">{option.hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
