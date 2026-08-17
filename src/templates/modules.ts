import type { DashboardCardId, ModuleId } from "./types";

export const MODULE_CATALOG: Record<
  ModuleId,
  { id: ModuleId; label: string; description: string; category: string }
> = {
  dashboard: { id: "dashboard", label: "Dashboard", description: "Live KPIs and operational overview", category: "Core" },
  pos: { id: "pos", label: "POS", description: "Point of sale / billing", category: "Sales" },
  orders: { id: "orders", label: "Orders", description: "Order queue and status tracking", category: "Sales" },
  sales: { id: "sales", label: "Sales", description: "Sales history and receipts", category: "Sales" },
  products: { id: "products", label: "Products", description: "Catalog of sellable items", category: "Catalog" },
  categories: { id: "categories", label: "Categories", description: "Product grouping", category: "Catalog" },
  inventory: { id: "inventory", label: "Inventory", description: "Stock levels and adjustments", category: "Inventory" },
  purchases: { id: "purchases", label: "Purchases", description: "Purchase orders and receiving", category: "Inventory" },
  suppliers: { id: "suppliers", label: "Suppliers", description: "Vendor management", category: "Inventory" },
  customers: { id: "customers", label: "Customers", description: "Customer profiles and history", category: "CRM" },
  returns: { id: "returns", label: "Returns", description: "Returns and refunds", category: "Sales" },
  expenses: { id: "expenses", label: "Expenses", description: "Business expense tracking", category: "Finance" },
  staff: { id: "staff", label: "Staff", description: "Employees and roles", category: "People" },
  reports: { id: "reports", label: "Reports", description: "Analytics and exports", category: "Insights" },
  settings: { id: "settings", label: "Settings", description: "Business configuration", category: "Core" },
  tables: { id: "tables", label: "Tables", description: "Floor plan and seating", category: "Food" },
  kitchen: { id: "kitchen", label: "Kitchen", description: "Kitchen display system", category: "Food" },
  menu: { id: "menu", label: "Menu", description: "Menu items and pricing", category: "Food" },
  modifiers: { id: "modifiers", label: "Modifiers", description: "Add-ons and options", category: "Food" },
  recipes: { id: "recipes", label: "Recipes", description: "Recipe / BOM for food items", category: "Food" },
  shifts: { id: "shifts", label: "Shifts", description: "Shift open/close and cash", category: "People" },
  batches: { id: "batches", label: "Batches", description: "Batch-wise stock", category: "Inventory" },
  expiry: { id: "expiry", label: "Expiry Management", description: "Expiry alerts and disposal", category: "Inventory" },
  prescriptions: { id: "prescriptions", label: "Prescriptions", description: "Prescription intake and fills", category: "Pharmacy" },
  cdss: { id: "cdss", label: "Clinical Decision Support", description: "Interaction, allergy, and duplicate-therapy checks", category: "Pharmacy" },
  "controlled-substances": { id: "controlled-substances", label: "Controlled Substances", description: "Scheduled drug audit log and compliance", category: "Pharmacy" },
  collections: { id: "collections", label: "Collections", description: "Seasonal / style collections", category: "Catalog" },
  variants: { id: "variants", label: "Size & Colour Matrix", description: "Variant matrix management", category: "Catalog" },
  measurements: { id: "measurements", label: "Measurements", description: "Customer measurement profiles", category: "CRM" },
  alterations: { id: "alterations", label: "Alterations", description: "Alteration tracking", category: "Service" },
  appointments: { id: "appointments", label: "Appointments", description: "Booking calendar", category: "Service" },
  services: { id: "services", label: "Services", description: "Service catalog and duration", category: "Service" },
  schedules: { id: "schedules", label: "Schedules", description: "Staff availability schedules", category: "People" },
  packages: { id: "packages", label: "Packages", description: "Service packages", category: "Service" },
  memberships: { id: "memberships", label: "Memberships", description: "Membership plans and balances", category: "CRM" },
  commissions: { id: "commissions", label: "Commissions", description: "Staff commission tracking", category: "People" },
  production: { id: "production", label: "Production", description: "Production planning board", category: "Production" },
  "custom-orders": { id: "custom-orders", label: "Custom Orders", description: "Made-to-order workflows", category: "Sales" },
  wastage: { id: "wastage", label: "Wastage", description: "Waste and spoilage logs", category: "Inventory" },
  brands: { id: "brands", label: "Brands", description: "Brand catalog", category: "Catalog" },
  models: { id: "models", label: "Models", description: "Product models", category: "Catalog" },
  "serial-numbers": { id: "serial-numbers", label: "Serial Numbers", description: "Serial tracking", category: "Inventory" },
  warranties: { id: "warranties", label: "Warranties", description: "Warranty claims", category: "Service" },
  metals: { id: "metals", label: "Metals", description: "Metal types and rates", category: "Jewellery" },
  stones: { id: "stones", label: "Stones", description: "Stone catalog", category: "Jewellery" },
  repairs: { id: "repairs", label: "Repairs", description: "Repair job tracking", category: "Service" },
  certificates: { id: "certificates", label: "Certificates", description: "Certificate uploads", category: "Jewellery" },
  "age-groups": { id: "age-groups", label: "Age Groups", description: "Age-based product filters", category: "Catalog" },
  bundles: { id: "bundles", label: "Bundles", description: "Product bundles", category: "Sales" },
  promotions: { id: "promotions", label: "Promotions", description: "Promo builder", category: "Sales" },
  takeaway: { id: "takeaway", label: "Takeaway", description: "Takeaway order flow", category: "Food" },
  delivery: { id: "delivery", label: "Delivery", description: "Delivery scheduling", category: "Logistics" },
  quotations: { id: "quotations", label: "Quotations", description: "Quote builder", category: "Sales" },
  installations: { id: "installations", label: "Installation", description: "Installation status", category: "Logistics" },
  departments: { id: "departments", label: "Departments", description: "Department structure", category: "Catalog" },
  "price-management": { id: "price-management", label: "Price Management", description: "Bulk price updates", category: "Sales" },
  counters: { id: "counters", label: "Counters", description: "POS counters / terminals", category: "Sales" },
  branches: { id: "branches", label: "Branches", description: "Multi-branch overview", category: "Core" },
  "raw-materials": { id: "raw-materials", label: "Raw Materials", description: "Raw material inventory", category: "Production" },
  bom: { id: "bom", label: "Bill of Materials", description: "BOM builder", category: "Production" },
  "production-orders": { id: "production-orders", label: "Production Orders", description: "Production order forms", category: "Production" },
  "work-centres": { id: "work-centres", label: "Work Centres", description: "Work centre management", category: "Production" },
  "quality-control": { id: "quality-control", label: "Quality Control", description: "QC checklists", category: "Production" },
  "finished-stock": { id: "finished-stock", label: "Finished Stock", description: "Finished goods inventory", category: "Production" },
  "sales-orders": { id: "sales-orders", label: "Sales Orders", description: "B2B / wholesale orders", category: "Sales" },
  "vehicle-compatibility": { id: "vehicle-compatibility", label: "Vehicle Compatibility", description: "Make/model/year matrix", category: "Auto" },
  authors: { id: "authors", label: "Authors", description: "Author catalog", category: "Books" },
  publishers: { id: "publishers", label: "Publishers", description: "Publisher catalog", category: "Books" },
  accounting: { id: "accounting", label: "Accounting", description: "Optional accounting pack", category: "Optional" },
  hr: { id: "hr", label: "HR & Payroll", description: "Optional HR pack", category: "Optional" },
  "multi-branch": { id: "multi-branch", label: "Multi-branch", description: "Optional multi-branch pack", category: "Optional" },
  "public-catalog": {
    id: "public-catalog",
    label: "Public Catalog",
    description: "Customer-facing online menu and catalog",
    category: "Catalog",
  },
};

