import type { ModuleId } from "@/templates/types";

/**
 * Modules the Flutter app currently ships **nav screens** for.
 * Keep in sync with diginizam-flutter ModuleScreenRegistry.
 */
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

/** Primary mobile app tabs the Flutter app ships today (simplified admin control). */
export const MOBILE_APP_PRIMARY_MODULES: ModuleId[] = [
  "dashboard",
  "menu",
  "products",
  "orders",
  "sales",
];

/**
 * Dashboard stat cards Flutter renders with live data (not placeholder "—" cards).
 * Keep in sync with diginizam-flutter restaurant_dashboard.dart.
 */
export const MOBILE_DASHBOARD_CARDS = new Set<string>([
  "today-sales",
  "active-orders",
  "low-stock",
  "low-stock-ingredients",
]);

/** Modules that have a §7 feature panel wired to Flutter moduleSettings. */
export const MOBILE_MODULE_FEATURE_PANELS = new Set<string>([
  "dashboard",
  "menu",
  "products",
  "orders",
  "categories",
]);

/**
 * Mobile capabilities that are gated from admin but are NOT bottom-nav tabs.
 * (e.g. Categories UI lives inside Products / Orders.)
 */
export const MOBILE_CAPABILITY_MODULES = new Set<ModuleId>(["categories"]);

export type MobileReadiness = "ready" | "capability" | "planned";

export function isSoftwareSupportedModule(moduleId: string): boolean {
  return SOFTWARE_SUPPORTED_MODULES.has(moduleId as ModuleId);
}

export function isMobileCapabilityModule(moduleId: string): boolean {
  return MOBILE_CAPABILITY_MODULES.has(moduleId as ModuleId);
}

/** Explicit mobile status for Control / role matrix badges. */
export function getMobileReadiness(moduleId: string): MobileReadiness {
  if (isSoftwareSupportedModule(moduleId)) return "ready";
  if (isMobileCapabilityModule(moduleId)) return "capability";
  return "planned";
}

export function mobileReadinessLabel(status: MobileReadiness): string {
  switch (status) {
    case "ready":
      return "Mobile";
    case "capability":
      return "Mobile capability";
    case "planned":
      return "Portal only";
  }
}

/** Modules that appear in Software Control (Flutter tabs + in-screen capabilities). */
export function isSoftwareControlModule(moduleId: string): boolean {
  return isSoftwareSupportedModule(moduleId) || isMobileCapabilityModule(moduleId);
}

export function filterSoftwareControlModules(moduleIds: ModuleId[]): ModuleId[] {
  return moduleIds.filter((id) => isSoftwareControlModule(id));
}

/** Bottom-nav modules + categories capability for the role matrix. */
export function softwareControlRoleModules(
  enabledModules: ModuleId[],
  options?: { includeCategories?: boolean },
): ModuleId[] {
  const modules = enabledModules.filter((id) => isSoftwareSupportedModule(id));
  if (options?.includeCategories && !modules.includes("categories")) {
    modules.push("categories");
  }
  return modules;
}

/** Industries that sell on mobile via Flutter Orders (POS), not Inventory. */
export const RETAIL_MOBILE_ORDERS_INDUSTRIES = new Set([
  "retail-store",
  "auto-parts",
  "book-store",
  "electronics",
  "fashion",
  "grocery",
  "jewelry",
  "furniture",
]);

export function industryUsesMobileOrders(industryId?: string | null): boolean {
  return Boolean(industryId && RETAIL_MOBILE_ORDERS_INDUSTRIES.has(industryId));
}

/**
 * Ensure Orders is available/enabled in Software Control for retail mobile POS.
 * Inventory stays available for stock clerks; Orders is the sell tab on Flutter.
 */
export function ensureMobileOrdersModule(
  modules: ModuleId[],
  industryId?: string | null,
): ModuleId[] {
  if (!industryUsesMobileOrders(industryId)) return modules;
  if (modules.includes("orders")) return modules;
  const next = [...modules];
  const afterProducts = next.findIndex((id) => id === "products" || id === "menu");
  if (afterProducts >= 0) {
    next.splice(afterProducts + 1, 0, "orders");
  } else {
    next.push("orders");
  }
  return next;
}
