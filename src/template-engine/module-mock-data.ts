import type { CustomizedTemplateConfig, ModuleId } from "@/templates/types";
import { getMockProducts } from "@/template-engine/mock-data";

export type MockRow = Record<string, string | number>;

export type ModuleMockView =
  | "catalog"
  | "pos"
  | "orders"
  | "kitchen"
  | "tables"
  | "inventory"
  | "people"
  | "calendar"
  | "finance"
  | "settings"
  | "production"
  | "generic";

const VIEW_BY_MODULE: Partial<Record<ModuleId, ModuleMockView>> = {
  pos: "pos",
  products: "catalog",
  menu: "catalog",
  categories: "catalog",
  collections: "catalog",
  variants: "catalog",
  brands: "catalog",
  orders: "orders",
  sales: "orders",
  "sales-orders": "orders",
  takeaway: "orders",
  delivery: "orders",
  "custom-orders": "orders",
  quotations: "orders",
  kitchen: "kitchen",
  recipes: "kitchen",
  modifiers: "catalog",
  tables: "tables",
  inventory: "inventory",
  batches: "inventory",
  expiry: "inventory",
  purchases: "inventory",
  suppliers: "inventory",
  "raw-materials": "inventory",
  "finished-stock": "inventory",
  wastage: "inventory",
  customers: "people",
  staff: "people",
  hr: "people",
  commissions: "people",
  schedules: "people",
  memberships: "people",
  appointments: "calendar",
  services: "calendar",
  packages: "calendar",
  prescriptions: "calendar",
  alterations: "calendar",
  measurements: "people",
  expenses: "finance",
  reports: "finance",
  accounting: "finance",
  promotions: "finance",
  settings: "settings",
  branches: "settings",
  departments: "settings",
  counters: "settings",
  "multi-branch": "settings",
  "price-management": "settings",
  production: "production",
  "production-orders": "production",
  bom: "production",
  "work-centres": "production",
  "quality-control": "production",
  installations: "production",
  repairs: "production",
  warranties: "generic",
  certificates: "generic",
  metals: "generic",
  stones: "generic",
  "serial-numbers": "generic",
  "vehicle-compatibility": "generic",
  authors: "generic",
  publishers: "generic",
  "age-groups": "generic",
  bundles: "generic",
  models: "generic",
  shifts: "people",
};

export function getModuleMockView(moduleId: string): ModuleMockView {
  return VIEW_BY_MODULE[moduleId as ModuleId] ?? "generic";
}

export function getModuleMockStats(moduleId: string, currency: string) {
  const c = currency;
  const common = [
    { label: "Open today", value: "12" },
    { label: "Completed", value: "48" },
    { label: "Pending", value: "5" },
  ];
  const byView: Record<ModuleMockView, typeof common> = {
    catalog: [
      { label: "Active SKUs", value: "128" },
      { label: "Low stock", value: "6" },
      { label: "Categories", value: "14" },
    ],
    pos: [
      { label: "Tickets open", value: "3" },
      { label: "Today sales", value: `${c} 84K` },
      { label: "Avg ticket", value: `${c} 1,420` },
    ],
    orders: [
      { label: "In queue", value: "9" },
      { label: "Preparing", value: "4" },
      { label: "Ready", value: "2" },
    ],
    kitchen: [
      { label: "New", value: "5" },
      { label: "Cooking", value: "7" },
      { label: "Delayed", value: "2" },
    ],
    tables: [
      { label: "Occupied", value: "9" },
      { label: "Available", value: "15" },
      { label: "Reserved", value: "3" },
    ],
    inventory: [
      { label: "SKUs tracked", value: "342" },
      { label: "Reorder alerts", value: "11" },
      { label: "Inbound POs", value: "4" },
    ],
    people: [
      { label: "Active records", value: "86" },
      { label: "New this week", value: "12" },
      { label: "Follow-ups", value: "7" },
    ],
    calendar: [
      { label: "Today", value: "18" },
      { label: "Confirmed", value: "14" },
      { label: "Walk-ins", value: "4" },
    ],
    finance: [
      { label: "This month", value: `${c} 1.2M` },
      { label: "Expenses", value: `${c} 410K` },
      { label: "Outstanding", value: `${c} 92K` },
    ],
    settings: [
      { label: "Locations", value: "2" },
      { label: "Roles", value: "5" },
      { label: "Integrations", value: "3" },
    ],
    production: [
      { label: "Jobs active", value: "8" },
      { label: "Planned units", value: "420" },
      { label: "QC holds", value: "2" },
    ],
    generic: common,
  };
  return byView[getModuleMockView(moduleId)];
}

