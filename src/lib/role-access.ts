import type { ModuleId } from "@/templates/types";
import { getSoftwareRoleKeysForIndustry, staffRoleLabel } from "@/lib/staff-role-catalog";

export type RoleAccessEntry = {
  modules: ModuleId[];
  defaultModule?: ModuleId;
};

/** Any staff / admin role key used in moduleSettings.roleAccess. */
export type SoftwareRoleKey = string;

export type RoleAccessMap = Partial<Record<string, RoleAccessEntry>>;

/** @deprecated Prefer getSoftwareRoleKeysForIndustry(industryId) */
export const SOFTWARE_ROLE_KEYS = ["waiter", "kitchen", "business_admin"] as const;

export const SOFTWARE_ROLE_LABELS: Record<string, string> = {
  waiter: "Waiter",
  kitchen: "Kitchen",
  business_admin: "Business admin",
  store_manager: "Store manager",
  cashier: "Cashier",
  inventory_clerk: "Inventory clerk",
  pharmacy_manager: "Pharmacy manager",
  pharmacist: "Pharmacist",
  shift_incharge: "Shift incharge",
  inventory_manager: "Inventory manager",
};

export function roleKeyLabel(role: string): string {
  return SOFTWARE_ROLE_LABELS[role] ?? staffRoleLabel(role);
}

export function softwareRoleKeysForIndustry(industryId: string | null | undefined): string[] {
  return getSoftwareRoleKeysForIndustry(industryId);
}

export function parseRoleAccess(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): RoleAccessMap {
  const raw = moduleSettings?.roleAccess;
  if (!raw || typeof raw !== "object") return {};
  const result: RoleAccessMap = {};
  for (const [role, entry] of Object.entries(raw)) {
    if (!entry || typeof entry !== "object") continue;
    const modules = Array.isArray((entry as RoleAccessEntry).modules)
      ? ((entry as RoleAccessEntry).modules as ModuleId[])
      : [];
    const defaultModule = (entry as RoleAccessEntry).defaultModule;
    result[role] = {
      modules,
      ...(defaultModule ? { defaultModule } : {}),
    };
  }
  return result;
}

export function serializeRoleAccess(roleAccess: RoleAccessMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [role, entry] of Object.entries(roleAccess)) {
    const modules = entry?.modules ?? [];
    if (!modules.length) continue;
    const defaultModule =
      entry?.defaultModule && modules.includes(entry.defaultModule)
        ? entry.defaultModule
        : modules[0];
    out[role] = {
      modules,
      defaultModule,
    };
  }
  return out;
}

/** Normalize login role names to roleAccess keys. */
export function normalizePortalRole(role: string | null | undefined): string {
  const value = String(role ?? "")
    .toLowerCase()
    .trim();
  if (value === "businessadmin" || value === "admin") return "business_admin";
  return value;
}
