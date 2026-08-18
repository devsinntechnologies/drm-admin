import type { IndustryProductScopeItem, ModuleId } from "./types";

export const SNOOKER_POS_INDUSTRY_ID = "snooker-pos";

/**
 * Complete Snooker POS product scope (26 document modules).
 * Sidebar uses ~15 combined workspace modules; this list is the full catalog.
 */
export const SNOOKER_PRODUCT_SCOPE: IndustryProductScopeItem[] = [
  {
    number: 1,
    name: "Dashboard",
    description:
      "Real-time overview of tables, active sessions, sales, expenses, profit, cash, credit, staff activity, and key KPIs.",
    group: "core",
    sidebarModule: "dashboard",
  },
  {
    number: 2,
    name: "Table Management",
    description:
      "Manage snooker/pool tables, table type, availability, reservations, maintenance, live status, and table-specific pricing.",
    group: "core",
    sidebarModule: "tables",
  },
  {
    number: 3,
    name: "Single Game Billing",
    description: "Flat-rate billing for a standard Single Game, with configurable pricing.",
    group: "core",
    sidebarModule: "billing-pricing",
  },
  {
    number: 4,
    name: "Double Game Billing",
    description: "Separate configurable flat-rate billing for Double Game sessions.",
    group: "core",
    sidebarModule: "billing-pricing",
  },
  {
    number: 5,
    name: "Century Timer",
    description:
      "Time-based billing for Century/premium tables with Start, Pause, Resume, Stop, per-minute pricing, minimum duration, and rounding rules.",
    group: "core",
    sidebarModule: "billing-pricing",
  },
  {
    number: 6,
    name: "Session Management",
    description:
      "Manages the complete table session from start to finish, payment, closure, customer linking, and session history.",
    group: "core",
    sidebarModule: "pos",
  },
  {
    number: 7,
    name: "Customer Management",
    description:
      "Lightweight customer CRM containing contact details, visit history, spending, notes, and credit balance.",
    group: "core",
    sidebarModule: "customers",
  },
  {
    number: 8,
    name: "Credit / Udhar Management",
    description:
      "Customer credit ledger for Udhar sales, limits, recoveries, partial payments, write-offs, outstanding balances, and statements.",
    group: "core",
    sidebarModule: "credit-udhar",
  },
  {
    number: 9,
    name: "Discount Management",
    description:
      "Apply fixed or percentage discounts with mandatory reasons, approval limits, and complete discount history.",
    group: "core",
    sidebarModule: "discounts",
  },
  {
    number: 10,
    name: "Expense Management",
    description:
      "Record club expenses such as rent, salaries, electricity, repairs, cleaning, etc., with categories and approval workflow.",
    group: "core",
    sidebarModule: "expenses",
  },
  {
    number: 11,
    name: "Daily Opening",
    description:
      "Starts the business day by recording opening cash, cashier, opening time, and business date.",
    group: "core",
    sidebarModule: "shifts",
  },
  {
    number: 12,
    name: "Daily Closing",
    description:
      "End-of-day cash reconciliation comparing expected cash against actual cash, including variance and manager approval.",
    group: "core",
    sidebarModule: "shifts",
  },
  {
    number: 13,
    name: "Reports & Analytics",
    description:
      "Provides sales, profit, expenses, credit, discounts, cash flow, customers, tables, staff, branches, and audit reports.",
    group: "core",
    sidebarModule: "reports",
  },
  {
    number: 14,
    name: "Staff Management",
    description:
      "Manage employee profiles, roles, branch assignments, joining dates, contact information, and employment status.",
    group: "core",
    sidebarModule: "staff",
  },
  {
    number: 15,
    name: "User Roles",
    description:
      "Assign roles such as Owner, Manager, Cashier, Accountant, Viewer, and Super Admin to system users.",
    group: "core",
    sidebarModule: "staff",
  },
  {
    number: 16,
    name: "Permissions / RBAC",
    description:
      "Controls View, Create, Edit, Delete, and Approve permissions module-by-module and role-by-role.",
    group: "core",
    sidebarModule: "staff",
  },
  {
    number: 17,
    name: "Settings & Configuration",
    description:
      "Central configuration for game pricing, Century rates, branding, credit limits, discount rules, notifications, operating hours, backups, etc.",
    group: "core",
    sidebarModule: "settings",
  },
  {
    number: 18,
    name: "Audit Logs",
    description:
      "Immutable history showing who performed important actions such as discounts, credit entries, price changes, role changes, and closings.",
    group: "core",
    sidebarModule: "audit-logs",
  },
  {
    number: 19,
    name: "Notifications",
    description:
      "Alerts users about overdue credit, cash discrepancies, large discounts, maintenance issues, pending closings, and other important events.",
    group: "core",
    sidebarModule: "notifications",
  },
  {
    number: 20,
    name: "Branch Management",
    description:
      "Manage multiple club locations with separate tables, employees, pricing, operating hours, settings, and consolidated reporting.",
    group: "core",
    sidebarModule: "branches",
  },
  {
    number: 21,
    name: "SaaS Administration",
    description:
      "Platform-level Super Admin system for onboarding clubs/tenants, managing tenant status, support access, usage, and platform configuration.",
    group: "platform",
  },
  {
    number: 22,
    name: "Subscription Management",
    description:
      "SaaS packages, monthly/annual billing, trials, invoices, payment gateway, renewals, limits, and suspension rules.",
    group: "future",
    sidebarModule: "subscriptions",
  },
  {
    number: 23,
    name: "Tournament Management",
    description:
      "Create tournaments/leagues, register players, generate brackets, schedule tables, record scores, standings, and prize pools.",
    group: "future",
    sidebarModule: "tournaments",
  },
  {
    number: 24,
    name: "Membership System",
    description:
      "Paid membership tiers with special pricing, validity periods, member benefits, QR membership cards, and renewals.",
    group: "future",
    sidebarModule: "memberships",
  },
  {
    number: 25,
    name: "Loyalty Programme",
    description:
      "Customer reward points, redemption rules, loyalty levels, expiry policies, and loyalty reporting.",
    group: "future",
    sidebarModule: "loyalty",
  },
  {
    number: 26,
    name: "Online Table Booking",
    description:
      "Customer-facing table availability and reservation system with deposits, confirmations, cancellation rules, and table-status integration.",
    group: "future",
    sidebarModule: "table-booking",
  },
];

/** Combined workspace sidebar — 15 user-facing modules. */
export const SNOOKER_SIDEBAR_MODULES: ModuleId[] = [
  "dashboard",
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
];

export const SNOOKER_OPTIONAL_MODULES: ModuleId[] = [
  "memberships",
  "loyalty",
  "tournaments",
  "table-booking",
  "subscriptions",
];

export const SNOOKER_OPERATIONAL_FLOW = [
  "Table Selection",
  "Game Type Selection",
  "Start Session",
  "Timer / Game",
  "Finish Session",
  "Discount",
  "Cash / Udhar Payment",
  "Receipt",
  "Table Available",
] as const;

export const SNOOKER_BILLING_MODELS = [
  { id: "single", name: "Single Game", model: "Fixed price", defaultRate: 300 },
  { id: "double", name: "Double Game", model: "Fixed price", defaultRate: 500 },
  { id: "century", name: "Century", model: "Per-minute timer", defaultRate: 20 },
] as const;

export function getSnookerScopeForSidebar(moduleId: string): IndustryProductScopeItem[] {
  return SNOOKER_PRODUCT_SCOPE.filter((item) => item.sidebarModule === moduleId);
}
