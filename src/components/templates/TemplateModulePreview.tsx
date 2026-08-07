"use client";

import { Package, ShoppingCart } from "lucide-react";
import {
  getKitchenColumns,
  getModuleMockRows,
  getModuleMockStats,
  getModuleMockView,
  getSettingsFields,
  getTableTiles,
} from "@/template-engine/module-mock-data";
import { getMockProducts } from "@/template-engine/mock-data";
import type { CustomizedTemplateConfig } from "@/templates/types";
import { cn } from "@/lib/utils";

type TemplateModulePreviewProps = {
  moduleId: string;
  moduleLabel: string;
  config: Pick<
    CustomizedTemplateConfig,
    "currency" | "labels" | "industryId" | "businessName" | "themeMode"
  >;
  primaryColor: string;
  secondaryColor: string;
  compact?: boolean;
};

export function TemplateModulePreview({
  moduleId,
  moduleLabel,
  config,
  primaryColor,
  secondaryColor,
  compact = false,
}: TemplateModulePreviewProps) {
  const dark = config.themeMode === "dark";
  const view = getModuleMockView(moduleId);
  const stats = getModuleMockStats(moduleId, config.currency);
  const rows = getModuleMockRows(moduleId, config);
  const products = view === "pos" ? getMockProducts(config as CustomizedTemplateConfig) : [];

  return (
    <div className={cn(compact ? "space-y-3" : "mx-auto max-w-[1440px] space-y-6")}>
      <ModuleHeader
        title={moduleLabel}
        subtitle={`Sample ${moduleLabel.toLowerCase()} data for template preview`}
        dark={dark}
        compact={compact}
      />

      <div className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-1 gap-4 sm:grid-cols-3")}>
        {stats.map((stat) => (
          <article
            key={stat.label}
            className={cn(
              "rounded-xl border bg-white",
              compact ? "p-2.5" : "p-4",
              dark ? "border-white/10 bg-white/5" : "border-[#e2e8f0]",
            )}
          >
            <p className={cn("font-semibold uppercase tracking-wider text-[#94a3b8]", compact ? "text-[9px]" : "text-xs")}>
              {stat.label}
            </p>
            <p
              className={cn("font-bold", compact ? "mt-0.5 text-sm" : "mt-1 text-2xl")}
              style={{ color: dark ? "#f8fafc" : primaryColor }}
            >
              {stat.value}
            </p>
          </article>
        ))}
      </div>

      {view === "pos" && (
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "gap-4 lg:grid-cols-[1.2fr_0.8fr]")}>
          <div className={cn("grid gap-2", compact ? "grid-cols-2" : "sm:grid-cols-2")}>
            {products.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-xl border bg-white",
                  compact ? "p-2.5" : "p-4",
                  dark ? "border-white/10 bg-white/5" : "border-[#e2e8f0]",
                )}
              >
                <p className={cn("uppercase tracking-wider text-[#94a3b8]", compact ? "text-[8px]" : "text-xs")}>
                  {config.labels.product}
                </p>
                <p className={cn("font-semibold text-[#0f172a]", compact ? "mt-1 text-[11px]" : "mt-2")}>{item.name}</p>
                <p className={cn("font-bold", compact ? "mt-1 text-xs" : "mt-3 text-lg")} style={{ color: secondaryColor }}>
                  {item.price}
                </p>
              </div>
            ))}
          </div>
          <aside className={cn("rounded-xl border bg-white", compact ? "p-3" : "p-5", dark ? "border-white/10" : "border-[#e2e8f0]")}>
            <p className={cn("font-semibold", compact ? "text-xs" : "text-base")}>Current ticket</p>
            {products.slice(0, 2).map((item) => (
              <div key={item.id} className={cn("flex justify-between", compact ? "mt-2 text-[10px]" : "mt-3 text-sm")}>
                <span>{item.name}</span>
                <span className="font-semibold">{item.price}</span>
              </div>
            ))}
            <button
              type="button"
              className={cn("mt-3 w-full rounded-lg font-semibold text-white", compact ? "py-1.5 text-[10px]" : "py-3 text-sm")}
              style={{ backgroundColor: primaryColor }}
            >
              Charge {config.currency} 3,140
            </button>
          </aside>
        </div>
      )}

      {view === "kitchen" && (
        <div className={cn("grid gap-3", compact ? "grid-cols-3" : "md:grid-cols-3")}>
          {getKitchenColumns().map((col) => (
            <div
              key={col.title}
              className={cn("rounded-xl border bg-white", compact ? "p-2" : "p-4", dark ? "border-white/10" : "border-[#e2e8f0]")}
            >
              <p className={cn("font-semibold", compact ? "text-[10px]" : "text-sm")} style={{ color: secondaryColor }}>
                {col.title}
              </p>
              <ul className={cn("mt-2 space-y-1", compact ? "text-[9px]" : "text-sm")}>
                {col.items.map((item) => (
                  <li key={item} className="rounded-md bg-[#f8fafc] px-2 py-1 text-[#334155]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {view === "tables" && (
        <div className={cn("grid gap-2", compact ? "grid-cols-3" : "sm:grid-cols-3 lg:grid-cols-6")}>
          {getTableTiles().map((table) => (
            <div
              key={table.label}
              className={cn(
                "rounded-xl border p-3 text-center",
                table.status === "Occupied" && "text-white",
                table.status === "Free" && "bg-white",
                table.status === "Reserved" && "bg-[#fffbeb]",
                compact && "p-2",
              )}
              style={
                table.status === "Occupied"
                  ? { backgroundColor: primaryColor, borderColor: `${secondaryColor}55` }
                  : { borderColor: "#e2e8f0" }
              }
            >
              <p className={cn("font-bold", compact ? "text-sm" : "text-lg")}>{table.label}</p>
              <p className={cn(compact ? "text-[9px]" : "text-xs")}>{table.seats} seats</p>
              <p className={cn("mt-1 font-medium", compact ? "text-[9px]" : "text-xs")}>{table.status}</p>
            </div>
          ))}
        </div>
      )}

      {view === "settings" && (
        <div className={cn("rounded-xl border bg-white", compact ? "p-3" : "p-5", dark ? "border-white/10" : "border-[#e2e8f0]")}>
          <div className={cn("grid gap-3", compact ? "grid-cols-1" : "md:grid-cols-2")}>
            {getSettingsFields().map((field) => (
              <label key={field.label} className="block space-y-1">
                <span className={cn("font-semibold text-[#64748b]", compact ? "text-[10px]" : "text-sm")}>{field.label}</span>
                <div className={cn("rounded-lg border border-[#e2e8f0] bg-[#f8fafc] text-[#0f172a]", compact ? "px-2 py-1.5 text-[10px]" : "px-3 py-2 text-sm")}>
                  {field.label === "Business display name" ? config.businessName : field.value}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {view !== "pos" && view !== "kitchen" && view !== "tables" && view !== "settings" && (
        <MockTable rows={rows} dark={dark} accent={secondaryColor} compact={compact} />
      )}
    </div>
  );
}

function ModuleHeader({
  title,
  subtitle,
  dark,
  compact,
}: {
  title: string;
  subtitle: string;
  dark: boolean;
  compact: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={cn("grid place-items-center rounded-lg bg-[#eef3ff] text-[#0050F8]", compact ? "h-8 w-8" : "h-10 w-10")}>
        {title.toLowerCase().includes("pos") ? (
          <ShoppingCart className={compact ? "h-4 w-4" : "h-5 w-5"} />
        ) : (
          <Package className={compact ? "h-4 w-4" : "h-5 w-5"} />
        )}
      </div>
      <div>
        <h1 className={cn("font-semibold text-[#0f172a]", compact ? "text-sm" : "text-2xl", dark && "text-white")}>
          {title}
        </h1>
        <p className={cn("text-[#64748b]", compact ? "text-[10px]" : "text-sm", dark && "text-white/60")}>{subtitle}</p>
      </div>
    </div>
  );
}

function MockTable({
  rows,
  dark,
  accent,
  compact,
}: {
  rows: Record<string, string | number>[];
  dark: boolean;
  accent: string;
  compact: boolean;
}) {
  if (!rows.length) return null;
  const columns = Object.keys(rows[0]);

  return (
    <div className={cn("overflow-hidden rounded-xl border", dark ? "border-white/10 bg-white/5" : "border-[#e2e8f0] bg-white")}>
      <table className="w-full text-left">
        <thead className={cn(dark ? "bg-white/5 text-white/50" : "bg-[#f8fafc] text-[#64748b]")}>
          <tr>
            {columns.map((col) => (
              <th key={col} className={cn("font-semibold capitalize", compact ? "px-2 py-1.5 text-[9px]" : "px-4 py-3 text-sm")}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={cn("border-t", dark ? "border-white/10" : "border-[#edf2f7]")}>
              {columns.map((col, colIndex) => (
                <td
                  key={col}
                  className={cn(
                    compact ? "px-2 py-1.5 text-[10px]" : "px-4 py-3 text-sm",
                    colIndex === columns.length - 1 && "font-semibold",
                  )}
                  style={colIndex === columns.length - 1 ? { color: accent } : undefined}
                >
                  {row[col]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
