import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { buildDefaultNavigation } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import type { ModuleId } from "@/templates/types";

const PRODUCTION_JOB_WORK_ID = "production-job-work" as ModuleId;

const PRODUCTION_ELIGIBLE_INDUSTRIES = new Set([
  "retail-store",
  "boutique",
  "manufacturing",
]);

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
 * Repair legacy pharmacy navigation without changing the persisted module set.
 * Pharmacy defaults must not re-enable modules disabled by a super admin.
 * Keep configured dashboard cards and only repair navigation and labels.
 */
export function hydrateWorkspaceTemplate(config: ApiTemplateConfig | null | undefined): ApiTemplateConfig | null {
  if (!config) return null;

  const next = ensureProductionJobWorkInConfig(config);

  if (next.industryId !== "pharmacy") return next;

  const industry = getIndustryById("pharmacy");
  if (!industry) return next;

  const enabledModules = Array.from(new Set(next.enabledModules ?? [])) as ModuleId[];
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
    labels,
  };
}
