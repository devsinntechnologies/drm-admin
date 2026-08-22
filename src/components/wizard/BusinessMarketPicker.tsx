"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type BusinessMarketCode = "PK" | "UK";

const MARKETS: Array<{
  code: BusinessMarketCode;
  label: string;
  hint: string;
  flag: string;
}> = [
  { code: "PK", label: "Pakistan", hint: "PKR · +92", flag: "🇵🇰" },
  { code: "UK", label: "United Kingdom", hint: "GBP · +44", flag: "🇬🇧" },
];

export function marketFromPhonePrefix(prefix: string): BusinessMarketCode {
  return prefix === "+44" ? "UK" : "PK";
}

export function BusinessMarketPicker({
  value,
  onChange,
}: {
  value: BusinessMarketCode;
  onChange: (code: BusinessMarketCode) => void;
}) {
  return (
    <div className="mb-0">
      <p className="wizard-form-section-title">Country</p>
      <p className="wizard-form-section-desc">Sets phone code and currency.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {MARKETS.map((market) => {
          const selected = value === market.code;
          return (
            <button
              key={market.code}
              type="button"
              onClick={() => onChange(market.code)}
              className={cn(
                "relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                selected
                  ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] shadow-[0_4px_16px_rgba(0,80,248,0.12)]"
                  : "border-[#e8edf3] bg-white hover:border-[var(--brand-secondary)]/40 hover:shadow-sm",
              )}
            >
              {selected ? (
                <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-[var(--brand-secondary)] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              ) : null}
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none" aria-hidden>
                  {market.flag}
                </span>
                <div className="min-w-0 pr-4">
                  <p
                    className={cn(
                      "font-semibold leading-snug",
                      selected ? "text-[var(--brand-secondary)]" : "text-[#475569]",
                    )}
                  >
                    {market.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">{market.hint}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
