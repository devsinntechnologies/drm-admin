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
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useUpdateTemplateConfigMutation, type ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { businessApi } from "@/hooks/useBusiness";
import { useAppDispatch } from "@/lib/hooks";
import { parseRoleAccess, serializeRoleAccess } from "@/lib/role-access";
import { normalizeRoleAccessForModules } from "@/lib/software-role-defaults";
import { appendBusinessId, getModuleHref } from "@/lib/module-routes";
import { syncNavigationToEnabledModules } from "@/template-engine/builder";
import { MODULE_CATALOG } from "@/templates/modules";
import {
  canDisableModule,
  moduleLabel,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
import { getIndustryById } from "@/templates/industries";
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
  const dispatch = useAppDispatch();
  const [updateTemplateConfig, { isLoading: saving }] = useUpdateTemplateConfigMutation();
  const industry = getIndustryById(industryId);
  const availableModules = useMemo(() => {
    if (!industry) return [] as ModuleId[];
    return Array.from(new Set([...industry.modules, ...(industry.optionalModules ?? [])])) as ModuleId[];
  }, [industry]);
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(
    () => (templateConfig?.enabledModules ?? []) as ModuleId[],
  );

  const dirty = useMemo(() => {
    const saved = new Set(templateConfig?.enabledModules ?? []);
    return saved.size !== enabledModules.length || enabledModules.some((id) => !saved.has(id));
  }, [enabledModules, templateConfig?.enabledModules]);

  const toggleModule = (moduleId: ModuleId) => {
    if (enabledModules.includes(moduleId)) {
      const check = canDisableModule(industryId, moduleId, enabledModules, availableModules);
      if (!check.ok) {
        toast.error(check.reason ?? "This module cannot be disabled.");
        return;
      }
      const { next, removed } = withDependentsDisabled(industryId, moduleId, enabledModules, availableModules);
      setEnabledModules(next);
      if (removed.length > 1) {
        toast.info(`Also disabled: ${removed.filter((id) => id !== moduleId).map(moduleLabel).join(", ")}`);
      }
      return;
    }
    const next = withDependenciesEnabled(industryId, moduleId, enabledModules, availableModules);
    setEnabledModules(next);
  };

  const save = async () => {
    if (!templateConfig?.id) return;
    const navigation = syncNavigationToEnabledModules(
      templateConfig.navigation,
      enabledModules,
      templateConfig.labels,
      industryId,
    );
    const roleAccess = serializeRoleAccess(
      normalizeRoleAccessForModules(
        parseRoleAccess(templateConfig.moduleSettings),
        enabledModules,
        industryId,
      ),
    );
    const moduleSettings = {
      ...(templateConfig.moduleSettings ?? {}),
      roleAccess,
    };
    const toastId = toast.loading("Saving portal features...");
    try {
      await updateTemplateConfig({
        id: templateConfig.id,
        body: { enabledModules, navigation, moduleSettings },
      }).unwrap();
      dispatch(businessApi.util.invalidateTags([
        { type: "Business", id: businessId },
        { type: "Business", id: "LIST" },
      ]));
      toast.success("Portal features saved and synced.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save portal features.", { id: toastId });
    }
  };

  const openModule = (moduleId: ModuleId) => {
    const href = appendBusinessId(getModuleHref(moduleId, industryId), businessId);
    window.open(`${window.location.origin}${href}`, "_blank", "noopener,noreferrer");
  };

  const grouped = availableModules.reduce<Record<string, ModuleId[]>>((acc, moduleId) => {
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
        Choose the portal modules available to {businessName}. Dependencies are applied automatically;
        role permissions still determine which enabled modules each login can see.
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
                const enabled = enabledModules.includes(moduleId);

                return (
                  <div key={moduleId} className={`group rounded-xl border-2 bg-white p-4 transition-all ${enabled ? "border-[var(--brand-secondary)]" : "border-[#e8edf3] opacity-75"}`}>
                    <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--app-bg)] text-[#64748b] group-hover:bg-[var(--brand-primary-soft)] group-hover:text-[var(--brand-secondary)]">
                      <Icon className="h-5 w-5" />
                    </span>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#475569]">
                        <input type="checkbox" checked={enabled} onChange={() => toggleModule(moduleId)} className="h-4 w-4" />
                        {enabled ? "Enabled" : "Disabled"}
                      </label>
                    </div>
                    <p className="mt-3 font-semibold text-[#0f172a]">{label}</p>
                    <p className="mt-1 text-sm text-[#64748b]">{description}</p>
                    {enabled ? (
                      <button type="button" onClick={() => openModule(moduleId)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-secondary)]">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="sticky bottom-4 mt-5 flex items-center justify-end gap-3 rounded-xl border border-[#e2e8f0] bg-white/95 p-3 shadow-lg backdrop-blur">
        <span className="mr-auto text-xs text-[#64748b]">{enabledModules.length} module(s) enabled</span>
        <button type="button" disabled={!dirty || saving} onClick={() => setEnabledModules((templateConfig?.enabledModules ?? []) as ModuleId[])} className="dn-btn dn-btn-outline">
          Reset
        </button>
        <button type="button" disabled={!dirty || saving} onClick={() => void save()} className="dn-btn dn-btn-primary">
          {saving ? "Saving..." : "Save features"}
        </button>
      </div>
    </section>
  );
}
