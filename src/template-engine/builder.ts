import { MODULE_CATALOG } from "@/templates/modules";
import type {
  AccentColor,
  CustomizedTemplateConfig,
  DashboardCardId,
  IndustryTemplate,
  ModuleId,
  ThemeMode,
} from "@/templates/types";

export function buildDefaultNavigation(
  modules: ModuleId[],
  labels: IndustryTemplate["labels"],
): CustomizedTemplateConfig["navigation"] {
  return modules.map((moduleId) => {
    let label = MODULE_CATALOG[moduleId]?.label ?? moduleId;
    if (moduleId === "products") label = labels.products;
    if (moduleId === "menu") label = labels.products;
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
  accent?: AccentColor;
  themeMode?: ThemeMode;
  enabledModules?: ModuleId[];
  dashboardCards?: DashboardCardId[];
  labels?: IndustryTemplate["labels"];
  logoDataUrl?: string;
  navigation?: CustomizedTemplateConfig["navigation"];
}): CustomizedTemplateConfig {
  const enabledModules = input.enabledModules ?? [...input.industry.modules];
  const labels = input.labels ?? { ...input.industry.labels };

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
    accent: input.accent ?? input.industry.theme.accent,
    themeMode: input.themeMode ?? "light",
    enabledModules,
    navigation: input.navigation ?? buildDefaultNavigation(enabledModules, labels),
    dashboardCards: input.dashboardCards ?? [...input.industry.dashboardCards],
    labels,
  };
}

export function resolveVisibleNav(config: CustomizedTemplateConfig) {
  return config.navigation.filter((item) => item.visible && config.enabledModules.includes(item.moduleId));
}
