import { getIndustryById } from "@/templates/industries";
import type { ModuleId } from "@/templates/types";

/** API family used to create/list staff for a business industry. */
export type StaffCreateFamily = "restaurant" | "retail" | "pharmacy";

export type StaffRoleDef = {
  key: string;
  label: string;
};

const RESTAURANT_ROLES: StaffRoleDef[] = [
  { key: "waiter", label: "Waiter" },
  { key: "kitchen", label: "Kitchen" },
];

const RETAIL_ROLES: StaffRoleDef[] = [
  { key: "store_manager", label: "Store manager" },
  { key: "cashier", label: "Cashier" },
  { key: "inventory_clerk", label: "Inventory clerk" },
];

const PHARMACY_ROLES: StaffRoleDef[] = [
  { key: "pharmacy_manager", label: "Pharmacy manager" },
  { key: "pharmacist", label: "Pharmacist" },
  { key: "cashier", label: "Cashier" },
  { key: "shift_incharge", label: "Shift incharge" },
  { key: "inventory_manager", label: "Inventory manager" },
];

/** Food-ops industries that use waiter/kitchen mobile logins. */
const RESTAURANT_INDUSTRY_IDS = new Set(["restaurant", "food-cafe", "bakery"]);

export function getStaffCreateFamily(industryId: string | null | undefined): StaffCreateFamily {
  if (!industryId) return "restaurant";
  if (industryId === "pharmacy") return "pharmacy";
  if (RESTAURANT_INDUSTRY_IDS.has(industryId)) return "restaurant";

  const industry = getIndustryById(industryId);
  if (industry?.family === "food-operations") return "restaurant";
  return "retail";
}

/**
 * Creatable staff roles for Software Control / Team.
 * Optionally hide kitchen when that module is not enabled.
 */
export function getCreatableStaffRoles(
  industryId: string | null | undefined,
  enabledModules?: ModuleId[] | string[] | null,
): StaffRoleDef[] {
  const family = getStaffCreateFamily(industryId);
  let roles =
    family === "pharmacy"
      ? PHARMACY_ROLES
      : family === "retail"
        ? RETAIL_ROLES
        : RESTAURANT_ROLES;

  if (enabledModules?.length) {
    const enabled = new Set(enabledModules);
    roles = roles.filter((role) => {
      if (role.key === "kitchen" && !enabled.has("kitchen")) return false;
      return true;
    });
  }

  return roles;
}

/** Role keys that appear in the Software Control permissions matrix (staff + business_admin). */
export function getSoftwareRoleKeysForIndustry(
  industryId: string | null | undefined,
): string[] {
  const staff = getCreatableStaffRoles(industryId).map((r) => r.key);
  return [...staff, "business_admin"];
}

export function staffRoleLabel(roleKey: string): string {
  const all = [...RESTAURANT_ROLES, ...RETAIL_ROLES, ...PHARMACY_ROLES, { key: "business_admin", label: "Business admin" }];
  return all.find((r) => r.key === roleKey)?.label ?? roleKey.replace(/_/g, " ");
}

export function manageUsersHrefForIndustry(
  industryId: string | null | undefined,
  businessId: string,
): string {
  const family = getStaffCreateFamily(industryId);
  const base =
    family === "pharmacy"
      ? "/dashboard/businessAdmin/users"
      : family === "retail"
        ? "/dashboard/businessAdmin/retail/staff"
        : "/dashboard/businessAdmin/users";
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}businessId=${encodeURIComponent(businessId)}`;
}
