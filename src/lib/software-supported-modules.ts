import type { ModuleId } from "@/templates/types";

/** Modules the Flutter app currently ships screens for — keep in sync with diginizam-flutter ModuleScreenRegistry. */
export const SOFTWARE_SUPPORTED_MODULES = new Set<ModuleId>([
  "dashboard",
  "menu",
  "products",
  "orders",
  "kitchen",
  "sales",
  "tables",
  "staff",
  "inventory",
]);

export function isSoftwareSupportedModule(moduleId: string): boolean {
  return SOFTWARE_SUPPORTED_MODULES.has(moduleId as ModuleId);
}
