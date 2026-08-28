import { businessApi } from "@/hooks/useBusiness";
import type { CreateTemplateConfigPayload } from "@/hooks/useIndustryTemplate";
import { industryTemplateApi, apiConfigToCustomized, type ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { normalizeErrorMessage } from "@/lib/utils";
import { store } from "@/lib/store";
import { createCustomizedConfig } from "@/template-engine/builder";
import { saveTemplateConfig, loadSavedTemplates } from "@/template-engine/storage";
import { saveTemplateExtensions, loadTemplateExtensions } from "@/template-engine/template-extensions-storage";
import { INDUSTRY_TEMPLATES } from "@/templates/industries";
import type { CustomizedTemplateConfig } from "@/templates/types";

export type PersistTemplateResult = {
  config: CustomizedTemplateConfig;
  persistedToApi: boolean;
  warning?: string;
};

function configToApiPayload(
  config: CustomizedTemplateConfig,
  businessId?: string,
  moduleSettings?: Record<string, Record<string, unknown>>,
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
    market: config.market,
    location: config.location,
    branchCount: config.branchCount,
    businessId,
    logoUrl: config.logoDataUrl || undefined,
    ...(moduleSettings ? { moduleSettings } : {}),
  };
}

/** Save to API when available, always mirror to localStorage for offline/resume. */
export async function persistTemplateConfig(
  config: CustomizedTemplateConfig,
  options?: {
    businessId?: string;
    moduleSettings?: Record<string, Record<string, unknown>>;
    /** When true, throws instead of returning persistedToApi: false (use after business create). */
    requireApi?: boolean;
  },
): Promise<PersistTemplateResult> {
  if (config.extensions) {
    saveTemplateExtensions(config.id, config.extensions);
  }

  const localSaved = saveTemplateConfig(config);
  void localSaved;

  try {
    const payload = configToApiPayload(config, options?.businessId, options?.moduleSettings);
    const result = await store
      .dispatch(industryTemplateApi.endpoints.createTemplateConfig.initiate(payload))
      .unwrap();

    const merged: CustomizedTemplateConfig = {
      ...result,
      logoDataUrl: config.logoDataUrl,
      extensions: config.extensions ?? loadTemplateExtensions(result.id),
    };
    saveTemplateConfig(merged);

    if (options?.businessId) {
      store.dispatch(
        businessApi.util.invalidateTags([
          { type: "Business", id: options.businessId },
          { type: "Business", id: "LIST" },
        ]),
      );
    }

    return { config: merged, persistedToApi: true };
  } catch (error) {
    const message = normalizeErrorMessage(error, "API unavailable");
    const warning = `Saved locally. API sync failed: ${message}`;
    if (options?.requireApi) {
      throw new Error(warning);
    }
    return {
      config,
      persistedToApi: false,
      warning,
    };
  }
}

/** Apply an industry blueprint to a business so workspace nav uses that industry, not a hash/guess. */
export async function persistIndustryTemplateForBusiness(options: {
  businessId: string;
  businessName: string;
  industryId: string;
  location?: string;
  currency?: string;
  market?: string;
  requireApi?: boolean;
}): Promise<PersistTemplateResult> {
  const industry = INDUSTRY_TEMPLATES.find((item) => item.id === options.industryId);
  if (!industry) {
    return {
      config: createCustomizedConfig({
        businessName: options.businessName,
        industry: INDUSTRY_TEMPLATES[0]!,
      }),
      persistedToApi: false,
      warning: `Unknown industry "${options.industryId}".`,
    };
  }

  const config = createCustomizedConfig({
    businessName: options.businessName,
    industry,
    location: options.location,
    currency: options.currency,
    market: options.market,
  });
  return persistTemplateConfig(config, {
    businessId: options.businessId,
    requireApi: options.requireApi ?? true,
  });
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