export const DASHBOARD_CARD_CATALOG: Record<
  DashboardCardId,
  { id: DashboardCardId; label: string; description: string }
> = {
  "today-sales": { id: "today-sales", label: "Today’s Sales", description: "Revenue for the current day" },
  "total-transactions": { id: "total-transactions", label: "Total Transactions", description: "Number of sales today" },
  "gross-profit": { id: "gross-profit", label: "Gross Profit", description: "Estimated gross profit" },
  "low-stock": { id: "low-stock", label: "Low-stock Items", description: "Items below reorder level" },
  "top-products": { id: "top-products", label: "Top-selling Products", description: "Best performers today" },
  "pending-purchases": { id: "pending-purchases", label: "Pending Purchases", description: "Open purchase orders" },
  "expiring-items": { id: "expiring-items", label: "Expiring Items", description: "Near-expiry stock" },
  "expired-items": { id: "expired-items", label: "Expired Stock", description: "Already expired batches" },
  "batch-value": { id: "batch-value", label: "Batch Value", description: "Value tied to batches" },
  "pending-prescriptions": { id: "pending-prescriptions", label: "Pending Prescriptions", description: "Prescriptions awaiting fill" },
  "active-orders": { id: "active-orders", label: "Active Orders", description: "Orders currently open" },
  "tables-occupied": { id: "tables-occupied", label: "Tables Occupied", description: "Seated tables right now" },
  "kitchen-delays": { id: "kitchen-delays", label: "Kitchen Delays", description: "Orders past prep SLA" },
  "avg-order-value": { id: "avg-order-value", label: "Average Order Value", description: "AOV for today" },
  "low-stock-ingredients": { id: "low-stock-ingredients", label: "Low-stock Ingredients", description: "Ingredients to reorder" },
  "best-collection": { id: "best-collection", label: "Best-selling Collection", description: "Top collection by sales" },
  "low-stock-sizes": { id: "low-stock-sizes", label: "Low-stock Sizes", description: "Size gaps in inventory" },
  "pending-alterations": { id: "pending-alterations", label: "Pending Alterations", description: "Open alteration jobs" },
  "customer-orders": { id: "customer-orders", label: "Customer Orders", description: "Open customer orders" },
  "returns-exchanges": { id: "returns-exchanges", label: "Returns & Exchanges", description: "Open return tickets" },
  "today-appointments": { id: "today-appointments", label: "Today’s Appointments", description: "Bookings for today" },
  "available-staff": { id: "available-staff", label: "Available Staff", description: "Staff free now" },
  "expected-revenue": { id: "expected-revenue", label: "Expected Revenue", description: "Projected from bookings" },
  "walk-ins": { id: "walk-ins", label: "Walk-in Customers", description: "Unbooked walk-ins" },
  "pending-appointments": { id: "pending-appointments", label: "Pending Appointments", description: "Awaiting confirmation" },
  "top-service": { id: "top-service", label: "Top Service", description: "Most booked service" },
  "production-planned": { id: "production-planned", label: "Production Planned", description: "Units planned today" },
  "custom-orders-due": { id: "custom-orders-due", label: "Custom Orders Due", description: "Due for pickup/delivery" },
  wastage: { id: "wastage", label: "Wastage", description: "Waste logged today" },
  "ingredient-shortage": { id: "ingredient-shortage", label: "Ingredient Shortage", description: "Critical ingredient gaps" },
  "warranty-claims": { id: "warranty-claims", label: "Warranty Claims", description: "Open warranty tickets" },
  "product-returns": { id: "product-returns", label: "Product Returns", description: "Returns in progress" },
  "top-brands": { id: "top-brands", label: "Top Brands", description: "Best-selling brands" },
  "inventory-value": { id: "inventory-value", label: "Inventory Value", description: "Total stock value" },
  "custom-orders": { id: "custom-orders", label: "Custom Orders", description: "Open custom jobs" },
  "repairs-pending": { id: "repairs-pending", label: "Repairs Pending", description: "Open repair jobs" },
  "metal-stock": { id: "metal-stock", label: "Metal Stock", description: "Metal weight on hand" },
  "outstanding-balances": { id: "outstanding-balances", label: "Outstanding Balances", description: "Customer dues" },
  "top-age-group": { id: "top-age-group", label: "Top Age Group", description: "Best-selling age band" },
  "seasonal-products": { id: "seasonal-products", label: "Seasonal Products", description: "Seasonal movers" },
  "active-promotions": { id: "active-promotions", label: "Active Promotions", description: "Live promo count" },
  "orders-in-progress": { id: "orders-in-progress", label: "Orders in Progress", description: "Currently preparing" },
  "avg-prep-time": { id: "avg-prep-time", label: "Avg Preparation Time", description: "Kitchen prep average" },
  "best-selling-item": { id: "best-selling-item", label: "Best-selling Item", description: "Top menu item" },
  "takeaway-orders": { id: "takeaway-orders", label: "Takeaway Orders", description: "Takeaway volume today" },
  "pending-quotations": { id: "pending-quotations", label: "Pending Quotations", description: "Quotes awaiting reply" },
  "scheduled-deliveries": { id: "scheduled-deliveries", label: "Scheduled Deliveries", description: "Upcoming deliveries" },
  "installations-pending": { id: "installations-pending", label: "Installations Pending", description: "Open installations" },
  "active-counters": { id: "active-counters", label: "Active Counters", description: "Live POS terminals" },
  "fast-selling": { id: "fast-selling", label: "Fast-selling Products", description: "High-velocity SKUs" },
  "purchase-value": { id: "purchase-value", label: "Purchase Value", description: "Purchase spend today" },
  "production-in-progress": { id: "production-in-progress", label: "Production in Progress", description: "Active production jobs" },
  "raw-material-shortages": { id: "raw-material-shortages", label: "Raw-material Shortages", description: "Materials to reorder" },
  "planned-production": { id: "planned-production", label: "Planned Production", description: "Scheduled output" },
  "completed-production": { id: "completed-production", label: "Completed Production", description: "Finished today" },
  "rejected-quantity": { id: "rejected-quantity", label: "Rejected Quantity", description: "QC rejects" },
  "finished-stock-value": { id: "finished-stock-value", label: "Finished Stock Value", description: "Finished goods value" },
  "fast-moving-parts": { id: "fast-moving-parts", label: "Fast-moving Parts", description: "High-velocity parts" },
  "top-vehicle-brands": { id: "top-vehicle-brands", label: "Top Vehicle Brands", description: "Popular vehicle brands" },
  "best-selling-books": { id: "best-selling-books", label: "Best-selling Books", description: "Top titles" },
  "top-authors": { id: "top-authors", label: "Top Authors", description: "Best-selling authors" },
  "recently-added": { id: "recently-added", label: "Recently Added", description: "Newest catalog items" },
};

