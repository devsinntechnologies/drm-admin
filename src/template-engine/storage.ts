import type { CustomizedTemplateConfig } from "@/templates/types";

const STORAGE_KEY = "diginizam_industry_templates";

export function loadSavedTemplates(): CustomizedTemplateConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomizedTemplateConfig[];
    return Array.isArray(parsed) ? parsed : [];
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
