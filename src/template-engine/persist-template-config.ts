import type { CreateTemplateConfigPayload } from "@/hooks/useIndustryTemplate";
import { industryTemplateApi, apiConfigToCustomized, type ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import type { CustomizedTemplateConfig } from "@/templates/types";
import { saveTemplateConfig, loadSavedTemplates } from "@/template-engine/storage";
import { saveTemplateExtensions, loadTemplateExtensions } from "@/template-engine/template-extensions-storage";
import { store } from "@/lib/store";

export type PersistTemplateResult = {
  config: CustomizedTemplateConfig;
  persistedToApi: boolean;
  warning?: string;
};

function configToApiPayload(
  config: CustomizedTemplateConfig,
  businessId?: string,
): CreateTemplateConfigPayload {
  return {
    businessName: config.businessName,
    industryId: config.industryId,
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    themeMode: config.themeMode,
    enabledModules: config.enabledModules,
    navigation: config.navigation,
    dashboardCards: config.dashboardCards,
    labels: config.labels,
    currency: config.currency,
    location: config.location,
    branchCount: config.branchCount,
    businessId,
    logoUrl: config.logoDataUrl || undefined,
  };
}

/** Save to API when available, always mirror to localStorage for offline/resume. */
export async function persistTemplateConfig(
  config: CustomizedTemplateConfig,
  options?: { businessId?: string },
): Promise<PersistTemplateResult> {
  if (config.extensions) {
    saveTemplateExtensions(config.id, config.extensions);
  }

  const localSaved = saveTemplateConfig(config);
  void localSaved;

  try {
    const payload = configToApiPayload(config, options?.businessId);
    const result = await store
      .dispatch(industryTemplateApi.endpoints.createTemplateConfig.initiate(payload))
      .unwrap();

    const merged: CustomizedTemplateConfig = {
      ...result,
      logoDataUrl: config.logoDataUrl,
      extensions: config.extensions ?? loadTemplateExtensions(result.id),
    };
    saveTemplateConfig(merged);

    return { config: merged, persistedToApi: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "API unavailable";
    return {
      config,
      persistedToApi: false,
      warning: `Saved locally. API sync failed: ${message}`,
    };
  }
}

export function mergeConfigWithExtensions(config: CustomizedTemplateConfig): CustomizedTemplateConfig {
  const extensions = loadTemplateExtensions(config.id);
  return extensions ? { ...config, extensions } : config;
}

export function loadAllTemplateConfigsLocal(): CustomizedTemplateConfig[] {
  return loadSavedTemplates().map(mergeConfigWithExtensions);
}

export function mapApiListToConfigs(rows: ApiTemplateConfig[]): CustomizedTemplateConfig[] {
  return rows.map((row) => mergeConfigWithExtensions(apiConfigToCustomized(row)));
}
