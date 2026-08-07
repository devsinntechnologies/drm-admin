import { colorsFromAccent } from "@/templates/modules";
import type { CustomizedTemplateConfig } from "@/templates/types";

const STORAGE_KEY = "diginizam_industry_templates";

type LegacyConfig = CustomizedTemplateConfig & {
  accent?: string;
};

function normalizeConfig(item: LegacyConfig): CustomizedTemplateConfig {
  if (item.primaryColor && item.secondaryColor) return item;
  const colors = colorsFromAccent(item.accent ?? "blue");
  return {
    ...item,
    primaryColor: item.primaryColor ?? colors.primary,
    secondaryColor: item.secondaryColor ?? colors.secondary,
  };
}

export function loadSavedTemplates(): CustomizedTemplateConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LegacyConfig[];
    return Array.isArray(parsed) ? parsed.map(normalizeConfig) : [];
  } catch {
    return [];
  }
}

export function saveTemplateConfig(config: CustomizedTemplateConfig): CustomizedTemplateConfig[] {
  const existing = loadSavedTemplates().filter((item) => item.id !== config.id);
  const next = [config, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function getTemplateConfigById(id: string): CustomizedTemplateConfig | undefined {
  return loadSavedTemplates().find((item) => item.id === id);
}

export function deleteTemplateConfig(id: string): CustomizedTemplateConfig[] {
  const next = loadSavedTemplates().filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
