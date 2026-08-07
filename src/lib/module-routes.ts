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
};

export function getModuleHref(moduleId: ModuleId | string): string {
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

  for (const [moduleId, href] of Object.entries(MODULE_HREF)) {
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

  return null;
}

export function isDedicatedModuleRoute(moduleId: string): boolean {
  return Boolean(MODULE_HREF[moduleId as ModuleId]);
}
