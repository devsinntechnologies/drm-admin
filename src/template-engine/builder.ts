import { colorsFromAccent, MODULE_CATALOG } from "@/templates/modules";
import type {
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";

const WORKSPACE_NAV_LABELS: Partial<Record<ModuleId, string>> = {
  menu: "Products",
  tables: "Floor & Tables",
  sales: "Invoices",
  staff: "Users",
  "public-catalog": "Public Catalog",
};

export function buildDefaultNavigation(
  modules: ModuleId[],
  labels: IndustryTemplate["labels"],
): CustomizedTemplateConfig["navigation"] {
  return modules.map((moduleId) => {
    let label = WORKSPACE_NAV_LABELS[moduleId] ?? MODULE_CATALOG[moduleId]?.label ?? moduleId;
    if (moduleId === "products") label = labels.products;
    if (moduleId === "orders" && labels.orders) label = labels.orders;
    if (moduleId === "customers" && labels.customers) label = labels.customers;
    return { moduleId, label, visible: true };
  });
}

export function createCustomizedConfig(input: {
  businessName: string;
  industry: IndustryTemplate;
  currency?: string;
  location?: string;
  branchCount?: number;
  primaryColor?: string;
  secondaryColor?: string;
  themeMode?: ThemeMode;
  enabledModules?: ModuleId[];
  dashboardCards?: DashboardCardId[];
  labels?: IndustryTemplate["labels"];
  logoDataUrl?: string;
  navigation?: CustomizedTemplateConfig["navigation"];
}): CustomizedTemplateConfig {
  const enabledModules = input.enabledModules ?? [...input.industry.modules];
  const labels = input.labels ?? { ...input.industry.labels };
  const defaults = colorsFromAccent(input.industry.theme.accent);

  return {
    id: `tpl_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    businessName: input.businessName.trim() || `${input.industry.name} Demo`,
    industryId: input.industry.id,
    industryName: input.industry.name,
    family: input.industry.family,
    currency: input.currency ?? "PKR",
    location: input.location ?? "",
    branchCount: input.branchCount ?? 1,
    logoDataUrl: input.logoDataUrl,
    primaryColor: input.primaryColor ?? defaults.primary,
    secondaryColor: input.secondaryColor ?? defaults.secondary,
    themeMode: input.themeMode ?? "light",
    enabledModules,
    navigation: input.navigation ?? buildDefaultNavigation(enabledModules, labels),
    dashboardCards: input.dashboardCards ?? [...input.industry.dashboardCards],
    labels,
  };
}

export function syncNavigationToEnabledModules(
  current: CustomizedTemplateConfig["navigation"] | undefined,
  enabledModules: ModuleId[],
  labels: IndustryTemplate["labels"],
): CustomizedTemplateConfig["navigation"] {
  const rebuilt = buildDefaultNavigation(enabledModules, labels);
  if (!current?.length) {
    return rebuilt.map((item) => ({ ...item, visible: enabledModules.includes(item.moduleId) }));
  }

  const kept = current
    .map((item) => {
      const fresh = rebuilt.find((row) => row.moduleId === item.moduleId);
      if (!fresh) return null;
      return {
        ...fresh,
        label: item.label || fresh.label,
        visible: enabledModules.includes(item.moduleId),
      };
    })
    .filter(Boolean) as CustomizedTemplateConfig["navigation"];

  const extras = rebuilt
    .filter((row) => !current.some((item) => item.moduleId === row.moduleId))
    .map((row) => ({ ...row, visible: enabledModules.includes(row.moduleId) }));

  return [...kept, ...extras];
}

export function resolveVisibleNav(config: CustomizedTemplateConfig) {
  return config.navigation.filter((item) => item.visible && config.enabledModules.includes(item.moduleId));
}