export function getModuleMockRows(moduleId: string, config: Pick<CustomizedTemplateConfig, "currency" | "labels" | "industryId">) {
  const view = getModuleMockView(moduleId);
  const c = config.currency;

  if (view === "catalog") {
    return getMockProducts(config as CustomizedTemplateConfig).map((p) => ({
      name: p.name,
      code: p.sku,
      stock: String(p.stock),
      price: p.price,
      status: p.status,
    }));
  }

  if (view === "orders") {
    return [
      { id: "#1042", customer: "Walk-in", total: `${c} 2,450`, status: "Preparing", time: "4m" },
      { id: "#1041", customer: "Ahmed K.", total: `${c} 890`, status: "New", time: "1m" },
      { id: "#1040", customer: "Table 7", total: `${c} 5,120`, status: "Ready", time: "12m" },
      { id: "#1039", customer: "Sara M.", total: `${c} 1,680`, status: "Completed", time: "28m" },
    ];
  }

  if (view === "inventory") {
    return [
      { item: "House Blend Beans", batch: "B-2201", qty: "24 kg", expiry: "12 Aug", status: "OK" },
      { item: "Whole Milk", batch: "B-2198", qty: "18 L", expiry: "03 Aug", status: "Low" },
      { item: "Paper Cups (12oz)", batch: "—", qty: "120 pcs", expiry: "—", status: "Reorder" },
      { item: "Vanilla Syrup", batch: "B-2188", qty: "6 L", expiry: "15 Aug", status: "OK" },
    ];
  }

  if (view === "people") {
    return [
      { name: "Ayesha Khan", role: "Cashier", contact: "+92 300 ***", status: "On shift" },
      { name: "Bilal Ahmed", role: "Kitchen", contact: "+92 321 ***", status: "On shift" },
      { name: "Sana Malik", role: "Manager", contact: "sana@demo.com", status: "Available" },
      { name: "Guest — VIP", role: "Customer", contact: "+92 333 ***", status: "Active" },
    ];
  }

  if (view === "calendar") {
    return [
      { slot: "10:00 AM", client: "Fatima R.", service: "Consultation", staff: "Dr. Ali", status: "Confirmed" },
      { slot: "11:30 AM", client: "Walk-in", service: "Quick service", staff: "Team A", status: "Pending" },
      { slot: "02:00 PM", client: "Hassan T.", service: "Follow-up", staff: "Dr. Ali", status: "Confirmed" },
      { slot: "04:15 PM", client: "Nadia P.", service: "Premium package", staff: "Team B", status: "Confirmed" },
    ];
  }

  if (view === "finance") {
    return [
      { ref: "EXP-881", category: "Utilities", amount: `${c} 18,400`, date: "Today", status: "Posted" },
      { ref: "EXP-880", category: "Supplies", amount: `${c} 42,000`, date: "Yesterday", status: "Posted" },
      { ref: "RPT-112", category: "Daily sales", amount: `${c} 248K`, date: "Today", status: "Draft" },
      { ref: "INV-559", category: "Receivable", amount: `${c} 92,000`, date: "Due Fri", status: "Open" },
    ];
  }

  if (view === "production") {
    return [
      { job: "JOB-441", output: "Batch A — 120 units", line: "Line 1", progress: "68%", status: "Running" },
      { job: "JOB-440", output: "Custom order #88", line: "Line 2", progress: "35%", status: "Running" },
      { job: "JOB-439", output: "Assembly kit", line: "QC", progress: "100%", status: "Hold" },
      { job: "JOB-438", output: "Standard pack", line: "Line 1", progress: "100%", status: "Done" },
    ];
  }

  return [
    { record: `${moduleId} item A`, detail: "Sample workflow row", owner: "System", updated: "2m ago", status: "Active" },
    { record: `${moduleId} item B`, detail: "Linked module data", owner: "Staff", updated: "15m ago", status: "Pending" },
    { record: `${moduleId} item C`, detail: "Mock preview entry", owner: "Auto", updated: "1h ago", status: "Active" },
    { record: `${moduleId} item D`, detail: "Template placeholder", owner: "Admin", updated: "Today", status: "Review" },
  ];
}

export function getKitchenColumns() {
  return [
    { title: "New", items: ["#1041 Latte x2", "Table 4 — Wrap", "Takeaway #88"] },
    { title: "Preparing", items: ["#1042 Burger combo", "Iced mocha", "Kids meal"] },
    { title: "Ready", items: ["#1040 Table 7", "Takeaway #87"] },
  ];
}

export function getTableTiles() {
  return [
    { label: "T1", seats: 2, status: "Free" },
    { label: "T2", seats: 4, status: "Occupied" },
    { label: "T3", seats: 4, status: "Occupied" },
    { label: "T4", seats: 6, status: "Reserved" },
    { label: "T5", seats: 2, status: "Free" },
    { label: "T6", seats: 8, status: "Occupied" },
  ];
}

export function getSettingsFields() {
  return [
    { label: "Business display name", value: "Food / Cafe Demo" },
    { label: "Default currency", value: "PKR" },
    { label: "Tax profile", value: "Standard 17%" },
    { label: "Receipt footer", value: "Thank you for visiting!" },
  ];
}
