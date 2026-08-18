import { createElement } from "react";
import type { ApiTemplateConfig } from "@/hooks/useIndustryTemplate";
import { isModuleImplemented } from "@/lib/module-implementation";
import { resolveModuleIcon } from "@/lib/module-icons";
import { hydrateWorkspaceTemplate } from "@/lib/hydrate-workspace-template";
import { appendBusinessId, getModuleHref } from "@/lib/module-routes";
import { MODULE_CATALOG } from "@/templates/modules";
import type { ModuleId } from "@/templates/types";

export type WorkspaceNavTab = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  inProgress?: boolean;
  description?: string;
};

const PHARMACY_MODULE_PURPOSE: Partial<Record<ModuleId, string>> = {
  dashboard: "Today’s sales, expiry, and low-stock at a glance",
  pos: "Search medicines, apply GST or VAT, and complete FEFO billing",
  products: "Medicine catalog with salt, barcode, tax, and Rx flags",
  categories: "Group medicines such as tablets, syrups, OTC, and controlled",
  batches: "Lot numbers, MRP, rack location, and remaining quantity",
  expiry: "Near-expiry alerts, quarantine, and write-off",
  inventory: "On-hand stock in base units with reorder flags",
  prescriptions: "Rx intake for paper, EPS, and NHS, plus refill list",
  cdss: "Local interaction, allergy, and contraindication checks",
  "controlled-substances": "DRAP / CD schedule dispense log and compliance",
  purchases: "Purchase orders and GRN that create batches",
  suppliers: "Vendor master, tax IDs, payment terms, and AP aging",
  customers: "Patients, CNIC or NHS number, allergies, and loyalty",
  sales: "Paid invoices and pharmacy sale history",
  returns: "Restock to batch or quarantine damaged returns",
  reports: "Best/slow movers, dead stock, margins, and salt sales",
  accounting: "Journals, accounts payable, P&L, and GST/VAT export",
  shifts: "Cash drawer open/close and handover",
  staff: "Pharmacist, cashier, manager, shift, and inventory logins",
  settings: "Business profile, market, and workspace options",
  branches: "Locations and inter-branch stock transfer",
};

const SNOOKER_MODULE_PURPOSE: Partial<Record<ModuleId, string>> = {
  dashboard: "Live tables, sessions, sales, expenses, profit, cash, credit, and staff KPIs",
  tables: "Snooker/pool tables, type, availability, reservations, maintenance, and table pricing",
  pos: "Table → game type → start session → timer → finish → discount → cash/udhar → receipt",
  "billing-pricing": "Single Game, Double Game, and Century per-minute rates per branch and table",
  customers: "Player CRM: contact, visits, spend, notes, and credit balance",
  "credit-udhar": "Udhar ledger, limits, recoveries, partial payments, write-offs, and statements",
  discounts: "Fixed or percentage discounts with mandatory reason and approval history",
  expenses: "Rent, salaries, electricity, repairs, cleaning — categories and approval",
  shifts: "Daily opening cash and end-of-day reconciliation with variance approval",
  reports: "Sales, profit, expenses, credit, discounts, cash flow, tables, staff, and branches",
  staff: "Employees, roles (Owner/Manager/Cashier/Accountant/Viewer), and RBAC permissions",
  "audit-logs": "Immutable log of discounts, credit, price changes, roles, and closings",
  notifications: "Overdue credit, cash gaps, large discounts, maintenance, and pending closings",
  branches: "Club locations with separate tables, staff, pricing, hours, and consolidated reports",
  settings: "Game pricing, Century rates, branding, credit limits, discount rules, hours, and backups",
  memberships: "Paid membership tiers, validity, benefits, QR cards, and renewals",
  loyalty: "Reward points, redemption, levels, expiry, and loyalty reports",
  tournaments: "Leagues, brackets, table scheduling, scores, standings, and prize pools",
  "table-booking": "Online availability, deposits, confirmations, and cancellation rules",
  subscriptions: "SaaS packages, trials, invoices, renewals, limits, and suspension",
};

function modulePurpose(moduleId: ModuleId, industryId?: string | null) {
  if (industryId === "pharmacy") {
    return PHARMACY_MODULE_PURPOSE[moduleId] ?? MODULE_CATALOG[moduleId]?.description;
  }
  if (industryId === "snooker-pos") {
    return SNOOKER_MODULE_PURPOSE[moduleId] ?? MODULE_CATALOG[moduleId]?.description;
  }
  return undefined;
}

export function buildBusinessWorkspaceNav(
  templateConfig: ApiTemplateConfig,
  businessId?: string | null,
): WorkspaceNavTab[] {
  const config = hydrateWorkspaceTemplate(templateConfig) ?? templateConfig;
  const enabled = new Set(config.enabledModules);

  return config.navigation
    .filter((item) => item.visible && enabled.has(item.moduleId as ModuleId))
    .map((item) => {
      const moduleId = item.moduleId as ModuleId;
      const href = appendBusinessId(getModuleHref(moduleId, config.industryId), businessId);
      const Icon = resolveModuleIcon(moduleId);
      const inProgress = !isModuleImplemented(moduleId, config.industryId);
      return {
        key: moduleId,
        label: item.label,
        href,
        icon: createElement(Icon, { className: "h-5 w-5" }),
        inProgress,
        description: modulePurpose(moduleId, config.industryId),
      };
    });
}