/** Industry colour presets — solid primary + secondary (no gradients). */
export const ACCENT_COLORS: Record<
  string,
  { label: string; primary: string; secondary: string; soft: string }
> = {
  blue: { label: "Blue", primary: "#001840", secondary: "#0050F8", soft: "#eef3ff" },
  green: { label: "Green", primary: "#14532d", secondary: "#16a34a", soft: "#ecfdf5" },
  teal: { label: "Teal", primary: "#134e4a", secondary: "#0d9488", soft: "#f0fdfa" },
  amber: { label: "Amber", primary: "#78350f", secondary: "#d97706", soft: "#fffbeb" },
  rose: { label: "Rose", primary: "#881337", secondary: "#e11d48", soft: "#fff1f2" },
  violet: { label: "Violet", primary: "#4c1d95", secondary: "#7c3aed", soft: "#f5f3ff" },
  slate: { label: "Slate", primary: "#0f172a", secondary: "#475569", soft: "#f1f5f9" },
  orange: { label: "Orange", primary: "#7c2d12", secondary: "#ea580c", soft: "#fff7ed" },
};

export function colorsFromAccent(accent: string) {
  const preset = ACCENT_COLORS[accent] ?? ACCENT_COLORS.blue;
  return {
    primary: preset.primary,
    secondary: preset.secondary,
    soft: preset.soft,
  };
}

