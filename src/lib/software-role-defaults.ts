import type { ModuleId } from "@/templates/types";
import {
  SOFTWARE_ROLE_KEYS,
  serializeRoleAccess,
  type RoleAccessMap,
  type SoftwareRoleKey,
} from "@/lib/role-access";
import { isSoftwareSupportedModule } from "@/lib/software-supported-modules";

export const DEFAULT_ROLE_MODULES: Record<SoftwareRoleKey, ModuleId[]> = {
  waiter: ["orders"],
  kitchen: ["kitchen"],
  business_admin: ["dashboard", "orders", "kitchen", "sales", "menu", "tables", "staff", "inventory"],
};

export const DEFAULT_ROLE_LANDING: Record<SoftwareRoleKey, ModuleId> = {
  waiter: "orders",
  kitchen: "kitchen",
  business_admin: "dashboard",
};

export function mobileModulesFromEnabled(enabledModules: ModuleId[]): ModuleId[] {
  return enabledModules.filter((id) => isSoftwareSupportedModule(id));
}

/** All enabled modules — used for role access (no platform blocking). */
export function roleModulesFromEnabled(enabledModules: ModuleId[]): ModuleId[] {
  return [...enabledModules];
}

export function resolveRoleEntry(
  roleAccess: RoleAccessMap,
  role: SoftwareRoleKey,
  enabledModules: ModuleId[],
) {
  const existing = roleAccess[role];
  if (existing?.modules?.length) return existing;
  const defaults = DEFAULT_ROLE_MODULES[role].filter((id) => enabledModules.includes(id));
  return {
    modules: defaults.length ? defaults : [...enabledModules],
    defaultModule: DEFAULT_ROLE_LANDING[role],
  };
}

/** Build full role access map from defaults when wizard/admin state is still empty. */
export function buildDefaultRoleAccessMap(enabledModules: ModuleId[]): RoleAccessMap {
  const map: RoleAccessMap = {};
  for (const role of SOFTWARE_ROLE_KEYS) {
    const entry = resolveRoleEntry({}, role, enabledModules);
    map[role] = entry;
  }
  return map;
}

export function serializeResolvedRoleAccess(enabledModules: ModuleId[], roleAccess: RoleAccessMap) {
  const resolved: RoleAccessMap = {};
  for (const role of SOFTWARE_ROLE_KEYS) {
    resolved[role] = resolveRoleEntry(roleAccess, role, enabledModules);
  }
  return serializeRoleAccess(resolved);
}
