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

function pharmacyConfigLooksIncomplete(config: ApiTemplateConfig, defaultModules: ModuleId[]) {
  const enabled = new Set(config.enabledModules ?? []);
  const missingDefaults = defaultModules.filter((id) => !enabled.has(id));
  const hasSalonLeftovers = (config.enabledModules ?? []).some((id) => SALON_ONLY_MODULES.has(id));
  const missingCore = PHARMACY_CORE.filter((id) => !enabled.has(id));
  const navCount = config.navigation?.filter((item) => item.visible).length ?? 0;
  return hasSalonLeftovers || missingCore.length > 0 || missingDefaults.length > 0 || navCount < defaultModules.length;
}

/** Make a saved pharmacy workspace match the local pharmacy blueprint. */
export function hydrateWorkspaceTemplate(config: ApiTemplateConfig | null | undefined): ApiTemplateConfig | null {
  if (!config) return null;
  if (config.industryId !== "pharmacy") return config;

  const industry = getIndustryById("pharmacy");
  if (!industry) return config;

  const defaultModules = [...industry.modules] as ModuleId[];
  if (!pharmacyConfigLooksIncomplete(config, defaultModules)) {
    return config;
  }

  const optional = new Set<string>([...(industry.optionalModules ?? []), "branches"]);
  const extras = (config.enabledModules ?? []).filter(
    (id) => optional.has(id) && !defaultModules.includes(id as ModuleId) && !SALON_ONLY_MODULES.has(id),
  ) as ModuleId[];
  const enabledModules = Array.from(new Set([...defaultModules, ...extras]));
  const labels = {
    ...industry.labels,
    ...config.labels,
    product: "Medicine",
    products: "Medicines",
    customer: "Patient",
    customers: "Patients",
    order: "Sale",
    orders: "Sales",
  };

  return {
    ...config,
    enabledModules,
    navigation: buildDefaultNavigation(enabledModules, labels, "pharmacy"),
    dashboardCards: [...industry.dashboardCards],
    labels,
  };
}
