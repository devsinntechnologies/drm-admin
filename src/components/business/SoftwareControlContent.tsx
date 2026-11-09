"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  GripVertical,
  Printer,
  LayoutDashboard,
  BarChart3,
  Loader2,
  Palette,
  Package,
  ParkingCircle,
  Shield,
  ShoppingCart,
  Smartphone,
  Tags,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { FeatureTip } from "@/components/ui/FeatureTip";
import { SOFTWARE_TIPS } from "@/lib/feature-tips";
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
  mobileRoleAccessView,
  resolveRoleEntry,
} from "@/lib/software-role-defaults";
import {
  parseCategoriesSettings,
  parseOrdersSettings,
  parseProductsSettings,
  parseSalesSettings,
  parseParkingSettings,
  PARKING_SECTION_OPTIONS,
  serializeCategoriesSettings,
  serializeOrdersSettings,
  serializeParkingSettings,
  serializeProductsSettings,
  serializeSalesSettings,
  type CategoriesModuleSettings,
  type OrdersModuleSettings,
  type ParkingModuleSettings,
  type ProductsModuleSettings,
  type SalesModuleSettings,
} from "@/lib/module-feature-settings";
import {
  EXPENSE_DASHBOARD_CARD_IDS,
  listMobileDashboardCardIds,
  mergeDashboardCardOrder,
  orderedSelectedDashboardCards,
} from "@/lib/mobile-dashboard-cards";
import {
  getMobileReadiness,
  mobileReadinessLabel,
  isSoftwareControlModule,
  softwareControlRoleModules,
  industryUsesMobileOrders,
  mobileModulesForIndustry,
  initialMobileEnabled,
  enableMobileModule,
  disableMobileModule,
  isMobileCapabilityModule,
} from "@/lib/software-supported-modules";
import { SoftwareModuleIcon } from "@/lib/software-module-icons";
import { normalizeErrorMessage } from "@/lib/utils";
import { isEmbeddedLogoData } from "@/lib/logo-upload";
import { resolveMediaUrl } from "@/lib/media-url";
import { resolveMobileControlConfig } from "@/lib/mobile-control-config";
import { appendBusinessId } from "@/lib/module-routes";
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

type OrdersBooleanKey = {
  [K in keyof OrdersModuleSettings]: OrdersModuleSettings[K] extends boolean ? K : never;
}[keyof OrdersModuleSettings];

type ControlScope = "web-app" | "app";

function ScopeTag({ scope }: { scope: ControlScope }) {
  return scope === "web-app" ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1d4ed8]">
      Web + App
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#fff7ed] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#c2410c]">
      App only
    </span>
  );
}

function FeatureSection({
  icon,
  title,
  scope,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: ReactNode;
  title: string;
  scope: ControlScope;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#e2e8f0]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-[#0f172a]"
      >
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {icon}
        {title}
        <ScopeTag scope={scope} />
        {badge ? (
          <span className="ml-auto text-xs font-normal text-[#64748b]">{badge}</span>
        ) : null}
      </button>
      {open ? <div className="space-y-3 border-t border-[#e2e8f0] p-4">{children}</div> : null}
    </div>
  );
}

function CheckOption({
  checked,
  onChange,
  title,
  body,
  scope,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: ReactNode;
  body?: string;
  /** Only when this option's reach differs from its section. */
  scope?: ControlScope;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#0f172a]">
          {title}
          {scope ? <ScopeTag scope={scope} /> : null}
        </span>
        {body ? <span className="block text-xs text-[#64748b]">{body}</span> : null}
      </span>
    </label>
  );
}

