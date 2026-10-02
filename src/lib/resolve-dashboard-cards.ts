import type { DashboardCardId } from "@/templates/types";

/** Cards that represent low-stock / inventory attention. */
export const LOW_STOCK_CARD_IDS = new Set<DashboardCardId>([
  "low-stock",
  "low-stock-ingredients",
  "low-stock-sizes",
  "ingredient-shortage",
]);

/** Expense module KPI cards — shown only when the expenses module is enabled. */
export const EXPENSE_CARD_IDS: DashboardCardId[] = [
  "today-expenses",
  "net-profit",
  "pending-reimbursements",
];

const EXPENSE_CARD_ID_SET = new Set<string>(EXPENSE_CARD_IDS);

const DEFAULT_DASHBOARD_CARDS: DashboardCardId[] = [
  "today-sales",
  "active-orders",
  "low-stock",
];

/**
 * Resolve visible dashboard KPI cards for App + Web portals.
 * Uses Software Control / super-admin `dashboardCards` as source of truth.
 * Mirrors diginizam_flutter `dashboard_cards_config.dart`.
 */
export function resolveDashboardCards(args: {
  configuredCards: DashboardCardId[];
  industryId?: string;
  expensesEnabled: boolean;
}): DashboardCardId[] {
  const { configuredCards, industryId, expensesEnabled } = args;
  const isPharmacy = industryId === "pharmacy";
  const cardIds: DashboardCardId[] = [
    ...(configuredCards.length > 0 ? configuredCards : DEFAULT_DASHBOARD_CARDS),
  ];

  return cardIds.filter((id) => {
    if (isPharmacy && EXPENSE_CARD_ID_SET.has(id)) return false;
    if (!expensesEnabled && EXPENSE_CARD_ID_SET.has(id)) return false;
    return true;
  });
}

/** Responsive grid classes — cards shrink when more than three appear in a row. */
export function getDashboardGridClassName(cardCount: number): string {
  if (cardCount <= 1) {
    return "grid grid-cols-1 gap-4";
  }
  if (cardCount === 2) {
    return "grid grid-cols-1 gap-4 md:grid-cols-2";
  }
  if (cardCount === 3) {
    return "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  }
  if (cardCount === 4) {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 dashboard-kpi-grid-compact";
  }
  if (cardCount === 5) {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 dashboard-kpi-grid-compact";
  }
  return "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 dashboard-kpi-grid-compact";
}
