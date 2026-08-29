"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, RotateCw, Smartphone, Tablet } from "lucide-react";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { parseMobileHeaderSettings } from "@/lib/mobile-header-settings";
import {
  parseCategoriesSettings,
  parseOrdersSettings,
  parseProductsSettings,
} from "@/lib/module-feature-settings";
import {
  parseRoleAccess,
  roleKeyLabel,
  softwareRoleKeysForIndustry,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import { resolveRoleEntry } from "@/lib/software-role-defaults";
import { isSoftwareSupportedModule } from "@/lib/software-supported-modules";
import { SoftwareModuleIcon } from "@/lib/software-module-icons";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";
import { resolveMediaUrl } from "@/lib/media-url";
import { cn } from "@/lib/utils";

type SoftwareMobilePreviewProps = {
  businessName: string;
  templateConfig: ApiTemplateConfig;
};

/** Matches Flutter MediaQuery tiers used across diginizam-flutter. */
type PreviewDevice = "phone" | "tablet" | "desktop";
type PreviewOrientation = "portrait" | "landscape";

const DEVICE_SIZES: Record<
  PreviewDevice,
  { portrait: { w: number; h: number }; landscape: { w: number; h: number }; label: string }
> = {
  // Flutter: mobile < 600
  phone: { portrait: { w: 390, h: 780 }, landscape: { w: 780, h: 390 }, label: "Phone" },
  // Flutter: tablet 600–1023
  tablet: { portrait: { w: 768, h: 1024 }, landscape: { w: 1024, h: 720 }, label: "Tablet" },
  // Flutter: desktop ≥ 1024 (app often runs landscape)
  desktop: { portrait: { w: 1100, h: 720 }, landscape: { w: 1280, h: 800 }, label: "Desktop" },
};

export function SoftwareMobilePreview({
  businessName,
  templateConfig,
}: SoftwareMobilePreviewProps) {
  const [previewRole, setPreviewRole] = useState<SoftwareRoleKey>("business_admin");
  const [activeTab, setActiveTab] = useState(0);
  const [device, setDevice] = useState<PreviewDevice>("phone");
  const [orientation, setOrientation] = useState<PreviewOrientation>("portrait");
  const [scale, setScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);

  const roleKeys = useMemo(
    () => softwareRoleKeysForIndustry(templateConfig.industryId),
    [templateConfig.industryId],
  );

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
    return (templateConfig.navigation ?? []).filter(
      (item) =>
        item.visible &&
        enabled.has(item.moduleId as ModuleId) &&
        allowedModules.has(item.moduleId as ModuleId) &&
        isSoftwareSupportedModule(item.moduleId),
    );
  }, [templateConfig.navigation, enabled, allowedModules]);

  useEffect(() => {
    setActiveTab(0);
  }, [previewRole, device]);

  // Desktop preview stays landscape-oriented (matches Flutter landscape lock for POS).
  useEffect(() => {
    if (device === "desktop") setOrientation("landscape");
  }, [device]);

  const dashboardCards = templateConfig.dashboardCards ?? [];
  const primary = templateConfig.primaryColor ?? "#001840";
  const secondary = templateConfig.secondaryColor ?? "#0050F8";
  const mobileHeader = parseMobileHeaderSettings(templateConfig.moduleSettings);
  const productsSettings = parseProductsSettings(templateConfig.moduleSettings);
  const ordersSettings = parseOrdersSettings(templateConfig.moduleSettings);

  const activeItem = navItems[activeTab] ?? navItems[0];
  const activeModuleId = activeItem?.moduleId ?? "dashboard";

  const frame = DEVICE_SIZES[device][orientation];
  const isCompactNav = device === "phone" || (device === "tablet" && orientation === "landscape");
  const isWideContent = device === "desktop" || orientation === "landscape";
  const productCols =
    productsSettings.viewMode === "grid"
      ? device === "desktop"
        ? 4
        : device === "tablet"
          ? 3
          : 2
      : 1;
  const orderCols =
    ordersSettings.viewType === "grid"
      ? device === "desktop"
        ? 3
        : 2
      : 1;
  const dashCols = device === "desktop" ? 4 : device === "tablet" ? 3 : 2;

  const canRotate = device === "phone" || device === "tablet";

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const updateScale = () => {
      const pad = 24;
      const available = Math.max(node.clientWidth - pad, 200);
      setScale(Math.min(1, available / frame.w));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(node);
    return () => observer.disconnect();
  }, [frame.w, frame.h, device, orientation]);

  return (
    <div className="flex flex-col items-stretch gap-6 xl:flex-row xl:items-start xl:justify-center">
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3">
        {/* Device + orientation toolbar (Flutter DevicePreview-style) */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {(
            [
              { id: "phone" as const, icon: Smartphone, label: "Phone" },
              { id: "tablet" as const, icon: Tablet, label: "Tablet" },
              { id: "desktop" as const, icon: Monitor, label: "Desktop" },
            ] as const
          ).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setDevice(id)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold",
                device === id
                  ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                  : "border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <button
            type="button"
            disabled={!canRotate}
            onClick={() =>
              setOrientation((o) => (o === "portrait" ? "landscape" : "portrait"))
            }
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold",
              canRotate
                ? "border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
                : "cursor-not-allowed border-[#f1f5f9] text-[#cbd5e1]",
            )}
            title={
              canRotate
                ? "Rotate (same idea as Flutter device preview)"
                : "Desktop preview stays landscape"
            }
          >
            <RotateCw className="h-3.5 w-3.5" />
            Rotate
          </button>
          <span className="text-[11px] text-[#94a3b8]">
            {DEVICE_SIZES[device].label} · {orientation} · {frame.w}×{frame.h}
            {scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
            <span className="hidden sm:inline">
              {" "}
              (Flutter: &lt;600 / 600–1023 / ≥1024)
            </span>
          </span>
        </div>

        {/* Scaled device chrome */}
        <div
          ref={viewportRef}
          className="flex w-full max-w-full justify-center overflow-hidden pb-2"
          style={{ height: Math.max(frame.h * scale + 8, 200) }}
        >
          <div
            style={{
              width: frame.w * scale,
              height: frame.h * scale,
            }}
          >
            <div
              className={cn(
                "relative overflow-hidden bg-white shadow-2xl origin-top-left",
                device === "phone" && "rounded-[2rem] border-[10px] border-[#0f172a]",
                device === "tablet" && "rounded-[1.25rem] border-[8px] border-[#1e293b]",
                device === "desktop" && "rounded-xl border border-[#cbd5e1]",
              )}
              style={{
                width: frame.w,
                height: frame.h,
                transform: `scale(${scale})`,
              }}
            >
            {device === "desktop" ? (
              <div className="flex h-7 items-center gap-1.5 border-b border-[#e2e8f0] bg-[#f1f5f9] px-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                <span className="ml-3 truncate text-[10px] text-[#94a3b8]">
                  DigiNizam · {businessName}
                </span>
              </div>
            ) : null}

            {/* Header */}
            {mobileHeader.enabled ? (
              <div
                className={cn("px-3 pb-2", device === "desktop" ? "pt-3" : "pt-8")}
                style={{
                  background: `linear-gradient(135deg, ${primary}, ${secondary})`,
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-9 max-w-[110px] items-center justify-center rounded-lg border border-white/80 px-2 shadow"
                    style={{ backgroundColor: mobileHeader.logoBackgroundColor }}
                  >
                    {templateConfig.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveMediaUrl(templateConfig.logoUrl) ?? undefined}
                        alt=""
                        className="max-h-6 w-auto max-w-[96px] object-contain"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-[#94a3b8]">LOGO</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{businessName}</p>
                    <p className="truncate text-[10px] text-white/80">
                      {activeItem?.label ?? "Home"}
                    </p>
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
            ) : (
              <div
                className={cn(
                  "border-b border-[#e2e8f0] bg-[#f8fafc] px-3 pb-2",
                  device === "desktop" ? "pt-3" : "pt-8",
                )}
              >
                <p className="text-center text-[10px] font-medium text-[#94a3b8]">
                  Header off (Control → Mobile app header)
                </p>
              </div>
            )}

            {/* Body */}
            <div
              className="space-y-3 overflow-auto p-3"
              style={{
                height:
                  frame.h -
                  (device === "desktop" ? 28 : 0) -
                  (mobileHeader.enabled ? 72 : 40) -
                  56,
              }}
            >
              {navItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#94a3b8]">
                  No tabs for {roleKeyLabel(previewRole)}
                </p>
              ) : activeModuleId === "dashboard" ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#94a3b8]">
                    Dashboard cards
                    {isWideContent ? " · wide layout" : ""}
                  </p>
                  <div
                    className="grid gap-2"
                    style={{ gridTemplateColumns: `repeat(${dashCols}, minmax(0, 1fr))` }}
                  >
                    {(dashboardCards.length ? dashboardCards : ["active-orders", "today-sales"])
                      .slice(0, device === "desktop" ? 8 : 6)
                      .map((cardId) => (
                        <div
                          key={cardId}
                          className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2 text-center"
                        >
                          <p className="text-[9px] font-medium uppercase text-[#94a3b8]">
                            {DASHBOARD_CARD_CATALOG[cardId as keyof typeof DASHBOARD_CARD_CATALOG]
                              ?.label ?? cardId}
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
                    {` · ${productCols} col`}
                  </p>
                  <div
                    className={
                      productsSettings.viewMode === "grid" ? "grid gap-2" : "space-y-2"
                    }
                    style={
                      productsSettings.viewMode === "grid"
                        ? { gridTemplateColumns: `repeat(${productCols}, minmax(0, 1fr))` }
                        : undefined
                    }
                  >
                    {[1, 2, 3, 4, 5, 6].slice(0, productCols * 2).map((n) => (
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
                    {` · ${orderCols} col`}
                  </p>
                  <div
                    className={ordersSettings.viewType === "grid" ? "grid gap-2" : "space-y-2"}
                    style={
                      ordersSettings.viewType === "grid"
                        ? { gridTemplateColumns: `repeat(${orderCols}, minmax(0, 1fr))` }
                        : undefined
                    }
                  >
                    {[1, 2, 3, 4].slice(0, orderCols * 2).map((n) => (
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
                  <SoftwareModuleIcon
                    moduleId={activeModuleId}
                    className="mb-2 h-8 w-8 text-[#94a3b8]"
                  />
                  <p className="text-sm font-semibold text-[#0f172a]">{activeItem?.label}</p>
                  <p className="text-xs text-[#94a3b8]">{activeModuleId} screen</p>
                </div>
              )}
            </div>

            {/* Bottom nav — compact on phone / tablet landscape */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-[#e2e8f0] bg-white px-0.5 py-1.5">
              <div className="flex overflow-x-auto">
                {navItems.map((item, index) => (
                  <button
                    key={item.moduleId}
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-0.5 px-0.5 py-0.5",
                      isCompactNav ? "min-w-[48px]" : "min-w-[64px]",
                    )}
                    style={{ color: index === activeTab ? secondary : "#94a3b8" }}
                  >
                    <SoftwareModuleIcon
                      moduleId={item.moduleId}
                      className={isCompactNav ? "h-4 w-4" : "h-5 w-5"}
                    />
                    {!isCompactNav || device !== "phone" || orientation === "portrait" ? (
                      <span
                        className={cn(
                          "truncate font-medium",
                          isCompactNav ? "max-w-[48px] text-[8px]" : "max-w-[72px] text-[10px]",
                        )}
                      >
                        {item.label}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-full max-w-md shrink-0 space-y-4 text-sm text-[#64748b]">
        <p>
          Live preview for <strong>{businessName}</strong> — same module/role rules as
          Flutter. Device sizes follow Flutter breakpoints (&lt;600 phone, 600–1023
          tablet, ≥1024 desktop). This is a web schematic of chrome + layout density, not
          an embedded Flutter build.
        </p>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#94a3b8]">
            Preview as role
          </p>
          <div className="flex flex-wrap gap-2">
            {roleKeys.map((role) => (
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
                {roleKeyLabel(role)}
              </button>
            ))}
          </div>
        </div>

        <ul className="list-inside list-disc space-y-1">
          <li>
            {navItems.length} tab(s) for {roleKeyLabel(previewRole)}
          </li>
          <li>{dashboardCards.length} dashboard card(s)</li>
          <li>Theme: {templateConfig.themeMode ?? "light"}</li>
          <li>
            Offline sync:{" "}
            {(templateConfig.moduleSettings?.offlineSync?.enabled as boolean) !== false
              ? "On"
              : "Off"}
          </li>
          <li>Mobile header: {mobileHeader.enabled ? "On" : "Off"}</li>
          <li>
            Categories:{" "}
            {enabled.has("categories")
              ? parseCategoriesSettings(templateConfig.moduleSettings).allowManage
                ? "Manage on"
                : "Manage off"
              : "Module off"}
            {enabled.has("categories")
              ? parseCategoriesSettings(templateConfig.moduleSettings).showFilters
                ? " · Filters on"
                : " · Filters off"
              : ""}
          </li>
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
