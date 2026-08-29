"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  GripVertical,
  Printer,
  LayoutDashboard,
  Loader2,
  Palette,
  Package,
  Shield,
  ShoppingCart,
  Smartphone,
  Tags,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardCardChip } from "@/components/wizard/TemplateConfigChips";
import { MobileHeaderPreview } from "@/components/business/MobileHeaderPreview";
import { SoftwareRoleMatrix } from "@/components/business/SoftwareRoleMatrix";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { businessApi } from "@/hooks/useBusiness";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import {
  useCreateTemplateConfigMutation,
  useUpdateTemplateConfigMutation,
} from "@/hooks/useIndustryTemplate";
import {
  parseRoleAccess,
  softwareRoleKeysForIndustry,
  type RoleAccessMap,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import { resolveModuleDisplayLabel, syncLabelsFromNavigation } from "@/lib/resolve-module-display-label";
import {
  DEFAULT_MOBILE_HEADER_SETTINGS,
  parseMobileHeaderSettings,
  serializeMobileHeaderSettings,
  type MobileHeaderSettings,
} from "@/lib/mobile-header-settings";
import {
  serializeResolvedRoleAccess,
  normalizeRoleAccessForModules,
  mergeRoleAccessPreservingPortal,
  mobileRoleAccessView,
  resolveRoleEntry,
} from "@/lib/software-role-defaults";
import {
  parseCategoriesSettings,
  parseOrdersSettings,
  parseProductsSettings,
  parseSalesSettings,
  serializeCategoriesSettings,
  serializeOrdersSettings,
  serializeProductsSettings,
  serializeSalesSettings,
  type CategoriesModuleSettings,
  type OrdersModuleSettings,
  type ProductsModuleSettings,
  type SalesModuleSettings,
} from "@/lib/module-feature-settings";
import {
  getMobileReadiness,
  mobileReadinessLabel,
  MOBILE_DASHBOARD_CARDS,
  isSoftwareControlModule,
  softwareControlRoleModules,
  industryUsesMobileOrders,
  mobileModulesForIndustry,
  initialMobileEnabled,
  enableMobileModule,
  disableMobileModule,
  applyMobileModuleToggles,
  isMobileCapabilityModule,
} from "@/lib/software-supported-modules";
import { SoftwareModuleIcon } from "@/lib/software-module-icons";
import { normalizeErrorMessage } from "@/lib/utils";
import { isEmbeddedLogoData } from "@/lib/logo-upload";
import { resolveMediaUrl } from "@/lib/media-url";
import { syncNavigationToEnabledModules } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import { DASHBOARD_CARD_CATALOG, MODULE_CATALOG, ACCENT_COLORS, colorsFromAccent } from "@/templates/modules";
import type {
  AccentColor,
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";

type SoftwareControlContentProps = {
  businessId: string;
  businessName: string;
  templateConfig: ApiTemplateConfig | null | undefined;
  industryId: string;
};

export function SoftwareControlContent({
  businessId,
  businessName,
  templateConfig,
  industryId,
}: SoftwareControlContentProps) {
  const dispatch = useDispatch();
  const industry = getIndustryById(industryId);

  /** Flutter app modules for this industry — the only checklist in Software Control. */
  const mobileCatalog = useMemo<ModuleId[]>(
    () => mobileModulesForIndustry(industryId),
    [industryId],
  );

  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(() =>
    initialMobileEnabled(
      (templateConfig?.enabledModules ?? []) as ModuleId[],
      mobileModulesForIndustry(industryId),
      industryId,
    ),
  );
  const [roleAccess, setRoleAccess] = useState<RoleAccessMap>(() => {
    const modules = initialMobileEnabled(
      (templateConfig?.enabledModules ?? []) as ModuleId[],
      mobileModulesForIndustry(industryId),
      industryId,
    );
    return normalizeRoleAccessForModules(
      parseRoleAccess(templateConfig?.moduleSettings),
      modules,
      industryId,
    );
  });
  const [dashboardCards, setDashboardCards] = useState<DashboardCardId[]>(
    (templateConfig?.dashboardCards ?? industry?.dashboardCards ?? []) as DashboardCardId[],
  );
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(
    (templateConfig?.moduleSettings?.offlineSync?.enabled as boolean | undefined) ?? true,
  );
  const [primaryColor, setPrimaryColor] = useState(templateConfig?.primaryColor ?? "#001840");
  const [secondaryColor, setSecondaryColor] = useState(templateConfig?.secondaryColor ?? "#0050F8");
  const [themeMode, setThemeMode] = useState<ThemeMode>(templateConfig?.themeMode ?? "light");
  const [logoUrl, setLogoUrl] = useState<string | null>(templateConfig?.logoUrl ?? null);
  const [navigation, setNavigation] = useState<CustomizedTemplateConfig["navigation"]>(
    templateConfig?.navigation ?? [],
  );
  const [mobileHeader, setMobileHeader] = useState<MobileHeaderSettings>(() =>
    parseMobileHeaderSettings(templateConfig?.moduleSettings),
  );
  const [productsSettings, setProductsSettings] = useState<ProductsModuleSettings>(() =>
    parseProductsSettings(templateConfig?.moduleSettings),
  );
  const [ordersSettings, setOrdersSettings] = useState<OrdersModuleSettings>(() =>
    parseOrdersSettings(templateConfig?.moduleSettings, industryId),
  );
  const [categoriesSettings, setCategoriesSettings] = useState<CategoriesModuleSettings>(() =>
    parseCategoriesSettings(templateConfig?.moduleSettings),
  );
  const [salesSettings, setSalesSettings] = useState<SalesModuleSettings>(() =>
    parseSalesSettings(templateConfig?.moduleSettings),
  );
  const [expandedModule, setExpandedModule] = useState<string | null>("dashboard");
  const [dragModuleId, setDragModuleId] = useState<string | null>(null);

  const [updateConfig, { isLoading: savingUpdate }] = useUpdateTemplateConfigMutation();
  const [createConfig, { isLoading: savingCreate }] = useCreateTemplateConfigMutation();
  const saving = savingUpdate || savingCreate;

  useEffect(() => {
    const modules = initialMobileEnabled(
      (templateConfig?.enabledModules ?? []) as ModuleId[],
      mobileCatalog,
      industryId,
    );
    setEnabledModules(modules);
    setRoleAccess(
      normalizeRoleAccessForModules(
        parseRoleAccess(templateConfig?.moduleSettings),
        modules,
        industryId,
      ),
    );
    setDashboardCards((templateConfig?.dashboardCards ?? industry?.dashboardCards ?? []) as DashboardCardId[]);
    setOfflineSyncEnabled(
      (templateConfig?.moduleSettings?.offlineSync?.enabled as boolean | undefined) ?? true,
    );
    setPrimaryColor(templateConfig?.primaryColor ?? "#001840");
    setSecondaryColor(templateConfig?.secondaryColor ?? "#0050F8");
    setThemeMode(templateConfig?.themeMode ?? "light");
    setLogoUrl(templateConfig?.logoUrl ?? null);
    setNavigation(
      templateConfig?.navigation ??
        syncNavigationToEnabledModules(
          [],
          modules,
          templateConfig?.labels ?? industry?.labels ?? { product: "Product", products: "Products" },
          industryId,
        ),
    );
    setMobileHeader(parseMobileHeaderSettings(templateConfig?.moduleSettings));
    setProductsSettings(parseProductsSettings(templateConfig?.moduleSettings));
    setOrdersSettings(parseOrdersSettings(templateConfig?.moduleSettings, industryId));
    setCategoriesSettings(parseCategoriesSettings(templateConfig?.moduleSettings));
    setSalesSettings(parseSalesSettings(templateConfig?.moduleSettings));
  }, [templateConfig, industry?.labels, industryId, mobileCatalog]);

  const navItems = useMemo(
    () =>
      navigation.filter(
        (item) =>
          enabledModules.includes(item.moduleId as ModuleId) &&
          isSoftwareControlModule(item.moduleId) &&
          !isMobileCapabilityModule(item.moduleId),
      ),
    [navigation, enabledModules],
  );

  const navLabel = (moduleId: ModuleId) =>
    resolveModuleDisplayLabel(
      moduleId,
      navigation,
      templateConfig?.labels ?? industry?.labels,
    );

  const grantModuleToOwnerRoles = (
    prev: RoleAccessMap,
    moduleId: ModuleId,
    enabled: ModuleId[],
  ): RoleAccessMap => {
    const next = { ...normalizeRoleAccessForModules(prev, enabled, industryId) };
    const ownerRoles: SoftwareRoleKey[] = ["business_admin", "store_manager"];
    for (const role of ownerRoles) {
      if (!softwareRoleKeysForIndustry(industryId).includes(role)) continue;
      const entry = resolveRoleEntry(next, role, enabled);
      if (entry.modules.includes(moduleId)) {
        next[role] = entry;
        continue;
      }
      next[role] = {
        modules: [...entry.modules, moduleId],
        defaultModule: entry.defaultModule ?? moduleId,
      };
    }
    return next;
  };

  const toggleModule = (moduleId: ModuleId) => {
    const isOn = enabledModules.includes(moduleId);
    if (isOn) {
      if (moduleId === "dashboard") {
        toast.error("Dashboard stays available while other app modules are on.");
        return;
      }
      const next = disableMobileModule(moduleId, enabledModules, mobileCatalog);
      setEnabledModules(next);
      setRoleAccess((prev) => normalizeRoleAccessForModules(prev, next, industryId));
      return;
    }
    const next = enableMobileModule(moduleId, enabledModules, mobileCatalog);
    setEnabledModules(next);
    // Turning a module on also grants it to business admin / store manager so it
    // shows in the app immediately after save + refresh (role matrix still editable).
    setRoleAccess((prev) => grantModuleToOwnerRoles(prev, moduleId, next));
  };

  const reorderNav = (fromId: string, toId: string) => {
    setNavigation((prev) => {
      const fromIndex = prev.findIndex((item) => item.moduleId === fromId);
      const toIndex = prev.findIndex((item) => item.moduleId === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const toggleNavVisibility = (moduleId: string) => {
    setNavigation((prev) =>
      prev.map((item) =>
        item.moduleId === moduleId ? { ...item, visible: !item.visible } : item,
      ),
    );
  };

  const toggleDashboardCard = (cardId: DashboardCardId) => {
    setDashboardCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  };

  const hasProducts =
    enabledModules.includes("menu") || enabledModules.includes("products");
  const roleModules = useMemo(
    () =>
      softwareControlRoleModules(enabledModules, {
        includeCategories:
          mobileCatalog.includes("categories") &&
          (enabledModules.includes("categories") || hasProducts),
      }),
    [enabledModules, mobileCatalog, hasProducts],
  );
  const roleKeys = useMemo(() => softwareRoleKeysForIndustry(industryId), [industryId]);

  const handleRoleAccessChange = (mobileView: RoleAccessMap) => {
    setRoleAccess(mobileView);
  };

  const save = async () => {
    if (!industry) {
      toast.error("This business has no industry template to edit.");
      return;
    }

    const mergedEnabled = applyMobileModuleToggles(
      (templateConfig?.enabledModules ?? []) as ModuleId[],
      enabledModules,
      mobileCatalog,
    );
    const mergedRoleAccess = mergeRoleAccessPreservingPortal(
      parseRoleAccess(templateConfig?.moduleSettings),
      roleAccess,
      roleModules,
      mergedEnabled,
      industryId,
    );

    const syncedNavigation = syncNavigationToEnabledModules(
      navigation,
      mergedEnabled,
      templateConfig?.labels ?? industry.labels,
      industry.id,
    );

    const syncedLabels = syncLabelsFromNavigation(
      syncedNavigation,
      templateConfig?.labels ?? industry.labels,
    );

    const moduleSettings = {
      ...(templateConfig?.moduleSettings ?? {}),
      roleAccess: serializeResolvedRoleAccess(mergedEnabled, mergedRoleAccess, industryId),
      offlineSync: { enabled: offlineSyncEnabled, required: true },
      mobileHeader: serializeMobileHeaderSettings(mobileHeader),
      products: serializeProductsSettings(productsSettings),
      orders: serializeOrdersSettings(ordersSettings),
      categories: serializeCategoriesSettings(categoriesSettings),
      sales: serializeSalesSettings(salesSettings),
    };

    const payload = {
      businessName: templateConfig?.businessName ?? businessName,
      industryId: industry.id,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules: mergedEnabled,
      navigation: syncedNavigation,
      dashboardCards,
      labels: syncedLabels as IndustryTemplate["labels"],
      currency: templateConfig?.currency,
      location: templateConfig?.location,
      branchCount: templateConfig?.branchCount,
      ...(logoUrl && !isEmbeddedLogoData(logoUrl) ? { logoUrl } : {}),
      businessId,
      moduleSettings,
    };

    const toastId = toast.loading("Saving software control…");
    try {
      if (templateConfig?.id) {
        await updateConfig({ id: templateConfig.id, body: payload }).unwrap();
      } else {
        await createConfig(payload).unwrap();
      }
      dispatch(businessApi.util.invalidateTags([{ type: "Business", id: businessId }]));
      toast.success("Saved. Portal and Flutter app sync on next login or refresh.", { id: toastId });
    } catch (error) {
      toast.error(normalizeErrorMessage(error, "Could not save software control."), { id: toastId });
    }
  };

  if (!industry) {
    return (
      <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
        <p className="text-sm text-[#b45309]">
          Unknown industry template (<code>{industryId}</code>). Run setup or pick a valid industry first.
        </p>
      </section>
    );
  }

  const mobileDashboardCards = (
    Object.keys(DASHBOARD_CARD_CATALOG) as DashboardCardId[]
  ).filter((cardId) => MOBILE_DASHBOARD_CARDS.has(cardId));
  const softwareControlModules = mobileCatalog;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
        These are the <strong>mobile app screens</strong> DigiNizam Flutter ships (including{" "}
        <strong>Staff</strong> and <strong>Inventory</strong>). Turn a module on → it appears in the
        app for store managers after save + refresh. Turn it off → it hides. Role access below further
        limits cashiers and other staff roles.
      </div>

      {/* Modules */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">1. Mobile app modules</h2>
        </div>
        <p className="mb-4 text-sm text-[#64748b]">
          Check to enable. Drag items in section 5 (Navigation order) to control tab order.
          {industryUsesMobileOrders(industryId) ? (
            <>
              {" "}
              For retail / auto parts, <strong>Orders</strong> is the sell / POS tab on the phone.
            </>
          ) : null}
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {softwareControlModules.map((moduleId) => {
            const meta = MODULE_CATALOG[moduleId];
            const checked = enabledModules.includes(moduleId);
            const readiness = getMobileReadiness(moduleId);
            return (
              <label
                key={moduleId}
                className={`relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  checked
                    ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                    : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4"
                  checked={checked}
                  disabled={moduleId === "dashboard" && checked}
                  onChange={() => toggleModule(moduleId)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <SoftwareModuleIcon moduleId={moduleId} className="h-4 w-4 text-[var(--brand-secondary)]" />
                    <span className="text-sm font-semibold text-[#0f172a]">
                      {meta?.label ?? moduleId}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs text-[#64748b]">
                    {isMobileCapabilityModule(moduleId)
                      ? "Not a tab — tools inside Products / Orders"
                      : meta?.description ?? "Mobile app screen"}
                  </span>
                </span>
                <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#059669]">
                  {mobileReadinessLabel(readiness)}
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {/* Offline */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">2. Offline sync</h2>
        </div>
        <label className="mt-3 flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={offlineSyncEnabled}
            onChange={(event) => setOfflineSyncEnabled(event.target.checked)}
          />
          <span>
            <span className="block font-medium text-[#0f172a]">Allow offline operations</span>
            <span className="block text-sm text-[#64748b]">
              Orders queue locally on tablets, phones, and desktop — bulk-sync when online.
            </span>
          </span>
        </label>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">3. Theme</h2>
        </div>
        <p className="mb-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
          Logo and business name are edited in Additional details, so portal, website, and software
          all use the same identity.
        </p>
        <TemplateThemeFields
          themeMode={themeMode}
          onThemeModeChange={setThemeMode}
          primaryColor={primaryColor}
          onPrimaryColorChange={setPrimaryColor}
          secondaryColor={secondaryColor}
          onSecondaryColorChange={setSecondaryColor}
        />
        <div className="mt-4 flex flex-wrap gap-1.5">
          {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((key) => {
            const preset = ACCENT_COLORS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const palette = colorsFromAccent(key);
                  setPrimaryColor(palette.primary);
                  setSecondaryColor(palette.secondary);
                }}
                className="h-7 w-7 rounded-md border border-[#e2e8f0]"
                style={{ backgroundColor: preset.primary }}
                title={preset.label}
              />
            );
          })}
        </div>
      </section>

      {/* Mobile header — optional; when allowed, Flutter shows the branded navbar */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">4. Mobile app header</h2>
        </div>
        <p className="mb-4 text-sm text-[#64748b]">
          Optional. Allow this section to show the branded header (logo, logout, online badge) on the
          mobile app. Same control for portal admin and business workspace — saved config drives Flutter.
        </p>

        <label className="mb-4 flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4"
            checked={mobileHeader.enabled}
            onChange={(e) => setMobileHeader((p) => ({ ...p, enabled: e.target.checked }))}
          />
          <span>
            <span className="block font-medium text-[#0f172a]">Allow mobile app header</span>
            <span className="block text-sm text-[#64748b]">
              When on, the Flutter navbar uses these settings. When off, the branded header is hidden
              on mobile.
            </span>
          </span>
        </label>

        {mobileHeader.enabled ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
                <span className="font-medium">Show logout button</span>
                <input
                  type="checkbox"
                  checked={mobileHeader.showLogout}
                  onChange={(e) =>
                    setMobileHeader((p) => ({ ...p, showLogout: e.target.checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
                <span className="font-medium">Show online / offline badge</span>
                <input
                  type="checkbox"
                  checked={mobileHeader.showOnlineStatus}
                  onChange={(e) =>
                    setMobileHeader((p) => ({ ...p, showOnlineStatus: e.target.checked }))
                  }
                />
              </label>
              <div>
                <p className="mb-2 text-sm font-medium">Logo plate background</p>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: "White", value: "#FFFFFF" },
                    { label: "Light blue", value: "#EFF6FF" },
                    { label: "Soft gray", value: "#F8FAFC" },
                  ].map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() =>
                        setMobileHeader((p) => ({ ...p, logoBackgroundColor: preset.value }))
                      }
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        mobileHeader.logoBackgroundColor === preset.value
                          ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                          : "border-[#e2e8f0] text-[#64748b]"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={mobileHeader.logoBackgroundColor}
                    onChange={(e) =>
                      setMobileHeader((p) => ({ ...p, logoBackgroundColor: e.target.value }))
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-[#e2e8f0]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileHeader(DEFAULT_MOBILE_HEADER_SETTINGS)}
                className="text-xs font-semibold text-[var(--brand-secondary)]"
              >
                Reset header defaults
              </button>
            </div>
            <MobileHeaderPreview
              businessName={businessName}
              logoUrl={resolveMediaUrl(logoUrl)}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              enabled={mobileHeader.enabled}
              showLogout={mobileHeader.showLogout}
              showOnlineStatus={mobileHeader.showOnlineStatus}
              logoBackgroundColor={mobileHeader.logoBackgroundColor}
            />
          </div>
        ) : (
          <MobileHeaderPreview
            businessName={businessName}
            logoUrl={resolveMediaUrl(logoUrl)}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            enabled={false}
            showLogout={mobileHeader.showLogout}
            showOnlineStatus={mobileHeader.showOnlineStatus}
            logoBackgroundColor={mobileHeader.logoBackgroundColor}
          />
        )}
      </section>

      {/* Navigation */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#0f172a]">5. Mobile navigation</h2>
        <p className="mb-4 text-sm text-[#64748b]">
          Drag to reorder, rename tabs, toggle visibility. Applies to Flutter bottom nav.
        </p>
        <div className="space-y-2">
          {navItems.map((item) => (
            <div
              key={item.moduleId}
              draggable
              onDragStart={() => setDragModuleId(item.moduleId)}
              onDragEnd={() => setDragModuleId(null)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragModuleId) reorderNav(dragModuleId, item.moduleId);
                setDragModuleId(null);
              }}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                dragModuleId === item.moduleId
                  ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                  : "border-[#e2e8f0]"
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 text-[#94a3b8]" />
              <SoftwareModuleIcon moduleId={item.moduleId} className="h-4 w-4 shrink-0 text-[#64748b]" />
              <input
                type="text"
                className="portal-input h-9 min-w-0 flex-1 rounded-lg text-sm font-medium"
                value={item.label}
                onChange={(e) => {
                  const nextLabel = e.target.value;
                  setNavigation((prev) =>
                    prev.map((row) =>
                      row.moduleId === item.moduleId ? { ...row, label: nextLabel } : row,
                    ),
                  );
                }}
              />
              <span className="hidden text-xs text-[#94a3b8] sm:inline">{item.moduleId}</span>
              <label className="flex shrink-0 items-center gap-2 text-xs text-[#64748b]">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => toggleNavVisibility(item.moduleId)}
                />
                Visible
              </label>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">6. Role permissions (mobile app tabs)</h2>
        </div>
        <SoftwareRoleMatrix
          businessName={businessName}
          modules={roleModules}
          roleKeys={roleKeys}
          roleAccess={mobileRoleAccessView(roleAccess, roleModules, industryId)}
          onChange={handleRoleAccessChange}
          moduleLabel={navLabel}
          mobileOnly
        />
      </section>

      {/* Per-module settings */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#0f172a]">7. Module features (mobile app)</h2>
        <p className="mb-4 text-sm text-[#64748b]">
          Fine-tune each mobile module: dashboard stat cards, product permissions, orders screens
          (POS vs active queue), and category filters. Save at the bottom to push changes to Flutter.
        </p>
        <div className="space-y-2">
          {enabledModules.includes("dashboard") ? (
            <div className="rounded-lg border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() =>
                  setExpandedModule((m) => (m === "dashboard" ? null : "dashboard"))
                }
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
              >
                {expandedModule === "dashboard" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <LayoutDashboard className="h-4 w-4 text-[var(--brand-secondary)]" />
                Dashboard — stat cards (mobile)
              </button>
              {expandedModule === "dashboard" ? (
                <div className="border-t border-[#e2e8f0] p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {mobileDashboardCards.map((cardId) => (
                      <DashboardCardChip
                        key={cardId}
                        id={cardId}
                        checked={dashboardCards.includes(cardId)}
                        onToggle={() => toggleDashboardCard(cardId)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {enabledModules.includes("sales") ? (
            <div className="rounded-lg border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setExpandedModule((m) => (m === "sales" ? null : "sales"))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
              >
                {expandedModule === "sales" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <FileSpreadsheet className="h-4 w-4 text-[var(--brand-secondary)]" />
                Invoices / Sales
              </button>
              {expandedModule === "sales" ? (
                <div className="space-y-3 border-t border-[#e2e8f0] p-4">
                  <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={salesSettings.allowExport}
                      onChange={(event) =>
                        setSalesSettings((prev) => ({
                          ...prev,
                          allowExport: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
                        <Download className="h-3.5 w-3.5" />
                        Allow Excel export
                      </span>
                      <span className="mt-0.5 block text-xs text-[#64748b]">
                        Staff can download the invoice list as Excel from Invoices. Turn this off to hide the
                        button on mobile, desktop, and the staff portal.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={salesSettings.allowPrinter}
                      onChange={(event) =>
                        setSalesSettings((prev) => ({
                          ...prev,
                          allowPrinter: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-medium text-[#0f172a]">
                        <Printer className="h-3.5 w-3.5" />
                        Allow printer access
                      </span>
                      <span className="mt-0.5 block text-xs text-[#64748b]">
                        Staff can connect a printer and print invoices from Invoices, Orders, and the mobile
                        app. Turn this off to disable printing; staff will be asked to contact an
                        administrator.
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {hasProducts ? (
            <div className="rounded-lg border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setExpandedModule((m) => (m === "products" ? null : "products"))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
              >
                {expandedModule === "products" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Package className="h-4 w-4 text-[var(--brand-secondary)]" />
                Products / Menu
              </button>
              {expandedModule === "products" ? (
                <div className="space-y-3 border-t border-[#e2e8f0] p-4">
                  <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm">
                    <span>Allow adding products</span>
                    <input
                      type="checkbox"
                      checked={productsSettings.allowCreate}
                      onChange={(e) =>
                        setProductsSettings((p) => ({ ...p, allowCreate: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2 text-sm">
                    <span>Allow editing products</span>
                    <input
                      type="checkbox"
                      checked={productsSettings.allowEdit}
                      onChange={(e) =>
                        setProductsSettings((p) => ({ ...p, allowEdit: e.target.checked }))
                      }
                    />
                  </label>
                  <div>
                    <p className="mb-2 text-sm font-medium">Product layout</p>
                    <div className="flex gap-2">
                      {(["grid", "list"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setProductsSettings((p) => ({ ...p, viewMode: mode }))}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize ${
                            productsSettings.viewMode === mode
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] text-[#64748b]"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {enabledModules.includes("orders") ? (
            <div className="rounded-lg border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() => setExpandedModule((m) => (m === "orders" ? null : "orders"))}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
              >
                {expandedModule === "orders" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <ShoppingCart className="h-4 w-4 text-[var(--brand-secondary)]" />
                Orders
                <span className="ml-auto hidden text-xs font-normal text-[#64748b] sm:inline">
                  {ordersSettings.showNewOrders && ordersSettings.showActiveOrders
                    ? "POS + Active queue"
                    : ordersSettings.showNewOrders
                      ? "POS only"
                      : ordersSettings.showActiveOrders
                        ? "Active queue only"
                        : "No screens"}
                </span>
              </button>

              <div className="space-y-3 border-t border-[#e2e8f0] px-4 py-3">
                <p className="text-sm font-medium text-[#0f172a]">Orders screens on mobile</p>
                <p className="text-xs text-[#64748b]">
                  Control what store staff see in the Orders tab. For retail and auto parts, turn off{" "}
                  <strong>Active orders queue</strong> and keep <strong>New order / POS</strong> on.
                </p>
                <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={ordersSettings.showNewOrders}
                    onChange={(event) =>
                      setOrdersSettings((prev) => ({
                        ...prev,
                        showNewOrders: event.target.checked,
                        defaultSection:
                          !event.target.checked && prev.defaultSection === "new"
                            ? "active"
                            : prev.defaultSection,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#0f172a]">
                      New order / POS screen
                    </span>
                    <span className="block text-xs text-[#64748b]">
                      Product picker and cart for taking a sale.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={ordersSettings.showActiveOrders}
                    onChange={(event) =>
                      setOrdersSettings((prev) => ({
                        ...prev,
                        showActiveOrders: event.target.checked,
                        defaultSection:
                          !event.target.checked && prev.defaultSection === "active"
                            ? "new"
                            : prev.defaultSection,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#0f172a]">
                      Active orders queue
                    </span>
                    <span className="block text-xs text-[#64748b]">
                      Live order list with status updates (restaurant). Off for sell-and-done retail.
                    </span>
                  </span>
                </label>
                {ordersSettings.showActiveOrders && ordersSettings.showNewOrders ? (
                  <div>
                    <p className="mb-2 text-xs font-medium text-[#64748b]">Default screen</p>
                    <div className="flex gap-2">
                      {(
                        [
                          { id: "active" as const, label: "Active orders" },
                          { id: "new" as const, label: "New order (POS)" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setOrdersSettings((prev) => ({
                              ...prev,
                              defaultSection: option.id,
                            }))
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                            ordersSettings.defaultSection === option.id
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] text-[#64748b]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {expandedModule === "orders" ? (
                <div className="space-y-5 border-t border-[#e2e8f0] p-4">
                  <div>
                    <p className="mb-2 text-sm font-medium">Orders layout</p>
                    <div className="flex gap-2">
                      {(["list", "grid"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setOrdersSettings((prev) => ({ ...prev, viewType: option }))}
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize ${
                            ordersSettings.viewType === option
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] text-[#64748b]"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={ordersSettings.allowProductScopeSwitch}
                      onChange={(event) =>
                        setOrdersSettings((prev) => ({
                          ...prev,
                          allowProductScopeSwitch: event.target.checked,
                        }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#0f172a]">
                        All products / Active products switch
                      </span>
                      <span className="block text-xs text-[#64748b]">
                        Lets staff toggle between the full catalog and active-only items on the order grid.
                      </span>
                    </span>
                  </label>

                  <div>
                    <p className="mb-2 text-sm font-medium">Default product list</p>
                    <div className="flex gap-2">
                      {(
                        [
                          { id: "activeOnly", label: "Active only" },
                          { id: "all", label: "All products" },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setOrdersSettings((prev) => ({ ...prev, productScopeDefault: option.id }))
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                            ordersSettings.productScopeDefault === option.id
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                              : "border-[#e2e8f0] text-[#64748b]"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium">Order completion</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          {
                            id: "restaurantLifecycle" as const,
                            title: "Full order lifecycle",
                            body: "Place order → active / kitchen → complete (restaurant).",
                          },
                          {
                            id: "orderOnly" as const,
                            title: "Order only",
                            body: "Select products → cart → complete immediately (retail-style).",
                          },
                        ] as const
                      ).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            setOrdersSettings((prev) => ({ ...prev, completionMode: option.id }))
                          }
                          className={`rounded-lg border p-3 text-left ${
                            ordersSettings.completionMode === option.id
                              ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)]"
                              : "border-[#e2e8f0] bg-white"
                          }`}
                        >
                          <span className="block text-sm font-semibold text-[#0f172a]">{option.title}</span>
                          <span className="mt-1 block text-xs text-[#64748b]">{option.body}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {enabledModules.includes("categories") ? (
            <div className="rounded-lg border border-[#e2e8f0]">
              <button
                type="button"
                onClick={() =>
                  setExpandedModule((m) => (m === "categories" ? null : "categories"))
                }
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
              >
                {expandedModule === "categories" ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <Tags className="h-4 w-4 text-[var(--brand-secondary)]" />
                Categories — mobile capability
              </button>
              {expandedModule === "categories" ? (
                <div className="space-y-3 border-t border-[#e2e8f0] p-4">
                  <p className="text-xs text-[#64748b]">
                    Not a Flutter tab. When enabled for a role, category tools appear inside Products /
                    Orders. Disable the module or uncheck the role to hide them.
                  </p>
                  <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={categoriesSettings.allowManage}
                      onChange={(e) =>
                        setCategoriesSettings((p) => ({ ...p, allowManage: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#0f172a]">
                        Allow adding / editing categories
                      </span>
                      <span className="block text-xs text-[#64748b]">
                        When on, staff with Categories access can create, edit, and delete categories
                        inside Products / Orders on mobile. When off, they can only view / filter.
                      </span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4"
                      checked={categoriesSettings.showFilters}
                      onChange={(e) =>
                        setCategoriesSettings((p) => ({ ...p, showFilters: e.target.checked }))
                      }
                    />
                    <span>
                      <span className="block text-sm font-medium text-[#0f172a]">
                        Show category filter chips
                      </span>
                      <span className="block text-xs text-[#64748b]">
                        Filter chips on Products and Orders screens.
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="sticky bottom-4 z-10 flex justify-end rounded-xl border border-[#e2e8f0] bg-white/95 p-4 shadow-lg backdrop-blur">
        <button type="button" onClick={() => void save()} disabled={saving} className="dn-btn dn-btn-primary min-w-[10rem]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save software control
        </button>
      </div>
    </div>
  );
}
