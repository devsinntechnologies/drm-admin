import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";

/**
 * Software Control is the source of truth for a saved business.
 * Do not overlay industry blueprints here — that reset Super Admin
 * module toggles on every page refresh.
 *
 * Industry defaults belong on Super Admin → Industry Templates and
 * are applied only when a new business/template is created.
 */
export function hydrateWorkspaceTemplate(
  config: ApiTemplateConfig | null | undefined,
): ApiTemplateConfig | null {
  return config ?? null;
}
