"use client";

import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  Palette,
  Package,
  Shield,
  ShoppingCart,
  Smartphone,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ModuleChip } from "@/components/wizard/TemplateConfigChips";
import { DashboardCardChip } from "@/components/wizard/TemplateConfigChips";
import { MobileHeaderPreview } from "@/components/business/MobileHeaderPreview";
import { SoftwareRoleMatrix } from "@/components/business/SoftwareRoleMatrix";
import { TemplateThemeFields } from "@/components/wizard/TemplateThemeFields";
import { businessApi } from "@/hooks/useBusiness";
import { useAuth } from "@/hooks/useAuth";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import {
  useCreateTemplateConfigMutation,
  useUpdateTemplateConfigMutation,
} from "@/hooks/useIndustryTemplate";
import { parseRoleAccess, type RoleAccessMap } from "@/lib/role-access";
import { resolveModuleDisplayLabel, syncLabelsFromNavigation } from "@/lib/resolve-module-display-label";
import { readLogoAsDataUrl, validateLogoFile } from "@/lib/logo-upload";
import {
  DEFAULT_MOBILE_HEADER_SETTINGS,
  parseMobileHeaderSettings,
  serializeMobileHeaderSettings,
  type MobileHeaderSettings,
} from "@/lib/mobile-header-settings";
import {
  DEFAULT_PRODUCTS_SETTINGS,
  parseOrdersSettings,
  parseProductsSettings,
  serializeOrdersSettings,
  serializeProductsSettings,
  type OrdersModuleSettings,
  type ProductsModuleSettings,
} from "@/lib/module-feature-settings";
import { serializeResolvedRoleAccess } from "@/lib/software-role-defaults";
import { isSoftwareSupportedModule } from "@/lib/software-supported-modules";
import { SoftwareModuleIcon } from "@/lib/software-module-icons";
import { normalizeErrorMessage } from "@/lib/utils";
import { syncNavigationToEnabledModules } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import { ACCENT_COLORS, colorsFromAccent } from "@/templates/modules";
import {
  canDisableModule,
  getLockReason,
  getLockedModules,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
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

function ModulePlatformBadge({ moduleId, enabled }: { moduleId: ModuleId; enabled: boolean }) {
  if (!enabled) return null;
  const onMobile = isSoftwareSupportedModule(moduleId);
  return (
    <span className="absolute right-2 top-2 flex gap-1">
      <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold uppercase text-[#1d4ed8]">
        Portal
      </span>
      {onMobile ? (
        <span className="rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[10px] font-bold uppercase text-[#059669]">
          Mobile
        </span>
      ) : null}
    </span>
  );
}

export function SoftwareControlContent({
  businessId,
  businessName,
  templateConfig,
  industryId,
}: SoftwareControlContentProps) {
  const dispatch = useDispatch();
  const { role } = useAuth();
  const canChangeIndustry = role === "super_admin";
  const industry = getIndustryById(industryId);

  const industryAvailableModules = useMemo<ModuleId[]>(() => {
    if (!industry) return [];
    return Array.from(new Set([...industry.modules, ...(industry.optionalModules ?? [])]));
  }, [industry]);

  const entitledModules = templateConfig?.entitledModules;
  const availableModules = useMemo<ModuleId[]>(() => {
    if (canChangeIndustry || !entitledModules) return industryAvailableModules;
    const entitledSet = new Set(entitledModules);
    return industryAvailableModules.filter((id) => entitledSet.has(id));
  }, [industryAvailableModules, entitledModules, canChangeIndustry]);

  const [enabledModules, setEnabledModules] = useState<ModuleId[]>(
    (templateConfig?.enabledModules ?? industry?.modules ?? []) as ModuleId[],
  );
  const [roleAccess, setRoleAccess] = useState<RoleAccessMap>(() =>
    parseRoleAccess(templateConfig?.moduleSettings),
  );
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
    parseOrdersSettings(templateConfig?.moduleSettings),
  );
  const [expandedModule, setExpandedModule] = useState<string | null>("dashboard");
  const [dragModuleId, setDragModuleId] = useState<string | null>(null);

  const [updateConfig, { isLoading: savingUpdate }] = useUpdateTemplateConfigMutation();
  const [createConfig, { isLoading: savingCreate }] = useCreateTemplateConfigMutation();
  const saving = savingUpdate || savingCreate;

  useEffect(() => {
    const modules = (templateConfig?.enabledModules ?? industry?.modules ?? []) as ModuleId[];
    setEnabledModules(modules);
    setRoleAccess(parseRoleAccess(templateConfig?.moduleSettings));
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
    setOrdersSettings(parseOrdersSettings(templateConfig?.moduleSettings));
  }, [templateConfig, industry?.modules, industry?.dashboardCards, industry?.labels, industryId]);

  const locked = useMemo(
    () => getLockedModules(industry?.id ?? "", enabledModules, availableModules),
    [industry?.id, enabledModules, availableModules],
  );

  const navItems = useMemo(
    () =>
      navigation.filter((item) => enabledModules.includes(item.moduleId as ModuleId)),
    [navigation, enabledModules],
  );

  const navLabel = (moduleId: ModuleId) =>
    resolveModuleDisplayLabel(
      moduleId,
      navigation,
      templateConfig?.labels ?? industry?.labels,
    );

  const toggleModule = (moduleId: ModuleId) => {
    if (!industry) return;
    const isOn = enabledModules.includes(moduleId);
    if (isOn) {
      const check = canDisableModule(industry.id, moduleId, enabledModules, availableModules);
      if (!check.ok) {
        toast.error(check.reason ?? "This module cannot be disabled");
        return;
      }
      const { next, removed } = withDependentsDisabled(
        industry.id,
        moduleId,
        enabledModules,
        availableModules,
      );
      const related = removed.filter((id) => id !== moduleId);
      if (related.length) toast.message(`Also turned off: ${related.join(", ")}`);
      setEnabledModules(next);
      return;
    }
    const next = withDependenciesEnabled(industry.id, moduleId, enabledModules, availableModules);
    const added = next.filter((id) => !enabledModules.includes(id) && id !== moduleId);
    if (added.length) toast.message(`Also enabled: ${added.join(", ")}`);
    setEnabledModules(next);
  };

  const handleLogoUpload = (file?: File | null) => {
    if (!file) return;
    const error = validateLogoFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    void readLogoAsDataUrl(file).then(setLogoUrl);
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

  const save = async () => {
    if (!industry) {
      toast.error("This business has no industry template to edit.");
      return;
    }

    const syncedNavigation = syncNavigationToEnabledModules(
      navigation,
      enabledModules,
      templateConfig?.labels ?? industry.labels,
      industry.id,
    );

    const syncedLabels = syncLabelsFromNavigation(
      syncedNavigation,
      templateConfig?.labels ?? industry.labels,
    );

    const moduleSettings = {
      ...(templateConfig?.moduleSettings ?? {}),
      roleAccess: serializeResolvedRoleAccess(enabledModules, roleAccess),
      offlineSync: { enabled: offlineSyncEnabled, required: true },
      mobileHeader: serializeMobileHeaderSettings(mobileHeader),
      products: serializeProductsSettings(productsSettings),
      orders: serializeOrdersSettings(ordersSettings),
    };

    const payload = {
      businessName: templateConfig?.businessName ?? businessName,
      industryId: industry.id,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules,
      navigation: syncedNavigation,
      dashboardCards,
      labels: syncedLabels as IndustryTemplate["labels"],
      currency: templateConfig?.currency,
      location: templateConfig?.location,
      branchCount: templateConfig?.branchCount,
      logoUrl: logoUrl || "",
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

  const industryCards = industry.dashboardCards as DashboardCardId[];
  const hasProducts =
    enabledModules.includes("menu") || enabledModules.includes("products");

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
        <strong>Complete software control.</strong> Modules work on portal and mobile — badges show where
        each module is available today. Nothing is blocked; mobile screens appear as they are built.
      </div>

      {/* Modules */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="text-base font-semibold text-[#0f172a]">1. Business modules</h2>
        </div>
        <p className="mb-4 text-sm text-[#64748b]">
          Enable features for {businessName}. All modules work on the portal; mobile badges show which
          also have a Flutter screen today.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          {availableModules.map((moduleId) => (
            <div key={moduleId} className="relative">
              <ModuleChip
                id={moduleId}
                checked={enabledModules.includes(moduleId)}
                locked={locked.has(moduleId)}
                lockReason={getLockReason(industry.id, moduleId, enabledModules, availableModules)}
                industryId={industry.id}
                onToggle={() => toggleModule(moduleId)}
              />
              <ModulePlatformBadge moduleId={moduleId} enabled={enabledModules.includes(moduleId)} />
            </div>
          ))}
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
          <h2 className="text-base font-semibold text-[#0f172a]">3. Theme & logo</h2>
        </div>
        <div className="mb-5 flex flex-wrap items-start gap-4 rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] p-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xs font-bold text-[#94a3b8]">Logo</span>
            )}
          </div>
          <div className="min-w-[220px] flex-1">
            <p className="text-sm font-semibold text-[#0f172a]">Business logo</p>
            <p className="mt-1 text-xs text-[#64748b]">
              Wide PNG/JPG recommended (transparent background). Shown on a white plate in the mobile navbar.
            </p>
            <div className="mt-2 flex gap-2">
              <label className="dn-btn dn-btn-outline inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3 text-xs">
                <ImagePlus className="h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => handleLogoUpload(event.target.files?.[0])}
                />
              </label>
              {logoUrl ? (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold text-[#dc2626]"
                >
                  <X className="mr-1 inline h-3.5 w-3.5" /> Remove
                </button>
              ) : null}
            </div>
          </div>
        </div>
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

      {/* Mobile header */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#0f172a]">4. Mobile app header</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
              <span className="font-medium">Show logout button</span>
              <input
                type="checkbox"
                checked={mobileHeader.showLogout}
                onChange={(e) => setMobileHeader((p) => ({ ...p, showLogout: e.target.checked }))}
              />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
              <span className="font-medium">Show online / offline badge</span>
              <input
                type="checkbox"
                checked={mobileHeader.showOnlineStatus}
                onChange={(e) => setMobileHeader((p) => ({ ...p, showOnlineStatus: e.target.checked }))}
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
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            showLogout={mobileHeader.showLogout}
            showOnlineStatus={mobileHeader.showOnlineStatus}
            logoBackgroundColor={mobileHeader.logoBackgroundColor}
          />
        </div>
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
              {!isSoftwareSupportedModule(item.moduleId) ? (
                <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-bold text-[#b45309]">
                  Portal
                </span>
              ) : null}
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
          <h2 className="text-base font-semibold text-[#0f172a]">6. Role permissions</h2>
        </div>
        <SoftwareRoleMatrix
          businessName={businessName}
          mobileModules={enabledModules}
          roleAccess={roleAccess}
          onChange={setRoleAccess}
          moduleLabel={navLabel}
        />
      </section>

      {/* Per-module settings */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-1 text-base font-semibold text-[#0f172a]">7. Module features</h2>
        <p className="mb-4 text-sm text-[#64748b]">
          Expand each module to control sub-sections inside the mobile app.
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
                Dashboard — home stat cards
              </button>
              {expandedModule === "dashboard" ? (
                <div className="border-t border-[#e2e8f0] p-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {industryCards.map((cardId) => (
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
              </button>
              {expandedModule === "orders" ? (
                <div className="border-t border-[#e2e8f0] p-4">
                  <p className="mb-2 text-sm font-medium">Orders layout</p>
                  <div className="flex gap-2">
                    {(["list", "grid"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setOrdersSettings({ viewType: option })}
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
