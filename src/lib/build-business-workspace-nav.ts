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
  pos: "Search medicines, apply GST, and complete FEFO billing",
  products: "Medicine catalog with salt, barcode, GST, and Rx flags",
  categories: "Group medicines such as tablets, syrups, OTC, and controlled",
  batches: "Lot numbers, MRP, rack location, and remaining quantity",
  expiry: "Near-expiry alerts, quarantine, and write-off",
  inventory: "On-hand stock in base units with reorder flags",
  prescriptions: "Rx intake, image attach, partial fill, and refill list",
  cdss: "Local interaction, allergy, and contraindication checks",
  "controlled-substances": "Schedule II/III dispense log and compliance",
  purchases: "Purchase orders and GRN that create batches",
  suppliers: "Vendor master, payment terms, and AP aging",
  customers: "Patients, allergies, and loyalty points",
  sales: "Paid invoices and pharmacy sale history",
  returns: "Restock to batch or quarantine damaged returns",
  reports: "Best/slow movers, dead stock, margins, and salt sales",
  accounting: "Journals, accounts payable, P&L, and GST export",
  shifts: "Cash drawer open/close and handover",
  staff: "Pharmacist, cashier, manager, shift, and inventory logins",
  settings: "Business profile and workspace options",
  branches: "Locations and inter-branch stock transfer",
};

function modulePurpose(moduleId: ModuleId, industryId?: string | null) {
  if (industryId === "pharmacy") {
    return PHARMACY_MODULE_PURPOSE[moduleId] ?? MODULE_CATALOG[moduleId]?.description;
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
      const inProgress = !isModuleImplemented(moduleId);
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
