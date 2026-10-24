import type { ApiTemplateConfig } from '@/hooks/useIndustryTemplate';
import type { ModuleId, CustomizedTemplateConfig } from '@/templates/types';

/** Legacy templates inherit the saved portal configuration until the first scoped save. */
export function resolveMobileControlConfig(config: ApiTemplateConfig | null | undefined) {
  const mobile = config?.moduleSettings?.mobileAccess;
  if (!config || !Array.isArray(mobile?.enabledModules) || !Array.isArray(mobile?.navigation)) {
    return config;
  }
  return {
    ...config,
    enabledModules: mobile.enabledModules as ModuleId[],
    navigation: mobile.navigation as CustomizedTemplateConfig['navigation'],
    moduleSettings: {
      ...config.moduleSettings,
      roleAccess: (mobile.roleAccess ?? {}) as Record<string, unknown>,
    },
  };
}
