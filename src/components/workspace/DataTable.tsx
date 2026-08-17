"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { portalSearchClass } from "@/components/admin/PortalPage";

export function FilterBar({
  search,
  onSearch,
  placeholder = "Search…",
  children,
}: {
  search?: string;
  onSearch?: (value: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {onSearch ? (
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={placeholder}
            className={portalSearchClass}
          />
        </div>
      ) : <div />}
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function StatusBadge({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "success" | "warn" | "danger";
}) {
  const tones = {
    neutral: "bg-[#f1f5f9] text-[#334155]",
    success: "bg-[#dcfce7] text-[#166534]",
    warn: "bg-[#fef3c7] text-[#92400e]",
    danger: "bg-[#fee2e2] text-[#991b1b]",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tones[tone])}>
      {value}
    </span>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; label: string; className?: string }>;
  rows: Array<Record<string, React.ReactNode>>;
  empty?: React.ReactNode;
}) {
  if (!rows.length) return <>{empty}</>;
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
      <table className="w-full text-sm">
        <thead className="bg-[var(--surface-muted)] text-left text-[var(--text-muted)]">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={cn("px-4 py-3 font-semibold", col.className)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-[var(--border-subtle)] hover:bg-[var(--surface-muted)]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-[var(--text-primary)]">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BarcodeInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Scan or type barcode",
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  return (
    <input
      autoFocus
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSubmit();
        }
      }}
      placeholder={placeholder}
      className="h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-4 text-base font-medium text-[var(--text-primary)] outline-none focus:border-[var(--brand-secondary)] focus:ring-2 focus:ring-[var(--brand-secondary)]/20"
    />
  );
}
