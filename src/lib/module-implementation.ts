import type { ModuleId } from "@/templates/types";
import { SNOOKER_OPTIONAL_MODULES, SNOOKER_SIDEBAR_MODULES } from "@/templates/snooker-pos";

/**
 * Modules with a fully built business workspace page (API-backed or dedicated UI).
 * Anything not listed routes to /modules/[id] and is treated as in progress.
 */
export const IMPLEMENTED_MODULES = new Set<ModuleId>([
  "dashboard",
  "products",
  "menu",
  "categories",
  "public-catalog",
  "tables",
  "sales",
  "orders",
  "kitchen",
  "staff",
  "inventory",
  "pos",
  "batches",
  "expiry",
  "suppliers",
  "purchases",
  "prescriptions",
  "customers",
  "returns",
  "reports",
  "accounting",
  "shifts",
  "cdss",
  "controlled-substances",
  "branches",
  "settings",
]);

export const SNOOKER_IMPLEMENTED_MODULES = new Set<ModuleId>([
  ...SNOOKER_SIDEBAR_MODULES,
  ...SNOOKER_OPTIONAL_MODULES,
]);

/** Core restaurant sidebar modules that match the live business workspace. */
export const RESTAURANT_LIVE_MODULES: ModuleId[] = [
  "dashboard",
  "menu",
  "categories",
  "public-catalog",
  "tables",
  "sales",
  "orders",
  "kitchen",
  "staff",
];

export function isModuleImplemented(moduleId: string, industryId?: string | null): boolean {
  if (industryId === "snooker-pos") {
    return SNOOKER_IMPLEMENTED_MODULES.has(moduleId as ModuleId);
  }
  return IMPLEMENTED_MODULES.has(moduleId as ModuleId);
}

export function isRestaurantLiveModule(moduleId: string): boolean {
  return RESTAURANT_LIVE_MODULES.includes(moduleId as ModuleId);
}
