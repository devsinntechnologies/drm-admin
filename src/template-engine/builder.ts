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

const SNOOKER_NAV_LABELS: Partial<Record<ModuleId, string>> = {
  tables: "Table Management",
  pos: "POS Sessions",
  "billing-pricing": "Billing & Pricing",
  customers: "Customers",
  "credit-udhar": "Credit / Udhar",
  discounts: "Discounts",
  expenses: "Expenses",
  shifts: "Daily Opening & Closing",
  reports: "Reports",
  staff: "Staff & Access",
  "audit-logs": "Audit Logs",
  notifications: "Notifications",
  branches: "Branches",
  settings: "Settings",
  memberships: "Memberships",
  loyalty: "Loyalty Programme",
  tournaments: "Tournaments",
  "table-booking": "Online Booking",
  subscriptions: "Subscriptions",
};

export function buildDefaultNavigation(
  modules: ModuleId[],
  labels: IndustryTemplate["labels"],
  industryId?: string,
): CustomizedTemplateConfig["navigation"] {
  return modules.map((moduleId) => {
    const snookerAlias = industryId === "snooker-pos" ? SNOOKER_NAV_LABELS[moduleId] : undefined;
    const restaurantAlias = industryId === "pharmacy" || industryId === "snooker-pos" ? undefined : WORKSPACE_NAV_LABELS[moduleId];
    let label = snookerAlias ?? restaurantAlias ?? MODULE_CATALOG[moduleId]?.label ?? moduleId;
    if (moduleId === "products") label = labels.products;
    if (moduleId === "orders" && labels.orders) label = labels.orders;
    if (moduleId === "customers" && labels.customers && industryId !== "snooker-pos") label = labels.customers;
    if (moduleId === "staff" && industryId === "pharmacy") label = "Staff";
    if (moduleId === "sales" && industryId === "pharmacy") label = labels.orders ?? "Sales";
    return { moduleId, label, visible: true };
  });
}

export function createCustomizedConfig(input: {
  businessName: string;
  industry: IndustryTemplate;
  currency?: string;
  market?: string;
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
    market: input.market,
    location: input.location ?? "",
    branchCount: input.branchCount ?? 1,
    logoDataUrl: input.logoDataUrl,
    primaryColor: input.primaryColor ?? defaults.primary,
    secondaryColor: input.secondaryColor ?? defaults.secondary,
    themeMode: input.themeMode ?? "light",
    enabledModules,
    navigation: input.navigation ?? buildDefaultNavigation(enabledModules, labels, input.industry.id),
    dashboardCards: input.dashboardCards ?? [...input.industry.dashboardCards],
    labels,
  };
}

export function syncNavigationToEnabledModules(
  current: CustomizedTemplateConfig["navigation"] | undefined,
  enabledModules: ModuleId[],
  labels: IndustryTemplate["labels"],
  industryId?: string,
): CustomizedTemplateConfig["navigation"] {
  const rebuilt = buildDefaultNavigation(enabledModules, labels, industryId);
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