function ChoiceButtons<T extends string>({
  label,
  value,
  options,
  onChange,
  scope,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
  scope?: ControlScope;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
        {label}
        {scope ? <ScopeTag scope={scope} /> : null}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              value === option.id
                ? "border-[var(--brand-secondary)] bg-[var(--brand-primary-soft)] text-[var(--brand-secondary)]"
                : "border-[#e2e8f0] text-[#64748b]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionGroupLabel({ children }: { children: ReactNode }) {
  return (
    <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-[#64748b]">{children}</p>
  );
}

type SoftwareControlContentProps = {
  businessId: string;
  businessName: string;
  templateConfig: ApiTemplateConfig | null | undefined;
  industryId: string;
  /** Details-page / business.logo upload — preferred over template logoUrl. */
  uploadedLogoUrl?: string | null;
  /** Super Admin software control — show platform hints for session timers. */
  platformAdmin?: boolean;
};

export function SoftwareControlContent({
  businessId,
  businessName,
  templateConfig: savedTemplateConfig,
  industryId,
  uploadedLogoUrl = null,
  platformAdmin = false,
}: SoftwareControlContentProps) {
  const templateConfig = resolveMobileControlConfig(savedTemplateConfig);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const industry = getIndustryById(industryId);
  const printersHref = pathname.includes("/superAdmin/")
    ? `/dashboard/superAdmin/businesses/${businessId}/software/printers`
    : appendBusinessId("/dashboard/businessAdmin/software/printers", businessId);

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
  const [dashboardCardOrder, setDashboardCardOrder] = useState<DashboardCardId[]>(() =>
    mergeDashboardCardOrder(
      (templateConfig?.dashboardCards ?? industry?.dashboardCards ?? []) as DashboardCardId[],
    ),
  );
  const [dragDashboardCardId, setDragDashboardCardId] = useState<DashboardCardId | null>(null);
  const [offlineSyncEnabled, setOfflineSyncEnabled] = useState(
    (templateConfig?.moduleSettings?.offlineSync?.enabled as boolean | undefined) ?? true,
  );
  const [primaryColor, setPrimaryColor] = useState(templateConfig?.primaryColor ?? "#001840");
  const [secondaryColor, setSecondaryColor] = useState(templateConfig?.secondaryColor ?? "#0050F8");
  const [themeMode, setThemeMode] = useState<ThemeMode>(templateConfig?.themeMode ?? "light");
  const [logoUrl, setLogoUrl] = useState<string | null>(
    uploadedLogoUrl ?? templateConfig?.logoUrl ?? null,
  );
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
  const [parkingSettings, setParkingSettings] = useState<ParkingModuleSettings>(() =>
    parseParkingSettings(templateConfig?.moduleSettings),
  );
  const [openSections, setOpenSections] = useState<ReadonlySet<string>>(() => new Set());
  const isSectionOpen = (id: string) => openSections.has(id);
  const toggleSection = (id: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const setOrder = (key: OrdersBooleanKey, value: boolean) =>
    setOrdersSettings((prev) => ({ ...prev, [key]: value }));
  const [dragModuleId, setDragModuleId] = useState<string | null>(null);

  const [updateConfig, { isLoading: savingUpdate }] = useUpdateTemplateConfigMutation();
  const [createConfig, { isLoading: savingCreate }] = useCreateTemplateConfigMutation();
  const saving = savingUpdate || savingCreate;
  const skipServerHydrateRef = useRef(false);
  /** Last saved app modules, retained if a save fails. */
  const serverEnabledRef = useRef<ModuleId[]>(
    (templateConfig?.enabledModules ?? []) as ModuleId[],
  );
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const pendingPersistRef = useRef<{ enabled: ModuleId[]; roles: RoleAccessMap } | null>(
    null,
  );

  const configSyncKey = [
    templateConfig?.id ?? "",
    templateConfig?.updatedAt ?? "",
    industryId,
  ].join("|");

  useEffect(() => {
    if (skipServerHydrateRef.current) {
      skipServerHydrateRef.current = false;
      return;
    }
    serverEnabledRef.current = (templateConfig?.enabledModules ?? []) as ModuleId[];
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
    const savedCards = (templateConfig?.dashboardCards ?? industry?.dashboardCards ?? []) as DashboardCardId[];
    setDashboardCards(savedCards);
    setDashboardCardOrder(mergeDashboardCardOrder(savedCards));
    setOfflineSyncEnabled(
      (templateConfig?.moduleSettings?.offlineSync?.enabled as boolean | undefined) ?? true,
    );
    setPrimaryColor(templateConfig?.primaryColor ?? "#001840");
    setSecondaryColor(templateConfig?.secondaryColor ?? "#0050F8");
    setThemeMode(templateConfig?.themeMode ?? "light");
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
    setParkingSettings(parseParkingSettings(templateConfig?.moduleSettings));
    // Hydrate from the saved template, not on every parent re-render / business refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configSyncKey, mobileCatalog]);

  useEffect(() => {
    setLogoUrl(uploadedLogoUrl ?? templateConfig?.logoUrl ?? null);
  }, [uploadedLogoUrl, templateConfig?.logoUrl]);

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
      const nextRoles = normalizeRoleAccessForModules(roleAccess, next, industryId);
      setEnabledModules(next);
      setRoleAccess(nextRoles);
      if (moduleId === "expenses") {
        setDashboardCards((prev) => prev.filter((id) => !EXPENSE_DASHBOARD_CARD_IDS.includes(id)));
      }
      void persist({ enabled: next, roles: nextRoles });
      return;
    }
    const next = enableMobileModule(moduleId, enabledModules, mobileCatalog);
    const nextRoles = grantModuleToOwnerRoles(roleAccess, moduleId, next);
    setEnabledModules(next);
    setRoleAccess(nextRoles);
    if (moduleId === "expenses") {
      setDashboardCards((prev) => {
        const merged = [...prev];
        for (const id of EXPENSE_DASHBOARD_CARD_IDS) {
          if (!merged.includes(id)) merged.push(id);
        }
        return merged;
      });
      setDashboardCardOrder((prev) => mergeDashboardCardOrder(prev));
    }
    void persist({ enabled: next, roles: nextRoles });
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
    setDashboardCards((prev) => {
      if (prev.includes(cardId)) return prev.filter((id) => id !== cardId);
      return [...prev, cardId];
    });
    setDashboardCardOrder((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
  };

  const reorderDashboardCards = (fromId: DashboardCardId, toId: DashboardCardId) => {
    if (fromId === toId) return;
    setDashboardCardOrder((prev) => {
      const from = prev.findIndex((id) => id === fromId);
      const to = prev.findIndex((id) => id === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const mobileDashboardCards = useMemo(() => listMobileDashboardCardIds(), []);
  const dashboardCardsForSave = useMemo(
    () => orderedSelectedDashboardCards(dashboardCardOrder, dashboardCards),
    [dashboardCardOrder, dashboardCards],
  );

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

  const runPersist = async (snapshot: { enabled: ModuleId[]; roles: RoleAccessMap }) => {
    if (!industry) {
      toast.error("This business has no industry template to edit.");
      return;
    }

    const nextEnabled = snapshot.enabled;
    const nextRoles = snapshot.roles;
    const mergedEnabled = nextEnabled.filter((moduleId) => mobileCatalog.includes(moduleId));
    const mergedRoleAccess = normalizeRoleAccessForModules(
      nextRoles,
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
      parking: serializeParkingSettings(parkingSettings),
    };

    const usableLogo = [uploadedLogoUrl, logoUrl, templateConfig?.logoUrl].find(
      (value) => value && !isEmbeddedLogoData(value),
    );

    const payload = {
      businessName: templateConfig?.businessName ?? businessName,
      industryId: industry.id,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules: mergedEnabled,
      navigation: syncedNavigation,
      dashboardCards: dashboardCardsForSave,
      labels: syncedLabels as IndustryTemplate["labels"],
      currency: templateConfig?.currency,
      location: templateConfig?.location,
      branchCount: templateConfig?.branchCount,
      ...(usableLogo ? { logoUrl: usableLogo } : {}),
      businessId,
      moduleSettings,
    };

    const toastId = toast.loading("Saving software control…");
    try {
      skipServerHydrateRef.current = true;
      const saved = templateConfig?.id
        ? await updateConfig({ id: templateConfig.id, body: { ...payload, controlTarget: 'mobile' } }).unwrap()
        : await createConfig(payload).unwrap();
      serverEnabledRef.current = resolveMobileControlConfig(saved)!.enabledModules as ModuleId[];
      dispatch(businessApi.util.invalidateTags([{ type: "Business", id: businessId }]));
      toast.success("Saved. App updates within one minute or when refreshed.", { id: toastId });
    } catch (error) {
      skipServerHydrateRef.current = false;
      toast.error(normalizeErrorMessage(error, "Could not save software control."), { id: toastId });
      throw error;
    }
  };

  const persist = (overrides?: { enabled?: ModuleId[]; roles?: RoleAccessMap }) => {
    pendingPersistRef.current = {
      enabled: overrides?.enabled ?? enabledModules,
      roles: overrides?.roles ?? roleAccess,
    };
    persistQueueRef.current = persistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        while (pendingPersistRef.current) {
          const snapshot = pendingPersistRef.current;
          pendingPersistRef.current = null;
          await runPersist(snapshot);
        }
      });
    return persistQueueRef.current;
  };

  const save = () => persist();

  if (!industry) {
    return (
      <section className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-5">
        <p className="text-sm text-[#b45309]">
          Unknown industry template (<code>{industryId}</code>). Run setup or pick a valid industry first.
        </p>
      </section>
    );
  }

  const softwareControlModules = mobileCatalog;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1e40af]">
        These are the <strong>mobile app screens</strong> for this business. Turning a module off
        saves immediately and hides it in Super Admin, the web portal, and the Flutter app after
        refresh. Industry Templates only set defaults for <strong>new</strong> businesses — they do
        not overwrite this saved control.
      </div>

      {/* Modules */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <div className="mb-1 flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-[var(--brand-secondary)]" />
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
            1. Mobile app modules
            <FeatureTip text={SOFTWARE_TIPS.modules} />
          </h2>
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
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
            2. Offline sync
            <FeatureTip text={SOFTWARE_TIPS.offline} />
          </h2>
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
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
            3. Theme
            <FeatureTip text={SOFTWARE_TIPS.theme} />
          </h2>
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
          <h2 className="inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
            4. Mobile app header
            <FeatureTip text={SOFTWARE_TIPS.mobileHeader} />
          </h2>
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
                <span className="inline-flex items-center gap-1.5 font-medium">Show logout button <FeatureTip text={SOFTWARE_TIPS.showLogout} /></span>
                <input
                  type="checkbox"
                  checked={mobileHeader.showLogout}
                  onChange={(e) =>
                    setMobileHeader((p) => ({ ...p, showLogout: e.target.checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium">Show cloud sync / live badge <FeatureTip text={SOFTWARE_TIPS.showOnline} /></span>
                <input
                  type="checkbox"
                  checked={mobileHeader.showOnlineStatus}
                  onChange={(e) =>
                    setMobileHeader((p) => ({ ...p, showOnlineStatus: e.target.checked }))
                  }
                />
              </label>
              <label className="flex items-center justify-between rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm">
                <span className="inline-flex items-center gap-1.5 font-medium">Show time and date <FeatureTip text={SOFTWARE_TIPS.showDateTime} /></span>
                <input
                  type="checkbox"
                  checked={mobileHeader.showDateTime}
                  onChange={(e) =>
                    setMobileHeader((p) => ({ ...p, showDateTime: e.target.checked }))
                  }
                />
              </label>
              <div>
                <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  Logo plate background
                  <FeatureTip text={SOFTWARE_TIPS.logoPlate} />
                </p>
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
              logoUrl={resolveMediaUrl(uploadedLogoUrl || logoUrl)}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              enabled={mobileHeader.enabled}
              showLogout={mobileHeader.showLogout}
              showOnlineStatus={mobileHeader.showOnlineStatus}
              showDateTime={mobileHeader.showDateTime}
              logoBackgroundColor={mobileHeader.logoBackgroundColor}
            />
          </div>
        ) : (
          <MobileHeaderPreview
            businessName={businessName}
            logoUrl={resolveMediaUrl(uploadedLogoUrl || logoUrl)}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            enabled={false}
            showLogout={mobileHeader.showLogout}
            showOnlineStatus={mobileHeader.showOnlineStatus}
              showDateTime={mobileHeader.showDateTime}
            logoBackgroundColor={mobileHeader.logoBackgroundColor}
          />
        )}
      </section>

      {/* Navigation */}
      <section className="rounded-xl border border-[#e2e8f0] bg-white p-5">
        <h2 className="mb-1 inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
          5. Mobile navigation
          <FeatureTip text={SOFTWARE_TIPS.navigation} />
        </h2>
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
          <h2 className="text-base font-semibold text-[#0f172a] inline-flex items-center gap-1.5">
            6. Role permissions (mobile app tabs)
            <FeatureTip text="Choose which tabs each role can open on the phone. Portal access is separate." />
          </h2>
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
        <h2 className="mb-1 inline-flex items-center gap-1.5 text-base font-semibold text-[#0f172a]">
          7. Module features (mobile app)
          <FeatureTip text="Fine-tune products, orders, categories, and invoices on the app without turning the whole module off." />
        </h2>
        <p className="mb-4 text-sm text-[#64748b]">
          Open a section to change its options. Save at the bottom to push changes to Flutter and the
          business portal.
        </p>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs text-[#475569]">
          <span className="inline-flex items-center gap-2">
            <ScopeTag scope="web-app" /> Applies to the business web portal and the mobile app
          </span>
          <span className="inline-flex items-center gap-2">
            <ScopeTag scope="app" /> Applies to the mobile app only
          </span>
          <span>An option tagged differently from its section follows its own tag.</span>
        </div>
        <div className="space-y-2">
          {enabledModules.includes("dashboard") ? (
            <FeatureSection
              icon={<LayoutDashboard className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Dashboard — KPI stat cards (mobile + portal)"
              scope="web-app"
              open={isSectionOpen("dashboard")}
              onToggle={() => toggleSection("dashboard")}
            >
              <p className="text-sm text-[#64748b]">
                Toggle cards on or off and drag to reorder. Expense cards require the{" "}
                <strong>Expenses</strong> module and hide automatically when it is off.
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {mergeDashboardCardOrder(dashboardCardOrder).map((cardId) => (
                  <DashboardCardChip
                    key={cardId}
                    id={cardId}
                    checked={dashboardCards.includes(cardId)}
                    dragging={dragDashboardCardId === cardId}
                    onToggle={() => toggleDashboardCard(cardId)}
                    onDragStart={() => setDragDashboardCardId(cardId)}
                    onDragEnd={() => setDragDashboardCardId(null)}
                    onDrop={() => {
                      if (dragDashboardCardId) {
                        reorderDashboardCards(dragDashboardCardId, cardId);
                      }
                      setDragDashboardCardId(null);
                    }}
                  />
                ))}
              </div>
            </FeatureSection>
          ) : null}

          {enabledModules.includes("reports") ? (
            <FeatureSection
              icon={<BarChart3 className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Reports — live filters (mobile + portal)"
              scope="web-app"
              open={isSectionOpen("reports")}
              onToggle={() => toggleSection("reports")}
            >
              <div className="space-y-2 text-sm text-[#475569]">
                <p>
                  The Reports tab uses the same date filters as the business portal. Staff pick Today,
                  This week, This month, or a custom range, then see sales, top items, and profit
                  figures for that business.
                </p>
                <p className="text-xs text-[#94a3b8]">
                  Grant Reports in the role matrix above so cashiers or managers can open it. Owners see
                  it automatically when the module is on.
                </p>
              </div>
            </FeatureSection>
          ) : null}

          {enabledModules.includes("sales") ? (
            <FeatureSection
              icon={<FileSpreadsheet className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Invoices / Sales"
              scope="web-app"
              open={isSectionOpen("sales")}
              onToggle={() => toggleSection("sales")}
            >
              <CheckOption
                checked={salesSettings.allowExport}
                onChange={(value) => setSalesSettings((prev) => ({ ...prev, allowExport: value }))}
                title={
                  <span className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    Allow Excel export
                  </span>
                }
                body="Download the invoice list as Excel on mobile, desktop, and the staff portal."
              />
              <div className="space-y-2">
                <CheckOption
                  checked={salesSettings.allowPrinter}
                  onChange={(value) => setSalesSettings((prev) => ({ ...prev, allowPrinter: value }))}
                  title={
                    <span className="flex items-center gap-1.5">
                      <Printer className="h-3.5 w-3.5" />
                      Allow printer access
                    </span>
                  }
                  body="Connect a printer and print from Invoices, Orders, and the mobile app. When off, staff are asked to contact an administrator."
                />
                {salesSettings.allowPrinter ? (
                  <Link
                    href={printersHref}
                    className="ml-7 inline-flex text-xs font-semibold text-[#0050F8] hover:underline"
                  >
                    Open printer configuration
                  </Link>
                ) : null}
              </div>
              <OptionGroupLabel>Invoice buttons</OptionGroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["allowPreview", "Preview invoices"],
                    ["allowRefresh", "Refresh invoices"],
                    ["allowFilters", "Date filters"],
                    ["allowPrinterSetup", "Printer setup and test"],
                    ["allowPrint", "Print invoices"],
                    ["allowDownloadPdf", "Download PDF"],
                    ["allowReturn", "Return invoices"],
                    ["allowDelete", "Delete invoices"],
                    ["showRevenue", "Show revenue totals"],
                  ] as const
                ).map(([key, label]) => (
                  <CheckOption
                    key={key}
                    checked={salesSettings[key]}
                    onChange={(value) => setSalesSettings((prev) => ({ ...prev, [key]: value }))}
                    title={label}
                  />
                ))}
              </div>
            </FeatureSection>
          ) : null}

          {/* Shared by app and web, so show it when either has Parking on. */}
          {enabledModules.includes("parking") || savedTemplateConfig?.enabledModules?.includes("parking") ? (
            <FeatureSection
              icon={<ParkingCircle className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Parking"
              scope="web-app"
              open={isSectionOpen("parking")}
              onToggle={() => toggleSection("parking")}
            >
              <p className="text-xs text-[#64748b]">
                Choose which Parking sections staff see in the app and the web portal. Hidden sections
                keep their data and can be turned back on at any time.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PARKING_SECTION_OPTIONS.map(([key, label]) => (
                  <CheckOption
                    key={key}
                    checked={parkingSettings[key]}
                    onChange={(value) => setParkingSettings((prev) => ({ ...prev, [key]: value }))}
                    title={label}
                  />
                ))}
              </div>
            </FeatureSection>
          ) : null}

          {hasProducts ? (
            <FeatureSection
              icon={<Package className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Products / Menu"
              scope="web-app"
              open={isSectionOpen("products")}
              onToggle={() => toggleSection("products")}
            >
              <OptionGroupLabel>Products screen header buttons</OptionGroupLabel>
              <p className="text-xs text-[#64748b]">
                Top-right actions on the Products page in the web portal and the mobile app.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckOption
                  checked={productsSettings.allowCreate}
                  onChange={(value) => setProductsSettings((p) => ({ ...p, allowCreate: value }))}
                  title="+ Add product / menu item"
                />
                <CheckOption
                  checked={categoriesSettings.allowManage}
                  onChange={(value) => setCategoriesSettings((p) => ({ ...p, allowManage: value }))}
                  title="Categories button"
                />
                <CheckOption
                  checked={productsSettings.allowManageIngredients}
                  onChange={(value) =>
                    setProductsSettings((p) => ({ ...p, allowManageIngredients: value }))
                  }
                  title="Ingredients button"
                />
              </div>
              <OptionGroupLabel>Product form</OptionGroupLabel>
              <div className="grid gap-2 sm:grid-cols-2">
                <CheckOption
                  checked={productsSettings.allowEdit}
                  onChange={(value) => setProductsSettings((p) => ({ ...p, allowEdit: value }))}
                  title="Allow editing products"
                  body="Change name, price, stock, and photo from the app."
                  scope="app"
                />
                <CheckOption
                  checked={productsSettings.allowBarcodeOnCreate}
                  onChange={(value) =>
                    setProductsSettings((p) => ({ ...p, allowBarcodeOnCreate: value }))
                  }
                  title="Barcode on product form"
                  body="USB gun and camera field when adding or editing products."
                  scope="app"
                />
              </div>
              <ChoiceButtons
                label="Product layout"
                scope="app"
                value={productsSettings.viewMode}
                options={[
                  { id: "grid", label: "Grid" },
                  { id: "list", label: "List" },
                ]}
                onChange={(id) => setProductsSettings((p) => ({ ...p, viewMode: id }))}
              />
            </FeatureSection>
          ) : null}

          {enabledModules.includes("orders") ? (
            <>
              <FeatureSection
                icon={<ShoppingCart className="h-4 w-4 text-[var(--brand-secondary)]" />}
                title="Orders — screens & flow"
                badge={
                  ordersSettings.showNewOrders && ordersSettings.showActiveOrders
                    ? "POS + Active queue"
                    : ordersSettings.showNewOrders
                      ? "POS only"
                      : ordersSettings.showActiveOrders
                        ? "Active queue only"
                        : "No screens"
                }
                scope="app"
                open={isSectionOpen("orders")}
                onToggle={() => toggleSection("orders")}
              >
                <p className="text-xs text-[#64748b]">
                  Which screens staff see in the Orders tab. For retail and auto parts, turn off{" "}
                  <strong>Active orders queue</strong> and keep <strong>New order / POS</strong> on.
                </p>
                <CheckOption
                  checked={ordersSettings.showNewOrders}
                  onChange={(value) =>
                    setOrdersSettings((prev) => ({
                      ...prev,
                      showNewOrders: value,
                      defaultSection:
                        !value && prev.defaultSection === "new" ? "active" : prev.defaultSection,
                    }))
                  }
                  title="New order / POS screen"
                  body="Product picker and cart for taking a sale."
                />
                <CheckOption
                  checked={ordersSettings.showActiveOrders}
                  onChange={(value) =>
                    setOrdersSettings((prev) => ({
                      ...prev,
                      showActiveOrders: value,
                      defaultSection:
                        !value && prev.defaultSection === "active" ? "new" : prev.defaultSection,
                    }))
                  }
                  title="Active orders queue"
                  body="Live order list with status updates (restaurant). Off for sell-and-done retail."
                />
                {ordersSettings.showActiveOrders && ordersSettings.showNewOrders ? (
                  <ChoiceButtons
                    label="Default screen"
                    value={ordersSettings.defaultSection}
                    options={[
                      { id: "active", label: "Active orders" },
                      { id: "new", label: "New order (POS)" },
                    ]}
                    onChange={(id) => setOrdersSettings((prev) => ({ ...prev, defaultSection: id }))}
                  />
                ) : null}
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
              </FeatureSection>

              <FeatureSection
                icon={<ShoppingCart className="h-4 w-4 text-[var(--brand-secondary)]" />}
                title="New order / POS"
                badge={ordersSettings.showNewOrders ? undefined : "Screen off"}
                scope="web-app"
                open={isSectionOpen("orders-new")}
                onToggle={() => toggleSection("orders-new")}
              >
                <p className="text-xs text-[#64748b]">
                  Cart, place order, and pricing extras on the <strong>New order</strong> screen of the
                  mobile app and the business web portal. Price override also applies when editing an
                  active order.
                </p>
                <CheckOption
                  checked={ordersSettings.allowCreate}
                  onChange={(value) => setOrder("allowCreate", value)}
                  title="Create / place order"
                  body="Cart checkout, plus the + button on Active orders."
                />
                <CheckOption
                  checked={ordersSettings.allowBarcodeScanner}
                  onChange={(value) => setOrder("allowBarcodeScanner", value)}
                  title="Barcode scanner"
                  body="USB/Bluetooth gun and camera add products to the cart."
                  scope="app"
                />
                <ChoiceButtons
                  label="Default product list"
                  scope="app"
                  value={ordersSettings.productScopeDefault}
                  options={[
                    { id: "activeOnly", label: "Active only" },
                    { id: "all", label: "All products" },
                  ]}
                  onChange={(id) => setOrdersSettings((prev) => ({ ...prev, productScopeDefault: id }))}
                />
                <OptionGroupLabel>Cart & payment</OptionGroupLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["allowExtraCharges", "Extra charges section", "Master switch for the Extra Charges accordion."],
                      ["allowDeliveryCharge", "Delivery charge", "Field inside Extra Charges."],
                      ["allowPackingCharge", "Packing charge", "Field inside Extra Charges."],
                      ["allowPriceOverride", "Price override", "Manual item price on the cart and when editing an order."],
                      ["allowLineDiscount", "Line discount", "Per-item discount on the cart."],
                      ["allowCreditSale", "Credit / udhar", "Credit option on Complete-order payment."],
                    ] as const
                  ).map(([key, title, body]) => (
                    <CheckOption
                      key={key}
                      checked={ordersSettings[key]}
                      onChange={(value) => setOrder(key, value)}
                      title={title}
                      body={body}
                    />
                  ))}
                </div>
              </FeatureSection>

              <FeatureSection
                icon={<ShoppingCart className="h-4 w-4 text-[var(--brand-secondary)]" />}
                title="Active orders"
                badge={ordersSettings.showActiveOrders ? undefined : "Screen off"}
                scope="web-app"
                open={isSectionOpen("orders-active")}
                onToggle={() => toggleSection("orders-active")}
              >
                <p className="text-xs text-[#64748b]">
                  Buttons on the live queue in <strong>Flutter Active Orders</strong> and the{" "}
                  <strong>business portal Orders</strong> screen.
                </p>
                <ChoiceButtons
                  label="Queue layout"
                  scope="app"
                  value={ordersSettings.viewType}
                  options={[
                    { id: "list", label: "List" },
                    { id: "grid", label: "Grid" },
                  ]}
                  onChange={(id) => setOrdersSettings((prev) => ({ ...prev, viewType: id }))}
                />
                <OptionGroupLabel>Order card buttons</OptionGroupLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["allowViewDetails", "View details"],
                      ["allowRefresh", "Refresh queue"],
                      ["allowEdit", "Edit items and prices"],
                      ["allowChangeTable", "Change table"],
                      ["allowRemove", "Remove / cancel order"],
                      ["allowComplete", "Complete order"],
                      ["allowPrint", "Print order"],
                    ] as const
                  ).map(([key, title]) => (
                    <CheckOption
                      key={key}
                      checked={ordersSettings[key]}
                      onChange={(value) => setOrder(key, value)}
                      title={title}
                      scope={key === "allowChangeTable" ? "app" : undefined}
                    />
                  ))}
                </div>
                <OptionGroupLabel>QR self-orders</OptionGroupLabel>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(
                    [
                      ["allowSelfOrderApprove", "Approve self-order"],
                      ["allowSelfOrderReject", "Reject self-order"],
                    ] as const
                  ).map(([key, title]) => (
                    <CheckOption
                      key={key}
                      checked={ordersSettings[key]}
                      onChange={(value) => setOrder(key, value)}
                      title={title}
                    />
                  ))}
                </div>
              </FeatureSection>

              <FeatureSection
                icon={<ShoppingCart className="h-4 w-4 text-[var(--brand-secondary)]" />}
                title="Timed table sessions"
                badge={ordersSettings.enableTableSession ? "On" : "Off"}
                scope="web-app"
                open={isSectionOpen("orders-sessions")}
                onToggle={() => toggleSection("orders-sessions")}
              >
                <p className="text-xs text-[#64748b]">
                  Session timers for snooker / pool tables. Restaurants usually keep this off.
                </p>
                <CheckOption
                  checked={ordersSettings.enableTableSession}
                  onChange={(value) => setOrder("enableTableSession", value)}
                  title="Enable timed table sessions"
                  body="Master switch for the session block, timers, and booking status."
                />
                {ordersSettings.enableTableSession ? (
                  <>
                    <OptionGroupLabel>When placing an order</OptionGroupLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["allowSessionDuration", "Duration picker", "15 / 30 / 60 min when placing an order."],
                          ["allowOpenEndedSession", "Open-ended (∞)", "∞ option in the duration list."],
                          ["allowSessionGameType", "Game type picker", "Single / Double dropdown."],
                          ["showTableBookingStatus", "Booked / overtime ribbons", "BOOKED ribbon on product cards."],
                        ] as const
                      ).map(([key, title, body]) => (
                        <CheckOption
                          key={key}
                          checked={ordersSettings[key]}
                          onChange={(value) => setOrder(key, value)}
                          title={title}
                          body={body}
                          scope={key === "showTableBookingStatus" ? undefined : "app"}
                        />
                      ))}
                    </div>
                    <OptionGroupLabel>On the active session card</OptionGroupLabel>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(
                        [
                          ["allowSessionEditTime", "Edit remaining time", "Pencil on Active Orders."],
                          ["allowSessionAddTime", "+5 / +15 minutes", "Quick-extend on session card."],
                          ["allowSessionPause", "Pause / resume", "Pause control on session card."],
                          ["allowSessionTimeUpAlert", "Time Up alert", "Popup + beep when time expires."],
                        ] as const
                      ).map(([key, title, body]) => (
                        <CheckOption
                          key={key}
                          checked={ordersSettings[key]}
                          onChange={(value) => setOrder(key, value)}
                          title={title}
                          body={body}
                          scope={key === "allowSessionTimeUpAlert" ? "app" : undefined}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </FeatureSection>
            </>
          ) : null}

          {enabledModules.includes("categories") ? (
            <FeatureSection
              icon={<Tags className="h-4 w-4 text-[var(--brand-secondary)]" />}
              title="Categories — mobile capability"
              scope="web-app"
              open={isSectionOpen("categories")}
              onToggle={() => toggleSection("categories")}
            >
              <p className="text-xs text-[#64748b]">
                Not a Flutter tab. When enabled for a role, category tools appear inside Products /
                Orders.
              </p>
              <CheckOption
                checked={categoriesSettings.allowManage}
                onChange={(value) => setCategoriesSettings((p) => ({ ...p, allowManage: value }))}
                title="Allow adding / editing categories"
                body="Shows the Categories button on Products (web + mobile). When off, staff can only view / filter."
              />
              <CheckOption
                checked={categoriesSettings.showFilters}
                onChange={(value) => setCategoriesSettings((p) => ({ ...p, showFilters: value }))}
                title="Show category filter chips"
                body="Filter chips on Products and Orders screens."
                scope="app"
              />
            </FeatureSection>
          ) : null}
        </div>
      </section>

      <div className="pointer-events-none sticky bottom-4 z-10 flex justify-end">
        <div className="pointer-events-auto rounded-xl border border-[#e2e8f0] bg-white/95 p-4 shadow-lg backdrop-blur">
          <button type="button" onClick={() => void save()} disabled={saving} className="dn-btn dn-btn-primary min-w-[10rem]">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save software control
          </button>
        </div>
      </div>
    </div>
  );
}