function parseHex(hex: string): [number, number, number] | null {
  const match = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shiftHex(hex: string, amount: number, fallback: string) {
  const parsed = parseHex(hex);
  if (!parsed) return fallback;
  const adj = (channel: number) => Math.max(0, Math.min(255, Math.round(channel + amount)));
  return `#${parsed.map(adj).map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function mixHex(hex: string, withHex: string, amountOfHex: number, fallback: string) {
  const a = parseHex(hex);
  const b = parseHex(withHex);
  if (!a || !b) return fallback;
  const mix = (index: number) => Math.round(a[index] * amountOfHex + b[index] * (1 - amountOfHex));
  return `#${[mix(0), mix(1), mix(2)].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

export function softFromHex(hex: string, fallback = "#eef3ff") {
  const value = hex.trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(value)) return fallback;
  return `${value}22`;
}

export function buildWorkspaceThemeStyle(
  primaryColor: string,
  secondaryColor: string,
  themeMode: "light" | "dark" = "light",
) {
  const dark = themeMode === "dark";
  return {
    ["--biz-primary"]: primaryColor,
    ["--biz-secondary"]: secondaryColor,
    ["--biz-primary-soft"]: softFromHex(primaryColor),
    ["--biz-secondary-soft"]: softFromHex(secondaryColor),
    ["--brand-primary"]: primaryColor,
    ["--brand-secondary"]: secondaryColor,
    ["--brand-primary-hover"]: shiftHex(primaryColor, -22, primaryColor),
    ["--brand-secondary-hover"]: shiftHex(secondaryColor, -22, secondaryColor),
    ["--brand-primary-soft"]: dark ? mixHex(primaryColor, "#111827", 0.28, "#1e293b") : softFromHex(primaryColor),
    ["--brand-secondary-soft"]: dark ? mixHex(secondaryColor, "#111827", 0.28, "#1e293b") : softFromHex(secondaryColor),
    ["--app-bg"]: dark ? "#0b1220" : mixHex(primaryColor, "#f8fafc", 0.05, "#f1f5f9"),
    ["--surface"]: dark ? "#111827" : "#ffffff",
    ["--surface-muted"]: dark ? "#1e293b" : "#f8fafc",
    ["--input-bg"]: dark ? "#0f172a" : "#f8fafc",
    ["--text-primary"]: dark ? "#f8fafc" : "#0f172a",
    ["--text-muted"]: dark ? "#94a3b8" : "#64748b",
    ["--border-subtle"]: dark ? "#243044" : "#dbe4ef",
  } as const;
}
