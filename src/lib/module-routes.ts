import type { ModuleId } from "@/templates/types";

export const BUSINESS_ADMIN_BASE = "/dashboard/businessAdmin";

/** Maps template module ids to existing or generated workspace routes. */
export const MODULE_HREF: Partial<Record<ModuleId, string>> = {
  dashboard: BUSINESS_ADMIN_BASE,
  products: `${BUSINESS_ADMIN_BASE}/products`,
  categories: `${BUSINESS_ADMIN_BASE}/categories`,
  inventory: `${BUSINESS_ADMIN_BASE}/ingredients`,
  orders: `${BUSINESS_ADMIN_BASE}/orders`,
  kitchen: `${BUSINESS_ADMIN_BASE}/kitchen`,
  tables: `${BUSINESS_ADMIN_BASE}/tables`,
  sales: `${BUSINESS_ADMIN_BASE}/invoices`,
  staff: `${BUSINESS_ADMIN_BASE}/users`,
  menu: `${BUSINESS_ADMIN_BASE}/products`,
  "public-catalog": `${BUSINESS_ADMIN_BASE}/public-data`,
  settings: `${BUSINESS_ADMIN_BASE}/settings`,
};

const PHARMACY_MODULE_HREF: Partial<Record<ModuleId, string>> = {
  inventory: `${BUSINESS_ADMIN_BASE}/inventory`,
  pos: `${BUSINESS_ADMIN_BASE}/pos`,
  batches: `${BUSINESS_ADMIN_BASE}/batches`,
  expiry: `${BUSINESS_ADMIN_BASE}/expiry`,
  suppliers: `${BUSINESS_ADMIN_BASE}/suppliers`,
  purchases: `${BUSINESS_ADMIN_BASE}/purchases`,
  prescriptions: `${BUSINESS_ADMIN_BASE}/prescriptions`,
  customers: `${BUSINESS_ADMIN_BASE}/customers`,
  returns: `${BUSINESS_ADMIN_BASE}/returns`,
  reports: `${BUSINESS_ADMIN_BASE}/reports`,
  accounting: `${BUSINESS_ADMIN_BASE}/accounting`,
  shifts: `${BUSINESS_ADMIN_BASE}/shifts`,
  cdss: `${BUSINESS_ADMIN_BASE}/cdss`,
  "controlled-substances": `${BUSINESS_ADMIN_BASE}/controlled-substances`,
  branches: `${BUSINESS_ADMIN_BASE}/branches`,
  sales: `${BUSINESS_ADMIN_BASE}/invoices`,
  staff: `${BUSINESS_ADMIN_BASE}/users`,
};

const RETAIL_MODULE_IDS = [
  "pos",
  "purchases",
  "suppliers",
  "customers",
  "returns",
  "expenses",
  "reports",
  "staff",
] as const;

const RETAIL_MODULE_HREF: Partial<Record<ModuleId, string>> = {
  ...Object.fromEntries(RETAIL_MODULE_IDS.map((id) => [id, `${BUSINESS_ADMIN_BASE}/retail/${id}`])),
  inventory: `${BUSINESS_ADMIN_BASE}/products`,
} as Partial<Record<ModuleId, string>>;

const SNOOKER_MODULE_IDS = [
  "tables",
  "pos",
  "billing-pricing",
  "customers",
  "credit-udhar",
  "discounts",
  "expenses",
  "shifts",
  "reports",
  "staff",
  "audit-logs",
  "notifications",
  "branches",
  "settings",
  "memberships",
  "loyalty",
  "tournaments",
  "table-booking",
  "subscriptions",
] as const;

const SNOOKER_MODULE_HREF: Partial<Record<ModuleId, string>> = Object.fromEntries(
  SNOOKER_MODULE_IDS.map((id) => [id, `${BUSINESS_ADMIN_BASE}/snooker/${id}`]),
) as Partial<Record<ModuleId, string>>;

