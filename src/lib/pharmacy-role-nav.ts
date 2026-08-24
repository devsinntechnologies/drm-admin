import type { WorkspaceNavTab } from "@/lib/build-business-workspace-nav";
import { appendBusinessId, BUSINESS_ADMIN_BASE } from "@/lib/module-routes";

export const PHARMACY_STAFF_ROLES = [
  "pharmacy_manager",
  "pharmacist",
  "cashier",
  "shift_incharge",
  "inventory_manager",
] as const;

export type PharmacyStaffRole = (typeof PHARMACY_STAFF_ROLES)[number];

/** Module ids each pharmacy role may open. Owner / superadmin get every enabled module. */
export const PHARMACY_ROLE_NAV: Record<string, string[]> = {
  business_admin: ["*"],
  super_admin: ["*"],
  pharmacy_manager: [
    "dashboard",
    "pos",
    "products",
    "categories",
    "batches",
    "expiry",
    "prescriptions",
    "cdss",
    "controlled-substances",
    "inventory",
    "purchases",
    "suppliers",
    "customers",
    "sales",
    "invoices",
    "returns",
    "shifts",
    "reports",
    "accounting",
    "branches",
    "staff",
    "users",
  ],
  pharmacist: [
    "dashboard",
    "pos",
    "products",
    "categories",
    "prescriptions",
    "cdss",
    "controlled-substances",
    "customers",
    "sales",
    "invoices",
    "returns",
    "shifts",
  ],
  cashier: ["dashboard", "pos", "customers", "sales", "invoices", "returns", "shifts"],
  shift_incharge: ["dashboard", "pos", "shifts", "sales", "invoices", "customers", "staff", "users"],
  inventory_manager: [
    "dashboard",
    "products",
    "categories",
    "batches",
    "expiry",
    "inventory",
    "purchases",
    "suppliers",
    "reports",
  ],
  store_manager: [
    "dashboard",
    "pos",
    "products",
    "categories",
    "inventory",
    "purchases",
    "suppliers",
    "customers",
    "returns",
    "sales",
    "invoices",
    "expenses",
    "reports",
    "staff",
    "users",
  ],
  inventory_clerk: [
    "dashboard",
    "products",
    "categories",
    "inventory",
    "purchases",
    "suppliers",
    "reports",
  ],
};

export function isPharmacyStaffRole(role: string | null | undefined): boolean {
  return PHARMACY_STAFF_ROLES.includes((role ?? "") as PharmacyStaffRole);
}

export function isPharmacyWorkspaceRole(role: string | null | undefined): boolean {
  const key = (role ?? "").trim();
  return key === "business_admin" || key === "super_admin" || isPharmacyStaffRole(key);
}

function normalizeModuleId(moduleId: string): string {
  if (moduleId === "invoices") return "sales";
  if (moduleId === "users") return "staff";
  if (moduleId === "public-catalog") return "public-data";
  return moduleId;
}

export function canAccessWorkspacePage(role: string | null | undefined, moduleId: string): boolean {
  const key = (role ?? "").trim();
  if (key === "super_admin" || key === "business_admin") return true;
  const allowed = PHARMACY_ROLE_NAV[key];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  const id = normalizeModuleId(moduleId);
  return allowed.includes(id) || allowed.includes(moduleId);
}

export function filterPharmacyNavForRole(
  tabs: WorkspaceNavTab[],
  role: string | null | undefined,
): WorkspaceNavTab[] {
  const key = (role ?? "").trim();
  if (key === "super_admin" || key === "business_admin") return tabs;
  const allowed = PHARMACY_ROLE_NAV[key];
  if (!allowed) return tabs.filter((tab) => tab.key === "dashboard");
  if (allowed.includes("*")) return tabs;
  return tabs.filter((tab) => allowed.includes(tab.key));
}

export function workspaceHomePath(role: string | null | undefined, businessId?: string | null): string {
  const key = (role ?? "").trim();
  let path = BUSINESS_ADMIN_BASE;
  if (key === "cashier" || key === "shift_incharge") path = `${BUSINESS_ADMIN_BASE}/pos`;
  else if (key === "inventory_manager") path = `${BUSINESS_ADMIN_BASE}/inventory`;
  return appendBusinessId(path, businessId);
}
