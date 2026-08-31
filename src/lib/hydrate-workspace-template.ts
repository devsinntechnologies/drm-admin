import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { buildDefaultNavigation } from "@/template-engine/builder";
import { getIndustryById } from "@/templates/industries";
import type { ModuleId } from "@/templates/types";

/**
 * Repair legacy pharmacy navigation without changing the persisted module set.
 *
 * Module hydration used to merge every pharmacy default into enabledModules.
 * That made a credential login see modules which a super admin had disabled.
 * The API template is authoritative; hydration may repair presentation data,
 * but must never grant access.
 */
export function hydrateWorkspaceTemplate(config: ApiTemplateConfig | null | undefined): ApiTemplateConfig | null {
  if (!config) return null;
  if (config.industryId !== "pharmacy") return config;

  const industry = getIndustryById("pharmacy");
  if (!industry) return config;

  const enabledModules = Array.from(new Set(config.enabledModules ?? [])) as ModuleId[];
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
    labels,
  };
}
