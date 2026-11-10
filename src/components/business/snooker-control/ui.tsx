"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const BADGE_TONES = {
  green: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
  amber: "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
  slate: "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]",
  blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  violet: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]",
} as const;

export function Badge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: ReactNode }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold", BADGE_TONES[tone])}>
      {children}
    </span>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-lg border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] disabled:opacity-50",
        danger ? "text-[#dc2626] hover:border-[#fecaca] hover:bg-[#fef2f2]" : "text-[#475569]",
      )}
    >
      {children}
    </button>
  );
}

/** Accessible on/off switch with a title and helper line. */
export function SwitchRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
  tone = "dark",
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  tone?: "dark" | "green";
}) {
  const on = tone === "green" ? "bg-[#16a34a]" : "bg-[#0f172a]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left disabled:opacity-50",
        checked ? "border-[#cbd5e1] bg-[#f8fafc]" : "border-[#e2e8f0] bg-white",
      )}
    >
      <span>
        <span className="block text-sm font-semibold text-[#0f172a]">{label}</span>
        <span className="block text-xs text-[#64748b]">{hint}</span>
      </span>
      <span className={cn("flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition", checked ? on : "bg-[#cbd5e1]")}>
        <span className={cn("h-4 w-4 rounded-full bg-white shadow transition", checked && "translate-x-4")} />
      </span>
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-[#334155]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[#94a3b8]">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#0f172a] outline-none focus:border-[#0f172a]";
