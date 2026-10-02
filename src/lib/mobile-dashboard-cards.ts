import { MOBILE_DASHBOARD_CARDS } from "@/lib/software-supported-modules";
import { DASHBOARD_CARD_CATALOG } from "@/templates/modules";
import type { DashboardCardId } from "@/templates/types";

/** Dashboard KPI cards the Flutter app can render (Software Control + super admin). */
export function listMobileDashboardCardIds(): DashboardCardId[] {
  return (Object.keys(DASHBOARD_CARD_CATALOG) as DashboardCardId[]).filter((id) =>
    MOBILE_DASHBOARD_CARDS.has(id),
  );
}

/** Full picker order: saved order first, then any mobile cards not yet listed. */
export function mergeDashboardCardOrder(
  order: DashboardCardId[],
  catalog: DashboardCardId[] = listMobileDashboardCardIds(),
): DashboardCardId[] {
  const ordered = order.filter((id) => catalog.includes(id));
  const rest = catalog.filter((id) => !ordered.includes(id));
  return [...ordered, ...rest];
}

/** Persist/display order — only cards that remain enabled. */
export function orderedSelectedDashboardCards(
  order: DashboardCardId[],
  selected: DashboardCardId[],
): DashboardCardId[] {
  return mergeDashboardCardOrder(order).filter((id) => selected.includes(id));
}

export const EXPENSE_DASHBOARD_CARD_IDS: DashboardCardId[] = [
  "today-expenses",
  "net-profit",
  "pending-reimbursements",
];
