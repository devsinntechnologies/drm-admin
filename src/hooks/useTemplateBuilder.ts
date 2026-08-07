"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { createCustomizedConfig, buildDefaultNavigation } from "@/template-engine/builder";
import { persistTemplateConfig } from "@/template-engine/persist-template-config";
import { createDefaultExtensions } from "@/template-engine/template-extensions-storage";
import { getIndustryById } from "@/templates/industries";
import {
  canDisableModule,
  getAvailableModules,
  getIndustryModulePlan,
  getLockedModules,
  getLockReason,
  moduleLabel,
  withDependenciesEnabled,
  withDependentsDisabled,
} from "@/templates/module-dependencies";
import { colorsFromAccent } from "@/templates/modules";
import type {
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  TemplateConfigExtensions,
  ThemeMode,
} from "@/templates/types";

export function useTemplateBuilder(initialIndustryId?: string | null) {
  const [selectedId, setSelectedId] = useState<string | null>(initialIndustryId ?? null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [businessName, setBusinessName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [location, setLocation] = useState("");
  const [branchCount, setBranchCount] = useState(1);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [primaryColor, setPrimaryColor] = useState("#001840");
  const [secondaryColor, setSecondaryColor] = useState("#0050F8");
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [dashboardCards, setDashboardCards] = useState<DashboardCardId[]>([]);
  const [dashboardCardOrder, setDashboardCardOrder] = useState<DashboardCardId[]>([]);
  const [navItems, setNavItems] = useState<CustomizedTemplateConfig["navigation"]>([]);
  const [productLabel, setProductLabel] = useState("Product");
  const [productsLabel, setProductsLabel] = useState("Products");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [extensions, setExtensions] = useState<TemplateConfigExtensions>({});
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);
  const [apiIndustries, setApiIndustries] = useState<Record<string, IndustryTemplate>>({});

  const resolveIndustry = useCallback(
    (id: string | null) => {
      if (!id) return null;
      return apiIndustries[id] ?? getIndustryById(id) ?? null;
    },
    [apiIndustries],
  );

  const industry = useMemo(
    () => resolveIndustry(selectedId),
    [selectedId, resolveIndustry],
  );

  const availableModules = useMemo(
    () => (industry ? getAvailableModules(industry.modules, industry.optionalModules) : []),
    [industry],
  );

  const modulePlan = useMemo(
    () => (industry ? getIndustryModulePlan(industry.id) : undefined),
    [industry],
  );

  const lockedModules = useMemo(
    () =>
      industry
        ? getLockedModules(industry.id, enabledModules, availableModules)
        : new Set<ModuleId>(),
    [industry, enabledModules, availableModules],
  );

  const orderedNavForPreview = useMemo(
    () =>
      navItems
        .filter((item) => enabledModules.includes(item.moduleId))
        .map((item) => ({ ...item, visible: true })),
    [navItems, enabledModules],
  );

  const orderedEnabledDashboardCards = useMemo(
    () => dashboardCardOrder.filter((id) => dashboardCards.includes(id)),
    [dashboardCardOrder, dashboardCards],
  );

  const hydrateFromIndustry = useCallback((tpl: IndustryTemplate) => {
    const available = getAvailableModules(tpl.modules, tpl.optionalModules);
    const labels = { ...tpl.labels };
    const colors = colorsFromAccent(tpl.theme.accent);
    setBusinessName(`${tpl.name} Demo`);
    setPrimaryColor(colors.primary);
    setSecondaryColor(colors.secondary);
    setThemeMode("light");
    setEnabledModules([...tpl.modules]);
    setDashboardCards([...tpl.dashboardCards]);
    setDashboardCardOrder([...tpl.dashboardCards]);
    setProductLabel(tpl.labels.product);
    setProductsLabel(tpl.labels.products);
    setLogoDataUrl(null);
    setExtensions(createDefaultExtensions(tpl.name));
    setNavItems(
      buildDefaultNavigation(available, labels).map((item) => ({
        ...item,
        visible: tpl.modules.includes(item.moduleId),
      })),
    );
  }, []);

  const selectIndustry = useCallback(
    (id: string) => {
      const tpl = resolveIndustry(id);
      if (!tpl) return;
      setSelectedId(id);
      hydrateFromIndustry(tpl);
    },
    [hydrateFromIndustry, resolveIndustry],
  );

  const loadApiCatalog = useCallback((industries: IndustryTemplate[]) => {
    setApiIndustries(Object.fromEntries(industries.map((item) => [item.id, item])));
  }, []);

  const loadFromConfig = useCallback((config: CustomizedTemplateConfig) => {
    setSelectedId(config.industryId);
    setBusinessName(config.businessName);
    setCurrency(config.currency);
    setLocation(config.location);
    setBranchCount(config.branchCount);
    setThemeMode(config.themeMode);
    setPrimaryColor(config.primaryColor);
    setSecondaryColor(config.secondaryColor);
    setEnabledModules([...config.enabledModules]);
    setDashboardCards([...config.dashboardCards]);
    setDashboardCardOrder([...config.dashboardCards]);
    setNavItems([...config.navigation]);
    setProductLabel(config.labels.product);
    setProductsLabel(config.labels.products);
    setLogoDataUrl(config.logoDataUrl ?? null);
    setExtensions(config.extensions ?? createDefaultExtensions(config.industryName));
  }, []);

  const applyModuleSelection = useCallback(
    (nextEnabled: ModuleId[]) => {
      setEnabledModules(nextEnabled);
      setNavItems((current) => {
        const labels = { product: productLabel, products: productsLabel };
        const available = industry
          ? getAvailableModules(industry.modules, industry.optionalModules)
          : nextEnabled;
        const rebuilt = buildDefaultNavigation(available, labels);
        if (!current.length) {
          return rebuilt.map((r) => ({ ...r, visible: nextEnabled.includes(r.moduleId) }));
        }

        const kept = current
          .map((item) => {
            const fresh = rebuilt.find((r) => r.moduleId === item.moduleId);
            if (!fresh) return null;
            return {
              ...fresh,
              label: item.label || fresh.label,
              visible: nextEnabled.includes(item.moduleId),
            };
          })
          .filter(Boolean) as CustomizedTemplateConfig["navigation"];

        const extras = rebuilt
          .filter((r) => !current.some((c) => c.moduleId === r.moduleId))
          .map((r) => ({ ...r, visible: nextEnabled.includes(r.moduleId) }));

        return [...kept, ...extras];
      });
    },
    [industry, productLabel, productsLabel],
  );

  const toggleModule = useCallback(
    (moduleId: ModuleId) => {
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
        if (related.length) {
          toast.message(`Also unselected: ${related.map(moduleLabel).join(", ")}`);
        }
        applyModuleSelection(next);
        return;
      }

      const next = withDependenciesEnabled(industry.id, moduleId, enabledModules, availableModules);
      const added = next.filter((id) => !enabledModules.includes(id) && id !== moduleId);
      if (added.length) {
        toast.message(`Also enabled: ${added.map(moduleLabel).join(", ")}`);
      }
      applyModuleSelection(next);
    },
    [industry, enabledModules, availableModules, applyModuleSelection],
  );

  const toggleDashboardCard = useCallback((cardId: DashboardCardId) => {
    setDashboardCards((prev) =>
      prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId],
    );
  }, []);

  const reorderDashboardCards = useCallback((fromId: DashboardCardId, toId: DashboardCardId) => {
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
  }, []);

  const reorderModules = useCallback((fromId: ModuleId, toId: ModuleId) => {
    if (fromId === toId) return;
    setNavItems((prev) => {
      const from = prev.findIndex((item) => item.moduleId === fromId);
      const to = prev.findIndex((item) => item.moduleId === toId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const updateNavLabel = useCallback((moduleId: ModuleId, label: string) => {
    setNavItems((prev) =>
      prev.map((item) => (item.moduleId === moduleId ? { ...item, label } : item)),
    );
  }, []);

  const updateExtensions = useCallback((patch: Partial<TemplateConfigExtensions>) => {
    setExtensions((prev) => ({ ...prev, ...patch }));
  }, []);

  const buildConfig = useCallback((): CustomizedTemplateConfig | null => {
    if (!industry) return null;
    return createCustomizedConfig({
      businessName,
      industry,
      currency,
      location,
      branchCount,
      primaryColor,
      secondaryColor,
      themeMode,
      enabledModules,
      dashboardCards: orderedEnabledDashboardCards,
      labels: { ...industry.labels, product: productLabel, products: productsLabel },
      logoDataUrl: logoDataUrl ?? undefined,
      navigation: orderedNavForPreview,
    });
  }, [
    industry,
    businessName,
    currency,
    location,
    branchCount,
    primaryColor,
    secondaryColor,
    themeMode,
    enabledModules,
    orderedEnabledDashboardCards,
    productLabel,
    productsLabel,
    logoDataUrl,
    orderedNavForPreview,
  ]);

  const saveConfig = useCallback(
    async (businessId?: string) => {
      if (!industry) return null;
      if (!businessName.trim()) {
        toast.error("Business name is required");
        return null;
      }

      const base = buildConfig();
      if (!base) return null;

      const config: CustomizedTemplateConfig = { ...base, extensions };
      const result = await persistTemplateConfig(config, { businessId });
      setLastSavedId(result.config.id);

      if (result.persistedToApi) {
        toast.success("Template saved to platform");
      } else {
        toast.success(result.warning ?? "Template saved locally");
      }

      return result.config;
    },
    [industry, businessName, buildConfig, extensions],
  );

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or SVG).");
      return;
    }
    if (file.size > 512 * 1024) {
      toast.error("Logo must be smaller than 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const gptPreviewConfig = useMemo(
    () => ({
      businessName,
      industryId: industry?.id ?? selectedId ?? "",
      industryIcon: industry?.theme.icon,
      logoDataUrl,
      themeMode,
      primaryColor,
      secondaryColor,
      currency,
      labels: {
        ...(industry?.labels ?? { product: productLabel, products: productsLabel }),
        product: productLabel,
        products: productsLabel,
      },
      navItems: orderedNavForPreview,
      dashboardCards: orderedEnabledDashboardCards,
      productsLabel: productsLabel,
    }),
    [
      businessName,
      industry,
      selectedId,
      logoDataUrl,
      themeMode,
      primaryColor,
      secondaryColor,
      currency,
      productLabel,
      productsLabel,
      orderedNavForPreview,
      orderedEnabledDashboardCards,
    ],
  );

  return {
    selectedId,
    industry,
    availableModules,
    modulePlan,
    lockedModules,
    getLockReason: (moduleId: ModuleId) =>
      industry ? getLockReason(industry.id, moduleId, enabledModules, availableModules) : null,
    previewDevice,
    setPreviewDevice,
    businessName,
    setBusinessName,
    currency,
    setCurrency,
    location,
    setLocation,
    branchCount,
    setBranchCount,
    themeMode,
    setThemeMode,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    enabledModules,
    dashboardCards,
    dashboardCardOrder,
    navItems,
    productLabel,
    setProductLabel,
    productsLabel,
    setProductsLabel,
    logoDataUrl,
    setLogoDataUrl,
    extensions,
    updateExtensions,
    lastSavedId,
    orderedNavForPreview,
    orderedEnabledDashboardCards,
    selectIndustry,
    loadFromConfig,
    loadApiCatalog,
    toggleModule,
    toggleDashboardCard,
    reorderDashboardCards,
    reorderModules,
    updateNavLabel,
    handleLogoUpload,
    buildConfig,
    saveConfig,
    gptPreviewConfig,
  };
}

export type TemplateBuilderState = ReturnType<typeof useTemplateBuilder>;
