import { moduleLabel } from "@/templates/module-dependencies";
import type { ModuleId } from "@/templates/types";

type NavItem = { moduleId: string; label: string; visible?: boolean };

const PRODUCT_MODULE_IDS = new Set(["menu", "products"]);

/** Single source of truth for mobile tab names — matches Flutter navigation labels. */
export function resolveModuleDisplayLabel(
  moduleId: ModuleId | string,
  navigation?: NavItem[] | null,
  labels?: Record<string, string> | null,
): string {
  const id = String(moduleId);

  const direct = navigation?.find((item) => item.moduleId === id);
  if (direct?.label?.trim()) return direct.label.trim();

  if (PRODUCT_MODULE_IDS.has(id)) {
    const productNav = navigation?.find((item) => PRODUCT_MODULE_IDS.has(item.moduleId));
    if (productNav?.label?.trim()) return productNav.label.trim();
    if (labels?.products?.trim()) return labels.products.trim();
  }

  if (id === "orders" && labels?.orders?.trim()) return labels.orders.trim();

  // Role matrix / Control clarity — canonical ids → operator-facing names
  if (id === "sales") return "Invoices";
  if (id === "categories") return "Categories";

  const relatedNav = navigation?.find((item) => item.moduleId === id);
  if (relatedNav?.label?.trim()) return relatedNav.label.trim();

  return moduleLabel(id as ModuleId);
}

/** Keep shared labels map aligned when nav tab names are customized. */
export function syncLabelsFromNavigation(
  navigation: NavItem[],
  labels: Record<string, string>,
): Record<string, string> {
  const next = { ...labels };
  for (const item of navigation) {
    const label = item.label?.trim();
    if (!label) continue;
    if (item.moduleId === "menu" || item.moduleId === "products") {
      next.products = label;
      next.product = label.replace(/s$/i, "") || label;
    }
    if (item.moduleId === "orders") {
      next.orders = label;
    }
    if (item.moduleId === "customers" && label) {
      next.customers = label;
    }
  }
  return next;
}
