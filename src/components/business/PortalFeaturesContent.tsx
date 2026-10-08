"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
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
import { toast } from "sonner";
import { businessApi } from "@/hooks/useBusiness";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { useUpdateTemplateConfigMutation } from "@/hooks/useIndustryTemplate";
import { parseRoleAccess } from "@/lib/role-access";
import { syncLabelsFromNavigation } from "@/lib/resolve-module-display-label";
import {
  normalizeRoleAccessForModules,
  serializeResolvedRoleAccess,
} from "@/lib/software-role-defaults";
import { appendBusinessId, getModuleHref } from "@/lib/module-routes";
import { normalizeErrorMessage } from "@/lib/utils";
import { syncNavigationToEnabledModules } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import { MODULE_CATALOG } from "@/templates/modules";
import {
  canDisableModule,
  getLockReason,
  getLockedModules,
  moduleLabel,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
import type { IndustryTemplate, ModuleId } from "@/templates/types";

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

const CATEGORY_ORDER = [
  "Core",
  "Sales",
  "Catalog",
  "Inventory",
  "Pharmacy",
  "Food",
  "CRM",
  "People",
  "Insights",
  "Finance",
  "Other",
];

const SHELL: ModuleId[] = ["dashboard", "settings"];

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
  const dispatch = useDispatch();
  const industry = getIndustryById(industryId);

  /** Catalog from entitlements (above). Until saved once, all industry modules. */
  const availableModules = useMemo<ModuleId[]>(() => {
    if (!industry) return [];
    const industryModules = Array.from(
      new Set([...industry.modules, ...(industry.optionalModules ?? [])]),
    ) as ModuleId[];
    const entitled = templateConfig?.entitledModules as ModuleId[] | null | undefined;
    if (entitled?.length) {
      const entitledSet = new Set([...SHELL, ...entitled]);
      return industryModules.filter((id) => entitledSet.has(id));
    }
    return industryModules;
  }, [industry, templateConfig?.entitledModules]);

  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(() => {
    const availableSet = new Set(availableModules);
    const saved = ((templateConfig?.enabledModules ?? []) as ModuleId[]).filter((id) =>
      availableSet.has(id),
    );
    if (saved.length) return saved;
    return availableModules.length ? availableModules : (["dashboard"] as ModuleId[]);
  });

  const [updateConfig, { isLoading: saving }] = useUpdateTemplateConfigMutation();

  const configSyncKey = [
    templateConfig?.id ?? "",
    templateConfig?.updatedAt ?? "",
    industryId,
    (templateConfig?.entitledModules ?? []).join(","),
    availableModules.join(","),
  ].join("|");

  useEffect(() => {
    const availableSet = new Set(availableModules);
    const saved = ((templateConfig?.enabledModules ?? []) as ModuleId[]).filter((id) =>
      availableSet.has(id),
    );
    if (saved.length) {
      setEnabledModules(saved);
      return;
    }
    if (availableModules.length) {
      setEnabledModules(availableModules);
    }
    // Hydrate from saved template / entitlements, not every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configSyncKey]);

  const lockedModules = useMemo(
    () =>
      industry
        ? getLockedModules(industry.id, enabledModules, availableModules)
        : new Set<ModuleId>(),
    [industry, enabledModules, availableModules],
  );

  const grouped = useMemo(() => {
    return availableModules.reduce<Record<string, ModuleId[]>>((acc, moduleId) => {
      const category = MODULE_CATALOG[moduleId]?.category ?? "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(moduleId);
      return acc;
    }, {});
  }, [availableModules]);

  const sortedCategories = useMemo(
    () => [
      ...CATEGORY_ORDER.filter((category) => grouped[category]?.length),
      ...Object.keys(grouped).filter((category) => !CATEGORY_ORDER.includes(category)),
    ],
    [grouped],
  );

  const toggleModule = (moduleId: ModuleId) => {
    if (!industry) return;
    const isOn = enabledModules.includes(moduleId);

    if (isOn) {
      const check = canDisableModule(industry.id, moduleId, enabledModules, availableModules);
      if (!check.ok) {
        toast.error(check.reason ?? "This module cannot be disabled.");
        return;
      }
      const { next, removed } = withDependentsDisabled(
        industry.id,
        moduleId,
        enabledModules,
        availableModules,
      );
      setEnabledModules(next);
      if (removed.length > 1) {
        toast.message(
          `Also disabled: ${removed
            .filter((id) => id !== moduleId)
            .map(moduleLabel)
            .join(", ")}`,
        );
      }
      return;
    }

    const next = withDependenciesEnabled(
      industry.id,
      moduleId,
      enabledModules,
      availableModules,
    );
    const added = next.filter((id) => !enabledModules.includes(id) && id !== moduleId);
    setEnabledModules(next);
    if (added.length) {
      toast.message(`Also enabled: ${added.map(moduleLabel).join(", ")}`);
    }
  };

  const openModule = (moduleId: ModuleId) => {
    const href = appendBusinessId(getModuleHref(moduleId, industryId), businessId);
    window.open(`${window.location.origin}${href}`, "_blank", "noopener,noreferrer");
  };

  const save = async () => {
    if (!industry || !templateConfig?.id) {
      toast.error("This business has no industry template to edit.");
      return;
    }

    const availableSet = new Set(availableModules);
    const clippedEnabled = enabledModules.filter((id) => availableSet.has(id));
    for (const shell of SHELL) {
      if (availableSet.has(shell) && !clippedEnabled.includes(shell)) {
        clippedEnabled.push(shell);
      }
    }

    const labels = (templateConfig.labels ?? industry.labels) as IndustryTemplate["labels"];
    const syncedNavigation = syncNavigationToEnabledModules(
      templateConfig.navigation,
      clippedEnabled,
      labels,
      industry.id,
    );
    const syncedLabels = syncLabelsFromNavigation(syncedNavigation, labels);
    const roleAccess = normalizeRoleAccessForModules(
      parseRoleAccess(templateConfig.moduleSettings),
      clippedEnabled,
      industry.id,
    );

    const payload = {
      businessName: templateConfig.businessName ?? businessName,
      industryId: industry.id,
      primaryColor: templateConfig.primaryColor,
      secondaryColor: templateConfig.secondaryColor,
      themeMode: templateConfig.themeMode,
      enabledModules: clippedEnabled,
      navigation: syncedNavigation,
      dashboardCards: templateConfig.dashboardCards,
      labels: syncedLabels as IndustryTemplate["labels"],
      currency: templateConfig.currency,
      location: templateConfig.location,
      branchCount: templateConfig.branchCount,
      ...(templateConfig.logoUrl ? { logoUrl: templateConfig.logoUrl } : {}),
      businessId,
      moduleSettings: {
        ...(templateConfig.moduleSettings ?? {}),
        roleAccess: serializeResolvedRoleAccess(clippedEnabled, roleAccess, industry.id),
      },
    };

    const toastId = toast.loading("Saving portal features…");
    try {
      await updateConfig({ id: templateConfig.id, body: payload }).unwrap();
      dispatch(
        businessApi.util.invalidateTags([
          { type: "Business", id: businessId },
          { type: "Business", id: "LIST" },
        ]),
      );
      toast.success("Saved. Web portal sidebar updates on next refresh.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save portal features."), {
        id: toastId,
      });
    }
  };

  if (!industry) {
    return (
      <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
        <p className="text-sm text-[#b45309]">
          Unknown industry template (<code>{industryId}</code>). Run setup or pick a valid industry
          first.
        </p>
      </section>
    );
  }

  if (!templateConfig?.id) {
    return (
      <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
        <p className="text-sm text-[#b45309]">
          No workspace template yet. Finish business setup first, then configure portal features
          here.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
      <div className="mb-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">2. Portal features</h2>
          <p className="mt-1 text-sm text-[#64748b]">
            Enable or disable the modules from the catalog above for {businessName}&apos;s web
            portal. Mobile tabs stay under Software &amp; Mobile → Control.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="dn-btn dn-btn-primary shrink-0"
        >
          {saving ? "Saving…" : "Save portal features"}
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
        {templateConfig.entitledModules?.length
          ? "Only modules saved in the catalog above are listed here. Toggle on → sidebar shows it after save. Toggle off → hides it."
          : "Save the catalog above first to limit this list. Until then, all industry modules are shown. Toggle on/off controls the web portal sidebar."}
      </div>

      <p className="mb-4 text-xs font-medium text-[#64748b]">
        {enabledModules.length} of {availableModules.length} features enabled
      </p>

      <div className="space-y-5">
        {sortedCategories.map((category) => (
          <div key={category}>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#94a3b8]">
              {category}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[category].map((moduleId) => {
                const catalog = MODULE_CATALOG[moduleId];
                const Icon = MODULE_ICONS[moduleId] ?? LayoutDashboard;
                const label = moduleLabel(moduleId);
                const description = catalog?.description ?? "Web portal module";
                const checked = enabledModules.includes(moduleId);
                const locked = checked && lockedModules.has(moduleId);
                const lockReason = locked
                  ? getLockReason(industry.id, moduleId, enabledModules, availableModules)
                  : null;

                return (
                  <div
                    key={moduleId}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      checked
                        ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                        : "border-[#e8edf3] bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                          checked
                            ? "bg-white text-[var(--brand-secondary)]"
                            : "bg-[var(--app-bg)] text-[#64748b]"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-[#0f172a]">{label}</p>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
                            disabled={!!locked}
                            title={lockReason ?? (checked ? "Disable feature" : "Enable feature")}
                            onClick={() => toggleModule(moduleId)}
                            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                              locked
                                ? "cursor-not-allowed bg-[#94a3b8] opacity-70"
                                : checked
                                  ? "bg-[var(--brand-secondary)]"
                                  : "bg-[#cbd5e1]"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                                checked ? "left-5" : "left-0.5"
                              }`}
                            />
                          </button>
                        </div>
                        <p className="mt-1 text-sm text-[#64748b]">{description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              locked
                                ? "bg-[#f1f5f9] text-[#64748b]"
                                : checked
                                  ? "bg-[#ecfdf5] text-[#059669]"
                                  : "bg-[#f1f5f9] text-[#94a3b8]"
                            }`}
                          >
                            {locked ? "Always on" : checked ? "Enabled" : "Disabled"}
                          </span>
                          {checked ? (
                            <button
                              type="button"
                              onClick={() => openModule(moduleId)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-secondary)]"
                            >
                              Open <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end border-t border-[#e2e8f0] pt-4">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="dn-btn dn-btn-primary"
        >
          {saving ? "Saving…" : "Save portal features"}
        </button>
      </div>
    </section>
  );
}
