"use client";

import {
  ArrowRight,
  BarChart3,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { appendBusinessId, getModuleHref } from "@/lib/module-routes";
import { MODULE_CATALOG } from "@/templates/modules";
import { moduleLabel } from "@/templates/module-dependencies";
import type { ModuleId } from "@/templates/types";

const MODULE_ICONS: Partial<Record<ModuleId, LucideIcon>> = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  products: Package,
  inventory: Boxes,
  orders: ShoppingCart,
  sales: BarChart3,
  staff: Users,
  settings: Settings,
};

type PortalFeaturesContentProps = {
  businessId: string;
  businessName: string;
  templateConfig: ApiTemplateConfig | null | undefined;
  industryId: string;
};

export function PortalFeaturesContent({
  businessId,
  businessName,
  templateConfig,
  industryId,
}: PortalFeaturesContentProps) {
  const enabledModules = (templateConfig?.enabledModules ?? []) as ModuleId[];
  const modules = enabledModules.length > 0 ? enabledModules : (["dashboard"] as ModuleId[]);

  const openModule = (moduleId: ModuleId) => {
    const href = appendBusinessId(getModuleHref(moduleId, industryId), businessId);
    window.open(`${window.location.origin}${href}`, "_blank", "noopener,noreferrer");
  };

  const grouped = modules.reduce<Record<string, ModuleId[]>>((acc, moduleId) => {
    const category = MODULE_CATALOG[moduleId]?.category ?? "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(moduleId);
    return acc;
  }, {});

  const categoryOrder = ["Core", "Sales", "Catalog", "Inventory", "Pharmacy", "Food", "CRM", "People", "Insights", "Finance", "Other"];
  const sortedCategories = [
    ...categoryOrder.filter((category) => grouped[category]?.length),
    ...Object.keys(grouped).filter((category) => !categoryOrder.includes(category)),
  ];

  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold text-[#475569]">Portal features</h2>
      <p className="mb-4 text-sm text-[#64748b]">
        Open any enabled tool for {businessName}. Each opens in the live portal.
      </p>
      <div className="space-y-5">
        {sortedCategories.map((category) => (
          <div key={category}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">{category}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map((moduleId) => {
                const catalog = MODULE_CATALOG[moduleId];
                const Icon = MODULE_ICONS[moduleId] ?? LayoutDashboard;
                const label = moduleLabel(moduleId);
                const description = catalog?.description ?? "Open in portal";

                return (
                  <button
                    key={moduleId}
                    type="button"
                    onClick={() => openModule(moduleId)}
                    className="group rounded-xl border-2 border-[#e8edf3] bg-white p-4 text-left transition-all hover:border-[var(--brand-secondary)] hover:shadow-[0_4px_16px_rgba(0,80,248,0.08)]"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-bg)] text-[#64748b] group-hover:bg-[var(--brand-primary-soft)] group-hover:text-[var(--brand-secondary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 font-semibold text-[#0f172a]">{label}</p>
                    <p className="mt-1 text-sm text-[#64748b]">{description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-secondary)]">
                      Open <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