export function getModuleHref(moduleId: ModuleId | string, industryId?: string | null): string {
  if (industryId === "pharmacy") {
    const pharmacyHref = PHARMACY_MODULE_HREF[moduleId as ModuleId];
    if (pharmacyHref) return pharmacyHref;
  }
  if (industryId === "snooker-pos") {
    const snookerHref = SNOOKER_MODULE_HREF[moduleId as ModuleId];
    if (snookerHref) return snookerHref;
  }
  if (industryId === "retail-store") {
    const retailHref = RETAIL_MODULE_HREF[moduleId as ModuleId];
    if (retailHref) return retailHref;
  }
  return MODULE_HREF[moduleId as ModuleId] ?? `${BUSINESS_ADMIN_BASE}/modules/${moduleId}`;
}

export function appendBusinessId(href: string, businessId?: string | null): string {
  if (!businessId) return href;
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}businessId=${businessId}`;
}

export function pathnameToModuleId(pathname: string): string | null {
  const path = pathname.split("?")[0];

  if (path === BUSINESS_ADMIN_BASE || path === `${BUSINESS_ADMIN_BASE}/`) {
    return "dashboard";
  }

  const generated = path.match(/\/businessAdmin\/modules\/([^/]+)/);
  if (generated?.[1]) return generated[1];

  const snookerMatch = path.match(/\/businessAdmin\/snooker\/([^/]+)/);
  if (snookerMatch?.[1]) return snookerMatch[1];

  const retailMatch = path.match(/\/businessAdmin\/retail\/([^/]+)/);
  if (retailMatch?.[1]) return retailMatch[1];

  const pharmacyMatch: Array<[string, string]> = [
    [`${BUSINESS_ADMIN_BASE}/inventory`, "inventory"],
    [`${BUSINESS_ADMIN_BASE}/pos`, "pos"],
    [`${BUSINESS_ADMIN_BASE}/batches`, "batches"],
    [`${BUSINESS_ADMIN_BASE}/expiry`, "expiry"],
    [`${BUSINESS_ADMIN_BASE}/suppliers`, "suppliers"],
    [`${BUSINESS_ADMIN_BASE}/purchases`, "purchases"],
    [`${BUSINESS_ADMIN_BASE}/prescriptions`, "prescriptions"],
    [`${BUSINESS_ADMIN_BASE}/customers`, "customers"],
    [`${BUSINESS_ADMIN_BASE}/returns`, "returns"],
    [`${BUSINESS_ADMIN_BASE}/reports`, "reports"],
    [`${BUSINESS_ADMIN_BASE}/accounting`, "accounting"],
    [`${BUSINESS_ADMIN_BASE}/shifts`, "shifts"],
    [`${BUSINESS_ADMIN_BASE}/cdss`, "cdss"],
    [`${BUSINESS_ADMIN_BASE}/controlled-substances`, "controlled-substances"],
    [`${BUSINESS_ADMIN_BASE}/branches`, "branches"],
  ];
  for (const [prefix, moduleId] of pharmacyMatch) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return moduleId;
  }

  for (const [moduleId, href] of Object.entries(MODULE_HREF)) {
    if (moduleId === "dashboard") continue;
    if (path === href || path.startsWith(`${href}/`)) {
      return moduleId;
    }
  }

  if (path.includes("/ingredients")) return "inventory";
  if (path.includes("/invoices")) return "sales";
  if (path.includes("/users")) return "staff";
  if (path.includes("/products")) return "products";
  if (path.includes("/categories")) return "categories";
  if (path.includes("/orders")) return "orders";
  if (path.includes("/kitchen")) return "kitchen";
  if (path.includes("/tables")) return "tables";
  if (path.includes("/public-data")) return "public-catalog";
  if (path.includes("/settings")) return "settings";

  return null;
}

export function isDedicatedModuleRoute(moduleId: string, industryId?: string | null): boolean {
  if (industryId === "pharmacy" && PHARMACY_MODULE_HREF[moduleId as ModuleId]) return true;
  if (industryId === "snooker-pos" && SNOOKER_MODULE_HREF[moduleId as ModuleId]) return true;
  if (industryId === "retail-store" && RETAIL_MODULE_HREF[moduleId as ModuleId]) return true;
  return Boolean(MODULE_HREF[moduleId as ModuleId]);
}
