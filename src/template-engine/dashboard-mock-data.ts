import type { DashboardCardId } from "@/templates/types";

export const PREVIEW_CARD_VALUES: Partial<Record<DashboardCardId, string>> = {
  "today-sales": "Rs 248K",
  "total-transactions": "186",
  "gross-profit": "Rs 92K",
  "low-stock": "14",
  "top-products": "Croissant",
  "pending-purchases": "6",
  "expiring-items": "9",
  "expired-items": "2",
  "batch-value": "Rs 1.2M",
  "pending-prescriptions": "6",
  "active-orders": "11",
  "tables-occupied": "8 / 12",
  "kitchen-delays": "3",
  "avg-order-value": "Rs 1,420",
  "low-stock-ingredients": "5",
  "best-collection": "Summer",
  "low-stock-sizes": "4",
  "pending-alterations": "2",
  "customer-orders": "19",
  "returns-exchanges": "1",
  "today-appointments": "18",
  "available-staff": "6",
  "expected-revenue": "Rs 310K",
  "walk-ins": "12",
  "pending-appointments": "4",
  "top-service": "Haircut",
  "production-planned": "142",
  "custom-orders-due": "7",
  wastage: "Rs 4.2K",
  "ingredient-shortage": "3",
  "warranty-claims": "2",
  "product-returns": "1",
  "top-brands": "House Blend",
  "inventory-value": "Rs 890K",
  "custom-orders": "5",
  "repairs-pending": "3",
  "metal-stock": "2.4 kg",
  "outstanding-balances": "Rs 18K",
  "top-age-group": "25–34",
  "seasonal-products": "14",
  "active-promotions": "3",
  "orders-in-progress": "8",
  "avg-prep-time": "7 min",
  "best-selling-item": "Sourdough",
  "takeaway-orders": "24",
  "pending-quotations": "4",
  "scheduled-deliveries": "11",
  "installations-pending": "2",
  "active-counters": "3",
  "fast-selling": "Espresso",
  "purchase-value": "Rs 54K",
  "production-in-progress": "6",
  "raw-material-shortages": "2",
  "planned-production": "320",
  "completed-production": "178",
  "rejected-quantity": "4",
  "finished-stock-value": "Rs 640K",
  "fast-moving-parts": "Brake pads",
  "top-vehicle-brands": "Toyota",
  "best-selling-books": "Atomic Habits",
  "top-authors": "James Clear",
  "recently-added": "12",
};

export type PreviewOrderSlice = { color: string; value: number; label: string };

export const PREVIEW_ORDER_SLICES: Omit<PreviewOrderSlice, "color">[] = [
  { value: 12, label: "New" },
  { value: 8, label: "Preparing" },
  { value: 5, label: "Ready" },
];

export const PREVIEW_DASHBOARD_STATS = {
  totalOrders: 47,
  pendingInvoices: 5,
  completionRate: 78,
  activeOrdersSub: "36 completed today",
  lowStockSub: "Out of 128 active products",
};

export type PreviewProductRow = {
  id: string;
  name: string;
  stocks: number;
  revenue: string;
};

export const PREVIEW_TOP_PRODUCTS: PreviewProductRow[] = [
  { id: "1", name: "Sourdough Loaf", stocks: 42, revenue: "PKR 84,000" },
  { id: "2", name: "Butter Croissant", stocks: 96, revenue: "PKR 57,600" },
  { id: "3", name: "Chocolate Éclair", stocks: 38, revenue: "PKR 45,600" },
  { id: "4", name: "Espresso", stocks: 120, revenue: "PKR 36,000" },
];

export type PreviewOrderRow = {
  id: string;
  label: string;
  title: string;
  ago: string;
  status: string;
  user: string;
};

export const PREVIEW_RECENT_ORDERS: PreviewOrderRow[] = [
  { id: "1", label: "1", title: "ORD-1042", ago: "12m", status: "preparing", user: "Table 4" },
  { id: "2", label: "2", title: "ORD-1041", ago: "28m", status: "ready", user: "Takeaway" },
  { id: "3", label: "3", title: "ORD-1040", ago: "45m", status: "completed", user: "Table 2" },
  { id: "4", label: "4", title: "ORD-1039", ago: "1h", status: "pending", user: "Delivery" },
];
