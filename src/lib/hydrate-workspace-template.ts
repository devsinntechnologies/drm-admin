import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { buildDefaultNavigation } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import type { ModuleId } from "@/templates/types";

const SALON_ONLY_MODULES = new Set<string>([
  "appointments",
  "services",
  "schedules",
  "packages",
  "memberships",
  "commissions",
]);

const SNOOKER_CORE = ["products", "categories", "orders", "credits", "expenses"] as const;
const SNOOKER_LEGACY_ONLY = new Set([
  "tables",
  "pos",
  "billing-pricing",
  "discounts",
  "shifts",
  "audit-logs",
  "notifications",
]);

const PRODUCTION_JOB_WORK_ID = "production-job-work" as ModuleId;

const PRODUCTION_ELIGIBLE_INDUSTRIES = new Set([
  "retail-store",
  "boutique",
  "manufacturing",
]);

function snookerConfigLooksIncomplete(config: ApiTemplateConfig, defaultModules: ModuleId[]) {
  const enabled = new Set(config.enabledModules ?? []);
  const missingDefaults = defaultModules.filter((id) => !enabled.has(id));
  const missingCore = SNOOKER_CORE.filter((id) => !enabled.has(id));
  const hasLegacy = (config.enabledModules ?? []).some((id) => SNOOKER_LEGACY_ONLY.has(id));
  const navCount = config.navigation?.filter((item) => item.visible).length ?? 0;
  return hasLegacy || missingCore.length > 0 || missingDefaults.length > 0 || navCount < defaultModules.length;
}

function ensureProductionJobWorkInConfig(config: ApiTemplateConfig): ApiTemplateConfig {
  if (!PRODUCTION_ELIGIBLE_INDUSTRIES.has(config.industryId)) {
    return config;
  }
  const enabled = new Set(config.enabledModules ?? []);
  if (!enabled.has("purchases") || !enabled.has("inventory") || !enabled.has("suppliers")) {
    return config;
  }
  if (enabled.has(PRODUCTION_JOB_WORK_ID)) {
    const nav = config.navigation ?? [];
    if (nav.some((item) => item.moduleId === PRODUCTION_JOB_WORK_ID && item.visible !== false)) {
      return config;
    }
  }

  const enabledModules = Array.from(
    new Set([...(config.enabledModules ?? []), PRODUCTION_JOB_WORK_ID]),
  ) as ModuleId[];
  const industry = getIndustryById(config.industryId);
  const labels = { ...industry?.labels, ...config.labels };
  const navigation = buildDefaultNavigation(enabledModules, labels, config.industryId);
  return {
    ...config,
    enabledModules,
    navigation,
  };
}

/**
 * Repair legacy pharmacy / snooker navigation.
 * Pharmacy: do not re-enable modules a super admin disabled — only repair nav + labels.
 * Snooker: restore blueprint modules when the saved config still looks incomplete.
 */
export function hydrateWorkspaceTemplate(config: ApiTemplateConfig | null | undefined): ApiTemplateConfig | null {
  if (!config) return null;

  const next = ensureProductionJobWorkInConfig(config);

  if (next.industryId === "snooker-pos") {
    const industry = getIndustryById("snooker-pos");
    if (!industry) return next;
    const defaultModules = [...industry.modules] as ModuleId[];
    if (!snookerConfigLooksIncomplete(next, defaultModules)) {
      return next;
    }
    const optional = new Set<string>([...(industry.optionalModules ?? []), "branches"]);
    const extras = (next.enabledModules ?? []).filter(
      (id) => optional.has(id) && !defaultModules.includes(id as ModuleId),
    ) as ModuleId[];
    const enabledModules = Array.from(new Set([...defaultModules, ...extras]));
    const labels = {
      ...industry.labels,
      ...next.labels,
      product: "Product",
      products: "Products",
      customer: "Player",
      customers: "Players",
      order: "Order",
      orders: "Counter / POS",
    };
    return {
      ...next,
      enabledModules,
      navigation: buildDefaultNavigation(enabledModules, labels, "snooker-pos"),
      dashboardCards: [...industry.dashboardCards],
      labels,
    };
  }

  if (next.industryId !== "pharmacy") return next;

  const industry = getIndustryById("pharmacy");
  if (!industry) return next;

  // Preserve persisted module set (super-admin Portal Features / entitlements).
  const enabledModules = Array.from(
    new Set((next.enabledModules ?? []).filter((id) => !SALON_ONLY_MODULES.has(id))),
  ) as ModuleId[];
  const modulesForNav =
    enabledModules.length > 0 ? enabledModules : ([...industry.modules] as ModuleId[]);

  const labels = {
    ...industry.labels,
    ...next.labels,
    product: "Medicine",
    products: "Medicines",
    customer: "Patient",
    customers: "Patients",
    order: "Sale",
    orders: "Sales",
  };

  return {
    ...next,
    enabledModules: modulesForNav,
    navigation: buildDefaultNavigation(modulesForNav, labels, "pharmacy"),
    labels,
  };
}
