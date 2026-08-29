import type { ModuleId } from "@/templates/types";

/**
 * Flutter bottom-nav screens — keep in sync with
 * diginizam-flutter `ModuleScreenRegistry`.
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

/**
 * In-screen capabilities (not bottom-nav tabs).
 * Categories live inside Products / Orders on mobile.
 */
export const MOBILE_CAPABILITY_MODULES = new Set<ModuleId>(["categories"]);

/**
 * Every module Software Control may toggle for Flutter.
 * Backend accepts these even when the industry portal catalog omits them.
 */
export const MOBILE_CONTROL_MODULES = new Set<ModuleId>([
  ...SOFTWARE_SUPPORTED_MODULES,
  ...MOBILE_CAPABILITY_MODULES,
]);

/** Dashboard cards Flutter renders with live data. */
export const MOBILE_DASHBOARD_CARDS = new Set<string>([
  "today-sales",
  "active-orders",
  "low-stock",
  "low-stock-ingredients",
  "low-stock-sizes",
  "ingredient-shortage",
  "fast-moving-parts",
  "top-products",
  "best-selling-item",
  "fast-selling",
  "best-selling-books",
  "top-vehicle-brands",
  "top-brands",
  "top-authors",
  "best-collection",
  "top-age-group",
  "warranty-claims",
  "product-returns",
  "returns-exchanges",
  "pending-purchases",
  "total-transactions",
  "gross-profit",
  "avg-order-value",
  "inventory-value",
  "recently-added",
  "customer-orders",
  "orders-in-progress",
  "takeaway-orders",
]);

/** Modules that have a feature panel wired to Flutter moduleSettings. */
export const MOBILE_MODULE_FEATURE_PANELS = new Set<string>([
  "dashboard",
  "menu",
  "products",
  "orders",
  "categories",
  "sales",
]);

const FOOD_INDUSTRIES = new Set(["restaurant", "food-cafe", "bakery"]);

/**
 * Mobile modules for an industry — only what the Flutter app ships.
 * This is the Software Control checklist (not the full portal catalog).
 */
export function mobileModulesForIndustry(industryId?: string | null): ModuleId[] {
  if (!industryId) {
    return ["dashboard", "products", "orders", "sales", "inventory", "staff", "categories"];
  }

  if (FOOD_INDUSTRIES.has(industryId)) {
    return [
      "dashboard",
      "menu",
      "orders",
      "kitchen",
      "sales",
      "tables",
      "inventory",
      "staff",
      "categories",
    ];
  }

  if (industryId === "pharmacy") {
    return ["dashboard", "products", "sales", "inventory", "staff", "categories"];
  }

  // Retail, auto-parts, book-store, electronics, fashion, grocery, etc.
  return [
    "dashboard",
    "products",
    "orders",
    "sales",
    "inventory",
    "staff",
    "categories",
  ];
}

/** Primary tabs commonly on by default for new retail mobile setups. */
export const MOBILE_APP_PRIMARY_MODULES: ModuleId[] = [
  "dashboard",
  "products",
  "orders",
  "sales",
];

export type MobileReadiness = "ready" | "capability" | "planned";

export function isSoftwareSupportedModule(moduleId: string): boolean {
  return SOFTWARE_SUPPORTED_MODULES.has(moduleId as ModuleId);
}

export function isMobileCapabilityModule(moduleId: string): boolean {
  return MOBILE_CAPABILITY_MODULES.has(moduleId as ModuleId);
}

export function isSoftwareControlModule(moduleId: string): boolean {
  return MOBILE_CONTROL_MODULES.has(moduleId as ModuleId);
}

export function getMobileReadiness(moduleId: string): MobileReadiness {
  if (isSoftwareSupportedModule(moduleId)) return "ready";
  if (isMobileCapabilityModule(moduleId)) return "capability";
  return "planned";
}

