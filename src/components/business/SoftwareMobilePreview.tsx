"use client";

import { useMemo, useState } from "react";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { parseMobileHeaderSettings } from "@/lib/mobile-header-settings";
import { parseOrdersSettings, parseProductsSettings } from "@/lib/module-feature-settings";
import { parseRoleAccess, SOFTWARE_ROLE_KEYS, SOFTWARE_ROLE_LABELS, type SoftwareRoleKey } from "@/lib/role-access";
import { resolveRoleEntry } from "@/lib/software-role-defaults";
import { isSoftwareSupportedModule } from "@/lib/software-supported-modules";
import { SoftwareModuleIcon } from "@/lib/software-module-icons";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";

type SoftwareMobilePreviewProps = {
  businessName: string;
  templateConfig: ApiTemplateConfig;
};

export function SoftwareMobilePreview({ businessName, templateConfig }: SoftwareMobilePreviewProps) {
  const [previewRole, setPreviewRole] = useState<SoftwareRoleKey>("business_admin");
  const [activeTab, setActiveTab] = useState(0);

  const enabled = useMemo(
    () => new Set(templateConfig.enabledModules ?? []),
    [templateConfig.enabledModules],
  );

  const roleAccess = useMemo(
    () => parseRoleAccess(templateConfig.moduleSettings),
    [templateConfig.moduleSettings],
  );

  const allowedModules = useMemo(() => {
    const entry = resolveRoleEntry(
      roleAccess,
      previewRole,
      (templateConfig.enabledModules ?? []) as ModuleId[],
    );
    return new Set(entry.modules ?? []);
  }, [roleAccess, previewRole, templateConfig.enabledModules]);

  const navItems = useMemo(() => {
    return (templateConfig.navigation ?? [])
      .filter(
        (item) =>
          item.visible &&
          enabled.has(item.moduleId as ModuleId) &&
          allowedModules.has(item.moduleId as ModuleId) &&
          isSoftwareSupportedModule(item.moduleId),
      );
  }, [templateConfig.navigation, enabled, allowedModules]);

  const dashboardCards = templateConfig.dashboardCards ?? [];
  const primary = templateConfig.primaryColor ?? "#001840";
  const secondary = templateConfig.secondaryColor ?? "#0050F8";
  const mobileHeader = parseMobileHeaderSettings(templateConfig.moduleSettings);
  const productsSettings = parseProductsSettings(templateConfig.moduleSettings);
  const ordersSettings = parseOrdersSettings(templateConfig.moduleSettings);

  const activeItem = navItems[activeTab] ?? navItems[0];
  const activeModuleId = activeItem?.moduleId ?? "dashboard";

  return (
    <div className="flex flex-col items-start gap-6 xl:flex-row xl:items-start xl:justify-center">
      <div
        className="relative w-[300px] shrink-0 overflow-hidden rounded-[2rem] border-[10px] border-[#0f172a] bg-white shadow-2xl"
        style={{ minHeight: 600 }}
      >
        {/* Header */}
        <div
          className="px-3 pb-2 pt-8"
          style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex h-9 max-w-[110px] items-center justify-center rounded-lg border border-white/80 px-2 shadow"
              style={{ backgroundColor: mobileHeader.logoBackgroundColor }}
            >
              {templateConfig.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={templateConfig.logoUrl}
                  alt=""
                  className="max-h-6 w-auto max-w-[96px] object-contain"
                />
              ) : (
                <span className="text-[9px] font-bold text-[#94a3b8]">LOGO</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{businessName}</p>
              <p className="truncate text-[10px] text-white/80">{activeItem?.label ?? "Home"}</p>
            </div>
            {mobileHeader.showLogout ? (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold text-white">
                Logout
              </span>
            ) : null}
          </div>
          {mobileHeader.showOnlineStatus ? (
            <p className="mt-1.5 text-[9px] font-bold text-emerald-200">● ONLINE</p>
          ) : null}
        </div>

        {/* Body */}
        <div className="space-y-3 p-3" style={{ minHeight: 400 }}>
          {navItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#94a3b8]">
              No tabs for {SOFTWARE_ROLE_LABELS[previewRole]}
            </p>
          ) : activeModuleId === "dashboard" ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">
                Dashboard cards
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(dashboardCards.length ? dashboardCards : ["active-orders", "today-sales"])
                  .slice(0, 6)
                  .map((cardId) => (
                    <div
                      key={cardId}
                      className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2 text-center"
                    >
                      <p className="text-[9px] font-medium uppercase text-[#94a3b8]">
                        {DASHBOARD_CARD_CATALOG[cardId as keyof typeof DASHBOARD_CARD_CATALOG]?.label ??
                          cardId}
                      </p>
                      <p className="text-sm font-bold text-[#0f172a]">—</p>
                    </div>
                  ))}
              </div>
            </>
          ) : activeModuleId === "menu" || activeModuleId === "products" ? (
            <>
              <p className="text-[10px] font-bold uppercase text-[#94a3b8]">Products</p>
              <p className="text-xs text-[#64748b]">
                Layout: <strong>{productsSettings.viewMode}</strong>
                {productsSettings.allowCreate ? " · Add enabled" : " · Add disabled"}
              </p>
              <div
                className={
                  productsSettings.viewMode === "grid"
                    ? "grid grid-cols-2 gap-2"
                    : "space-y-2"
                }
              >
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2 text-center text-xs text-[#64748b]"
                  >
                    Product {n}
                  </div>
                ))}
              </div>
            </>
          ) : activeModuleId === "orders" ? (
            <>
              <p className="text-[10px] font-bold uppercase text-[#94a3b8]">Orders</p>
              <p className="text-xs text-[#64748b]">
                View: <strong>{ordersSettings.viewType}</strong>
              </p>
              <div
                className={
                  ordersSettings.viewType === "grid"
                    ? "grid grid-cols-2 gap-2"
                    : "space-y-2"
                }
              >
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 text-xs text-[#64748b]"
                  >
                    Order #{n}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-[#e2e8f0] text-center">
              <SoftwareModuleIcon moduleId={activeModuleId} className="mb-2 h-8 w-8 text-[#94a3b8]" />
              <p className="text-sm font-semibold text-[#0f172a]">{activeItem?.label}</p>
              <p className="text-xs text-[#94a3b8]">{activeModuleId} screen</p>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-[#e2e8f0] bg-white px-0.5 py-1.5">
          <div className="flex overflow-x-auto">
            {navItems.map((item, index) => (
              <button
                key={item.moduleId}
                type="button"
                onClick={() => setActiveTab(index)}
                className="flex min-w-[56px] flex-1 flex-col items-center gap-0.5 px-0.5 py-0.5"
                style={{ color: index === activeTab ? secondary : "#94a3b8" }}
              >
                <SoftwareModuleIcon moduleId={item.moduleId} className="h-4 w-4" />
                <span className="max-w-[54px] truncate text-[8px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full max-w-md space-y-4 text-sm text-[#64748b]">
        <p>
          Live preview for <strong>{businessName}</strong> — tap tabs to see each module layout.
        </p>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#94a3b8]">
            Preview as role
          </p>
          <div className="flex flex-wrap gap-2">
            {SOFTWARE_ROLE_KEYS.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setPreviewRole(role);
                  setActiveTab(0);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  previewRole === role
                    ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                    : "border-[#e2e8f0] text-[#64748b]"
                }`}
              >
                {SOFTWARE_ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        <ul className="list-inside list-disc space-y-1">
          <li>{navItems.length} tab(s) for {SOFTWARE_ROLE_LABELS[previewRole]}</li>
          <li>{dashboardCards.length} dashboard card(s)</li>
          <li>Theme: {templateConfig.themeMode ?? "light"}</li>
          <li>Offline sync: {(templateConfig.moduleSettings?.offlineSync?.enabled as boolean) !== false ? "On" : "Off"}</li>
        </ul>

        {navItems.map((item) => (
          <div
            key={item.moduleId}
            className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2"
          >
            <span className="flex items-center gap-2 font-medium text-[#0f172a]">
              <SoftwareModuleIcon moduleId={item.moduleId} className="h-4 w-4 text-[#64748b]" />
              {item.label}
            </span>
            <span className="text-xs text-[#94a3b8]">{item.moduleId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
