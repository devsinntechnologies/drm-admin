import type { ModuleId } from "./types";
import { MODULE_CATALOG } from "./modules";

/**
 * Fully customizable industry module plan.
 *
 * - compulsory: only the shell (dashboard + settings) — everything else can be toggled
 * - dependencies: module → modules it needs when enabled
 *   • Enabling a module also enables its dependencies
 *   • Disabling a module also disables every module that depends on it
 */
export type IndustryModulePlan = {
  industryId: string;
  compulsory: ModuleId[];
  /** module → modules it needs while enabled */
  dependencies: Partial<Record<ModuleId, ModuleId[]>>;
  summary: string;
};

const SHELL: ModuleId[] = ["dashboard", "settings"];

export const INDUSTRY_MODULE_PLANS: Record<string, IndustryModulePlan> = {
  "retail-store": {
    industryId: "retail-store",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      returns: ["sales", "products"],
      inventory: ["products"],
      categories: ["products"],
      purchases: ["suppliers", "inventory", "products"],
      expenses: ["reports"],
      delivery: ["sales", "customers"],
      accounting: ["sales", "reports"],
      hr: ["staff"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears POS, Sales, Inventory, and other product-linked modules.",
  },
  pharmacy: {
    industryId: "pharmacy",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      inventory: ["products"],
      categories: ["products"],
      batches: ["products", "inventory"],
      expiry: ["batches", "products"],
      prescriptions: ["products", "customers"],
      purchases: ["suppliers", "inventory", "products"],
      returns: ["sales", "products"],
      accounting: ["sales", "reports"],
      hr: ["staff"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Medicines (Products) drive Batches, Expiry, POS, and Prescriptions — remove Products and those go with it.",
  },
  restaurant: {
    industryId: "restaurant",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["menu"],
      orders: ["menu"],
      kitchen: ["orders", "menu"],
      tables: ["orders"],
      modifiers: ["menu"],
      recipes: ["menu", "inventory"],
      inventory: ["menu"],
      purchases: ["suppliers", "inventory"],
      shifts: ["staff"],
      delivery: ["orders", "customers"],
      accounting: ["orders", "reports"],
      hr: ["staff"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Menu also clears Orders, POS, Kitchen, Modifiers, and related food modules.",
  },
  boutique: {
    industryId: "boutique",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      variants: ["products"],
      collections: ["products"],
      inventory: ["products"],
      "sales-orders": ["products", "customers"],
      measurements: ["customers"],
      alterations: ["customers", "products"],
      returns: ["products", "customers"],
      purchases: ["suppliers", "inventory", "products"],
      delivery: ["sales-orders", "customers"],
      accounting: ["reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears Variants, Collections, POS, and related fashion modules.",
  },
  "salon-spa": {
    industryId: "salon-spa",
    compulsory: [...SHELL],
    dependencies: {
      appointments: ["services", "customers", "staff"],
      schedules: ["staff", "services"],
      packages: ["services", "customers"],
      memberships: ["customers", "packages"],
      commissions: ["staff", "services"],
      pos: ["services"],
      products: [],
      inventory: ["products"],
      accounting: ["pos", "reports"],
      hr: ["staff"],
      "multi-branch": ["staff"],
    },
    summary: "Fully customizable. Turning off Services also clears Appointments, Packages, and POS billing links.",
  },
  bakery: {
    industryId: "bakery",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      orders: ["products"],
      production: ["products", "inventory"],
      recipes: ["products", "inventory"],
      "custom-orders": ["products", "customers", "orders"],
      batches: ["production", "inventory"],
      wastage: ["inventory"],
      inventory: ["products"],
      purchases: ["suppliers", "inventory"],
      kitchen: ["orders", "products"],
      delivery: ["orders", "customers"],
      accounting: ["orders", "reports"],
    },
    summary: "Fully customizable. Turning off Products also clears Production, Recipes, Orders, and POS.",
  },
  "electric-store": {
    industryId: "electric-store",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      brands: [],
      models: ["brands", "products"],
      "serial-numbers": ["products"],
      inventory: ["products"],
      warranties: ["serial-numbers", "products", "customers"],
      returns: ["sales", "products"],
      purchases: ["suppliers", "inventory", "products"],
      delivery: ["sales", "customers"],
      accounting: ["sales", "reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears Serial Numbers, Models, Warranties, and POS.",
  },
  jewellery: {
    industryId: "jewellery",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      metals: [],
      stones: ["products"],
      collections: ["products"],
      inventory: ["products"],
      "custom-orders": ["products", "customers"],
      repairs: ["customers", "products"],
      certificates: ["products"],
      purchases: ["suppliers", "inventory"],
      delivery: ["sales", "customers"],
      accounting: ["sales", "reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears Stones, Collections, Custom Orders, and POS.",
  },
  "toys-store": {
    industryId: "toys-store",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      categories: ["products"],
      brands: ["products"],
      "age-groups": ["products"],
      inventory: ["products"],
      bundles: ["products"],
      promotions: ["products", "sales"],
      purchases: ["suppliers", "inventory", "products"],
      delivery: ["sales", "customers"],
      accounting: ["sales", "reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears Age Groups, Bundles, POS, and Sales links.",
  },
  "food-cafe": {
    industryId: "food-cafe",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["menu"],
      orders: ["menu"],
      kitchen: ["orders", "menu"],
      modifiers: ["menu"],
      takeaway: ["orders"],
      delivery: ["orders", "customers"],
      recipes: ["menu", "inventory"],
      inventory: ["menu"],
      purchases: ["suppliers", "inventory"],
      tables: ["orders"],
      accounting: ["orders", "reports"],
    },
    summary: "Fully customizable. Turning off Menu also clears Orders, Kitchen, Modifiers, and Takeaway.",
  },
  furniture: {
    industryId: "furniture",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      collections: ["products"],
      inventory: ["products"],
      quotations: ["products", "customers"],
      "custom-orders": ["products", "customers"],
      delivery: ["sales", "customers"],
      installations: ["delivery", "customers"],
      purchases: ["suppliers", "inventory", "products"],
      accounting: ["sales", "reports"],
      hr: ["staff"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Products also clears Quotations, Custom Orders, and POS.",
  },
  supermarket: {
    industryId: "supermarket",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      departments: ["products"],
      inventory: ["products"],
      batches: ["products", "inventory"],
      expiry: ["batches"],
      "price-management": ["products"],
      promotions: ["products", "sales"],
      purchases: ["suppliers", "inventory", "products"],
      counters: ["pos"],
      branches: ["inventory"],
      "multi-branch": ["branches"],
      accounting: ["sales", "reports"],
      hr: ["staff"],
    },
    summary: "Fully customizable. Turning off Products also clears Departments, Batches, POS, and Pricing tools.",
  },
  manufacturing: {
    industryId: "manufacturing",
    compulsory: [...SHELL],
    dependencies: {
      bom: ["raw-materials", "products"],
      "production-orders": ["bom", "products"],
      production: ["production-orders", "bom"],
      "work-centres": ["production"],
      "quality-control": ["production", "finished-stock"],
      "finished-stock": ["production", "products"],
      "sales-orders": ["products", "customers"],
      purchases: ["suppliers", "raw-materials"],
      accounting: ["reports"],
      hr: ["staff"],
      "multi-branch": ["finished-stock"],
    },
    summary: "Fully customizable. Turning off Products or BOM cascades through Production and Finished Stock.",
  },
  "auto-parts": {
    industryId: "auto-parts",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      categories: ["products"],
      brands: ["products"],
      "vehicle-compatibility": ["products"],
      inventory: ["products"],
      "serial-numbers": ["products"],
      warranties: ["products", "customers"],
      returns: ["sales", "products"],
      purchases: ["suppliers", "inventory", "products"],
      delivery: ["sales", "customers"],
      accounting: ["sales", "reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Parts (Products) also clears Compatibility, Serials, and POS.",
  },
  "book-store": {
    industryId: "book-store",
    compulsory: [...SHELL],
    dependencies: {
      pos: ["products"],
      sales: ["products"],
      categories: ["products"],
      authors: ["products"],
      publishers: ["products"],
      inventory: ["products"],
      orders: ["products", "customers"],
      returns: ["sales", "products"],
      purchases: ["suppliers", "inventory", "products"],
      delivery: ["orders", "customers"],
      accounting: ["sales", "reports"],
      "multi-branch": ["inventory"],
    },
    summary: "Fully customizable. Turning off Books (Products) also clears Authors, Publishers, and POS.",
  },
};

export function getIndustryModulePlan(industryId: string): IndustryModulePlan | undefined {
  return INDUSTRY_MODULE_PLANS[industryId];
}

function expandDependencies(
  moduleId: ModuleId,
  plan: IndustryModulePlan,
  seen = new Set<ModuleId>(),
): ModuleId[] {
  if (seen.has(moduleId)) return [];
  seen.add(moduleId);
  const direct = plan.dependencies[moduleId] ?? [];
  const nested = direct.flatMap((dep) => expandDependencies(dep, plan, seen));
  return Array.from(new Set([...direct, ...nested]));
}

function filterAvailable(deps: ModuleId[], available: Set<ModuleId>): ModuleId[] {
  return deps.filter((id) => available.has(id));
}

/** Direct + nested dependents: modules that need `moduleId` (or need something that needs it). */
export function getDependents(
  industryId: string,
  moduleId: ModuleId,
  availableModules: ModuleId[],
): ModuleId[] {
  const plan = getIndustryModulePlan(industryId);
  if (!plan) return [];

  const available = new Set(availableModules);
  const dependents = new Set<ModuleId>();

  const visit = (target: ModuleId) => {
    for (const candidate of availableModules) {
      if (candidate === target || dependents.has(candidate)) continue;
      const needs = filterAvailable(expandDependencies(candidate, plan), available);
      if (needs.includes(target)) {
        dependents.add(candidate);
        visit(candidate);
      }
    }
  };

  visit(moduleId);
  return Array.from(dependents);
}

/** Only shell modules stay locked */
export function getLockedModules(
  industryId: string,
  _enabledModules: ModuleId[],
  availableModules: ModuleId[],
): Set<ModuleId> {
  const plan = getIndustryModulePlan(industryId);
  const available = new Set(availableModules);
  return new Set((plan?.compulsory ?? SHELL).filter((id) => available.has(id)));
}

export function getLockReason(
  industryId: string,
  moduleId: ModuleId,
  _enabledModules: ModuleId[],
  _availableModules: ModuleId[],
): string | null {
  const plan = getIndustryModulePlan(industryId);
  if (plan?.compulsory.includes(moduleId)) {
    return "Shell module — always available";
  }
  return null;
}

export function canDisableModule(
  industryId: string,
  moduleId: ModuleId,
  enabledModules: ModuleId[],
  availableModules: ModuleId[],
): { ok: boolean; reason?: string } {
  if (!enabledModules.includes(moduleId)) {
    return { ok: true };
  }
  const reason = getLockReason(industryId, moduleId, enabledModules, availableModules);
  if (reason) return { ok: false, reason };
  return { ok: true };
}

/** Enable module + its dependency tree */
export function withDependenciesEnabled(
  industryId: string,
  moduleId: ModuleId,
  current: ModuleId[],
  availableModules: ModuleId[],
): ModuleId[] {
  const plan = getIndustryModulePlan(industryId);
  const available = new Set(availableModules);
  const next = new Set(current);
  next.add(moduleId);
  if (plan) {
    for (const dep of filterAvailable(expandDependencies(moduleId, plan), available)) {
      next.add(dep);
    }
  }
  return Array.from(next);
}

/** Disable module + every module that depends on it */
export function withDependentsDisabled(
  industryId: string,
  moduleId: ModuleId,
  current: ModuleId[],
  availableModules: ModuleId[],
): { next: ModuleId[]; removed: ModuleId[] } {
  const locked = getLockedModules(industryId, current, availableModules);
  if (locked.has(moduleId)) {
    return { next: current, removed: [] };
  }

  const cascade = new Set<ModuleId>([moduleId, ...getDependents(industryId, moduleId, availableModules)]);
  const removed = current.filter((id) => cascade.has(id) && !locked.has(id));
  const next = current.filter((id) => !removed.includes(id));
  return { next, removed };
}

export function getAvailableModules(
  defaultModules: ModuleId[],
  optionalModules: ModuleId[],
): ModuleId[] {
  return Array.from(new Set([...defaultModules, ...optionalModules]));
}

export function moduleLabel(id: ModuleId) {
  return MODULE_CATALOG[id]?.label ?? id;
}
