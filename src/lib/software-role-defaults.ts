import type { ModuleId } from "@/templates/types";
import {
  serializeRoleAccess,
  softwareRoleKeysForIndustry,
  type RoleAccessEntry,
  type RoleAccessMap,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import {
  applyMobileModuleToggles,
  isSoftwareControlModule,
  isSoftwareSupportedModule,
  industryUsesMobileOrders,
  mobileModulesForIndustry,
} from "@/lib/software-supported-modules";

const DEFAULT_ROLE_MODULES: Record<string, ModuleId[]> = {
  waiter: ["orders"],
  kitchen: ["kitchen"],
  business_admin: [
    "dashboard",
    "orders",
    "kitchen",
    "sales",
    "menu",
    "tables",
    "staff",
    "inventory",
    "pos",
    "products",
    "categories",
    "reports",
  ],
  store_manager: [
    "dashboard",
    "orders",
    "sales",
    "products",
    "categories",
    "inventory",
    "staff",
    "reports",
  ],
  cashier: ["orders", "sales", "products", "categories", "reports"],
  inventory_clerk: ["products", "categories", "inventory", "staff"],
  pharmacy_manager: [
    "dashboard",
    "pos",
    "sales",
    "products",
    "categories",
    "inventory",
    "staff",
    "reports",
  ],
  pharmacist: ["pos", "prescriptions", "products", "categories", "sales"],
  shift_incharge: ["pos", "shifts", "sales"],
  inventory_manager: ["products", "inventory", "purchases", "batches", "expiry"],
};

const DEFAULT_ROLE_LANDING: Record<string, ModuleId> = {
  waiter: "orders",
  kitchen: "kitchen",
  business_admin: "dashboard",
  store_manager: "dashboard",
  cashier: "orders",
  inventory_clerk: "inventory",
  pharmacy_manager: "dashboard",
  pharmacist: "pos",
  shift_incharge: "pos",
  inventory_manager: "inventory",
};

export { DEFAULT_ROLE_MODULES, DEFAULT_ROLE_LANDING };

export function mobileModulesFromEnabled(enabledModules: ModuleId[]): ModuleId[] {
  return enabledModules.filter((id) => isSoftwareSupportedModule(id));
}

/** Preserve portal-only module grants when saving mobile-only Software Control. */
export function mergeRoleAccessPreservingPortal(
  existing: RoleAccessMap,
  mobileRoleAccess: RoleAccessMap,
  mobileModules: ModuleId[],
  allEnabledModules: ModuleId[],
  industryId?: string | null,
): RoleAccessMap {
  const keys = softwareRoleKeysForIndustry(industryId);
  const merged: RoleAccessMap = { ...existing };

  for (const role of keys) {
    const mobileEntry = resolveRoleEntry(mobileRoleAccess, role, mobileModules);
    const portalModules = (existing[role]?.modules ?? []).filter(
      (id) => !isSoftwareControlModule(id) && allEnabledModules.includes(id),
    );
    const modules = [
      ...portalModules,
      ...mobileEntry.modules.filter((id) => mobileModules.includes(id)),
    ];

    if (!modules.length) {
      merged[role] = { modules: [] };
      continue;
    }

    merged[role] = normalizeRoleEntry(
      {
        modules,
        defaultModule:
          mobileEntry.defaultModule && modules.includes(mobileEntry.defaultModule)
            ? mobileEntry.defaultModule
            : modules[0],
      },
      allEnabledModules,
    );
  }

  return merged;
}

/** Merge mobile toggles into the full template enabled list (portal modules preserved). */
export function mergeEnabledModulesPreservingPortal(
  mobileEnabled: ModuleId[],
  templateEnabled: ModuleId[] | undefined,
  industryId?: string | null,
): ModuleId[] {
  const catalog = mobileModulesForIndustry(industryId);
  return applyMobileModuleToggles(templateEnabled, mobileEnabled, catalog);
}

/** Strip role matrix state to mobile modules only (for Software Control UI). */
export function mobileRoleAccessView(
  roleAccess: RoleAccessMap,
  mobileModules: ModuleId[],
  industryId?: string | null,
): RoleAccessMap {
  const keys = softwareRoleKeysForIndustry(industryId);
  const view: RoleAccessMap = {};

  for (const role of keys) {
    view[role] = resolveRoleEntry(roleAccess, role, mobileModules);
  }

  return view;
}

/** All enabled modules — used for role access (portal + mobile). */
export function roleModulesFromEnabled(enabledModules: ModuleId[]): ModuleId[] {
  return [...enabledModules];
}

export function normalizeRoleEntry(
  entry: RoleAccessEntry,
  enabledModules: ModuleId[],
): RoleAccessEntry {
  const enabledSet = new Set(enabledModules);
  const modules = (entry.modules ?? []).filter((id) => enabledSet.has(id));
  if (!modules.length) {
    return { modules: [] };
  }
  const defaultModule =
    entry.defaultModule && modules.includes(entry.defaultModule)
      ? entry.defaultModule
      : modules[0];
  return { modules, defaultModule };
}

export function resolveRoleEntry(
  roleAccess: RoleAccessMap,
  role: SoftwareRoleKey,
  enabledModules: ModuleId[],
) {
  const existing = roleAccess[role];
  // An explicit matrix (including modules: []) must win. Empty used to be
  // treated as "unset" and the defaults snapped every checkbox back on.
  if (existing && Array.isArray(existing.modules)) {
    return normalizeRoleEntry(existing, enabledModules);
  }
  const defaults = (DEFAULT_ROLE_MODULES[role] ?? []).filter((id) => enabledModules.includes(id));
  const modules = defaults.length ? defaults : [...enabledModules];
  const landing = DEFAULT_ROLE_LANDING[role] ?? modules[0];
  return normalizeRoleEntry(
    {
      modules,
      defaultModule: landing && modules.includes(landing) ? landing : modules[0],
    },
    enabledModules,
  );
}

export function buildDefaultRoleAccessMap(
  enabledModules: ModuleId[],
  industryId?: string | null,
): RoleAccessMap {
  const keys = softwareRoleKeysForIndustry(industryId);
  const map: RoleAccessMap = {};
  for (const role of keys) {
    map[role] = resolveRoleEntry({}, role, enabledModules);
  }
  return map;
}

export function normalizeRoleAccessForModules(
  roleAccess: RoleAccessMap,
  enabledModules: ModuleId[],
  industryId?: string | null,
): RoleAccessMap {
  const keys = new Set([
    ...Object.keys(roleAccess),
    ...softwareRoleKeysForIndustry(industryId),
  ]);
  const next: RoleAccessMap = {};
  for (const role of keys) {
    const entry = roleAccess[role];
    if (!entry) continue;
    next[role] = normalizeRoleEntry(entry, enabledModules);
  }
  return next;
}

export function serializeResolvedRoleAccess(
  enabledModules: ModuleId[],
  roleAccess: RoleAccessMap,
  industryId?: string | null,
) {
  const keys = softwareRoleKeysForIndustry(industryId);
  const resolved: RoleAccessMap = {};
  for (const role of keys) {
    resolved[role] = resolveRoleEntry(roleAccess, role, enabledModules);
  }
  return serializeRoleAccess(resolved);
}

/**
 * Seed Orders onto retail sell roles only when that role has no saved matrix yet.
 * Never overrides an explicit admin uncheck — that was making Orders "stuck" on.
 */
export function ensureRetailRoleOrdersAccess(
  roleAccess: RoleAccessMap,
  enabledModules: ModuleId[],
  industryId?: string | null,
): RoleAccessMap {
  if (!industryUsesMobileOrders(industryId) || !enabledModules.includes("orders")) {
    return roleAccess;
  }

  const sellRoles: SoftwareRoleKey[] = ["store_manager", "cashier", "business_admin"];
  const next: RoleAccessMap = { ...roleAccess };

  for (const role of sellRoles) {
    const existing = roleAccess[role];
    if (existing?.modules?.length) {
      // Explicit matrix from admin — keep as saved (including Orders unchecked).
      next[role] = normalizeRoleEntry(existing, enabledModules);
      continue;
    }
    next[role] = resolveRoleEntry({}, role, enabledModules);
  }

  return next;
}

/** Modules allowed for a logged-in portal role (null = unrestricted). */
export function allowedModulesForRole(
  roleAccess: RoleAccessMap,
  role: string | null | undefined,
  enabledModules: ModuleId[],
): ModuleId[] | null {
  const normalized = String(role ?? "")
    .toLowerCase()
    .trim();
  if (!normalized || normalized === "super_admin") return null;
  if (normalized === "businessadmin" || normalized === "admin") {
    const entry = roleAccess.business_admin;
    if (!entry?.modules?.length) return null;
    return normalizeRoleEntry(entry, enabledModules).modules;
  }
  const entry = roleAccess[normalized];
  if (!entry?.modules?.length) {
    if (normalized === "business_admin") return null;
    const defaults = resolveRoleEntry({}, normalized, enabledModules).modules;
    return defaults.length ? defaults : [];
  }
  return normalizeRoleEntry(entry, enabledModules).modules;
}
