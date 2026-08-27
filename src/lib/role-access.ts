import type { ModuleId } from "@/templates/types";

export type RoleAccessEntry = {
  modules: ModuleId[];
  defaultModule?: ModuleId;
};

export type RoleAccessMap = Partial<
  Record<"waiter" | "kitchen" | "business_admin" | "super_admin", RoleAccessEntry>
>;

export const SOFTWARE_ROLE_KEYS = ["waiter", "kitchen", "business_admin"] as const;

export type SoftwareRoleKey = (typeof SOFTWARE_ROLE_KEYS)[number];

export const SOFTWARE_ROLE_LABELS: Record<SoftwareRoleKey, string> = {
  waiter: "Waiter",
  kitchen: "Kitchen",
  business_admin: "Business admin",
};

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
    result[role as keyof RoleAccessMap] = {
      modules,
      ...(defaultModule ? { defaultModule } : {}),
    };
  }
  return result;
}

export function serializeRoleAccess(roleAccess: RoleAccessMap): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [role, entry] of Object.entries(roleAccess)) {
    if (!entry?.modules?.length && !entry?.defaultModule) continue;
    out[role] = {
      modules: entry.modules ?? [],
      ...(entry.defaultModule ? { defaultModule: entry.defaultModule } : {}),
    };
  }
  return out;
}