export function mobileReadinessLabel(status: MobileReadiness): string {
  switch (status) {
    case "ready":
      return "App tab";
    case "capability":
      return "Inside app";
    case "planned":
      return "Portal only";
  }
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

/** Industries that sell on mobile via Flutter Orders (POS). */
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

/**
 * Simple mobile-only dependencies (do not pull in portal modules like POS / purchases).
 */
const MOBILE_DEPENDENCIES: Partial<Record<ModuleId, ModuleId[]>> = {
  orders: ["products"],
  categories: ["products"],
  inventory: ["products"],
  sales: ["products"],
  kitchen: ["orders"],
};

function catalogProductModule(catalog: ModuleId[]): ModuleId {
  return catalog.includes("menu") && !catalog.includes("products") ? "menu" : "products";
}

function resolveMobileDeps(moduleId: ModuleId, catalog: ModuleId[]): ModuleId[] {
  const raw = MOBILE_DEPENDENCIES[moduleId] ?? [];
  const product = catalogProductModule(catalog);
  return raw.map((dep) => (dep === "products" ? product : dep)).filter((id) => catalog.includes(id));
}

/** Turn a mobile module on — also enables its mobile deps. */
export function enableMobileModule(
  moduleId: ModuleId,
  current: ModuleId[],
  catalog: ModuleId[],
): ModuleId[] {
  if (!catalog.includes(moduleId)) return current;
  const next = new Set(current.filter((id) => catalog.includes(id)));
  next.add(moduleId);
  for (const dep of resolveMobileDeps(moduleId, catalog)) {
    next.add(dep);
  }
  return catalog.filter((id) => next.has(id));
}

/** Turn a mobile module off — also disables mobile modules that depend on it. */
export function disableMobileModule(
  moduleId: ModuleId,
  current: ModuleId[],
  catalog: ModuleId[],
): ModuleId[] {
  if (moduleId === "dashboard") return current;
  const next = new Set(current.filter((id) => catalog.includes(id)));
  next.delete(moduleId);

  for (const candidate of catalog) {
    const deps = resolveMobileDeps(candidate, catalog);
    if (deps.includes(moduleId)) next.delete(candidate);
  }

  // Keep dashboard on when anything else is on
  if (next.size > 0) next.add("dashboard");

  return catalog.filter((id) => next.has(id));
}

/**
 * Apply mobile on/off onto the full template enabled list.
 * Portal-only modules are preserved; mobile catalog follows the toggles exactly.
 */
export function applyMobileModuleToggles(
  templateEnabled: ModuleId[] | undefined,
  mobileEnabled: ModuleId[],
  catalog: ModuleId[],
): ModuleId[] {
  const catalogSet = new Set(catalog);
  const portal = (templateEnabled ?? []).filter((id) => !catalogSet.has(id));
  const mobile = catalog.filter((id) => mobileEnabled.includes(id));
  // Always keep settings if it was there or is a shell module for the business
  if (!(portal.includes("settings") || (templateEnabled ?? []).includes("settings"))) {
    // settings stays portal-managed; don't invent it here
  }
  return [...new Set([...portal, ...mobile])];
}

/** Initial mobile enabled set from saved template. */
export function initialMobileEnabled(
  templateEnabled: ModuleId[] | undefined,
  catalog: ModuleId[],
  industryId?: string | null,
): ModuleId[] {
  const fromTemplate = (templateEnabled ?? []).filter((id) => catalog.includes(id));
  if (fromTemplate.length) {
    return ensureMobileOrdersModule(fromTemplate, industryId);
  }
  // New / empty: turn on the primary retail tabs that exist in this catalog
  const defaults = MOBILE_APP_PRIMARY_MODULES.filter((id) => catalog.includes(id));
  if (catalog.includes("categories")) defaults.push("categories");
  if (catalog.includes("inventory")) defaults.push("inventory");
  if (catalog.includes("staff")) defaults.push("staff");
  return ensureMobileOrdersModule(
    defaults.length ? defaults : [...catalog],
    industryId,
  );
}
