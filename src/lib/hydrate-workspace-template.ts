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

const PHARMACY_CORE = ["pos", "batches", "expiry", "prescriptions", "products"] as const;

const PRODUCTION_JOB_WORK_ID = "production-job-work" as ModuleId;

const PRODUCTION_ELIGIBLE_INDUSTRIES = new Set([
  "retail-store",
  "boutique",
  "manufacturing",
]);

function pharmacyConfigLooksIncomplete(config: ApiTemplateConfig, defaultModules: ModuleId[]) {
  const enabled = new Set(config.enabledModules ?? []);
  const missingDefaults = defaultModules.filter((id) => !enabled.has(id));
  const hasSalonLeftovers = (config.enabledModules ?? []).some((id) => SALON_ONLY_MODULES.has(id));
  const missingCore = PHARMACY_CORE.filter((id) => !enabled.has(id));
  const navCount = config.navigation?.filter((item) => item.visible).length ?? 0;
  return hasSalonLeftovers || missingCore.length > 0 || missingDefaults.length > 0 || navCount < defaultModules.length;
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

/** Make a saved pharmacy workspace match the local pharmacy blueprint. */
export function hydrateWorkspaceTemplate(config: ApiTemplateConfig | null | undefined): ApiTemplateConfig | null {
  if (!config) return null;

  let next = ensureProductionJobWorkInConfig(config);

  if (next.industryId !== "pharmacy") return next;

  const industry = getIndustryById("pharmacy");
  if (!industry) return next;

  const defaultModules = [...industry.modules] as ModuleId[];
  if (!pharmacyConfigLooksIncomplete(next, defaultModules)) {
    return next;
  }

  const optional = new Set<string>([...(industry.optionalModules ?? []), "branches"]);
  const extras = (next.enabledModules ?? []).filter(
    (id) => optional.has(id) && !defaultModules.includes(id as ModuleId) && !SALON_ONLY_MODULES.has(id),
  ) as ModuleId[];
  const enabledModules = Array.from(new Set([...defaultModules, ...extras]));
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
    enabledModules,
    navigation: buildDefaultNavigation(enabledModules, labels, "pharmacy"),
    dashboardCards: [...industry.dashboardCards],
    labels,
  };
}
