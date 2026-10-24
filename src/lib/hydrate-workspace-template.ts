import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";

/**
 * Saved Portal Features are the source of truth for the web workspace.
 * Software Control uses the separate mobileAccess settings.
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
