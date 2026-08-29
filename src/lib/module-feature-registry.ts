import type { ModuleId } from "@/templates/types";

/**
 * Declarative feature definitions for Software Control §7.
 * Add a feature here, persist under moduleSettings[moduleId], and read it in Flutter.
 */

export type ModuleFeatureBooleanDef = {
  kind: "boolean";
  key: string;
  label: string;
  description?: string;
  defaultValue: boolean;
};

export type ModuleFeatureEnumDef = {
  kind: "enum";
  key: string;
  label: string;
  description?: string;
  options: { id: string; label: string }[];
  defaultValue: string;
};

export type ModuleFeatureDef = ModuleFeatureBooleanDef | ModuleFeatureEnumDef;

export type ModuleFeatureRegistryEntry = {
  moduleId: ModuleId | "products";
  /** Alternate enabledModules ids that unlock this feature panel */
  aliases?: ModuleId[];
  title: string;
  description?: string;
  features: ModuleFeatureDef[];
};

/**
 * Registry for typed module features (dashboard cards stay separate — they use dashboardCards[]).
 */
export const MODULE_FEATURE_REGISTRY: ModuleFeatureRegistryEntry[] = [
  {
    moduleId: "products",
    aliases: ["menu"],
    title: "Products / Menu",
    description: "Create, edit, and layout controls for the product catalog on mobile.",
    features: [
      {
        kind: "boolean",
        key: "allowCreate",
        label: "Allow adding products",
        defaultValue: true,
      },
      {
        kind: "boolean",
        key: "allowEdit",
        label: "Allow editing products",
        defaultValue: true,
      },
      {
        kind: "enum",
        key: "viewMode",
        label: "Product layout",
        options: [
          { id: "grid", label: "Grid" },
          { id: "list", label: "List" },
        ],
        defaultValue: "grid",
      },
    ],
  },
  {
    moduleId: "orders",
    title: "Orders",
    description: "Order list layout and product-picker behaviour on mobile.",
    features: [
      {
        kind: "enum",
        key: "viewType",
        label: "Orders layout",
        options: [
          { id: "list", label: "List" },
          { id: "grid", label: "Grid" },
        ],
        defaultValue: "list",
      },
      {
        kind: "boolean",
        key: "allowProductScopeSwitch",
        label: "Show All / Active products switch",
        defaultValue: true,
      },
      {
        kind: "enum",
        key: "productScopeDefault",
        label: "Default product scope",
        options: [
          { id: "activeOnly", label: "Active only" },
          { id: "all", label: "All products" },
        ],
        defaultValue: "activeOnly",
      },
      {
        kind: "enum",
        key: "completionMode",
        label: "Completion mode",
        options: [
          { id: "restaurantLifecycle", label: "Restaurant lifecycle" },
          { id: "orderOnly", label: "Order only (complete from cart)" },
        ],
        defaultValue: "restaurantLifecycle",
      },
      {
        kind: "boolean",
        key: "showActiveOrders",
        label: "Show active orders queue",
        description: "Live orders screen (restaurant). Disable for retail/automobile POS-only flows.",
        defaultValue: true,
      },
      {
        kind: "boolean",
        key: "showNewOrders",
        label: "Show new order / POS screen",
        description: "Product picker and cart for taking sales.",
        defaultValue: true,
      },
      {
        kind: "enum",
        key: "defaultSection",
        label: "Default orders screen",
        options: [
          { id: "active", label: "Active orders" },
          { id: "new", label: "New order (POS)" },
        ],
        defaultValue: "active",
      },
    ],
  },
  {
    moduleId: "categories",
    title: "Categories",
    description:
      "Mobile capability (not a tab). Controls category manage dialog and filter chips inside Products / Orders.",
    features: [
      {
        kind: "boolean",
        key: "allowManage",
        label: "Allow managing categories",
        description: "Create, edit, and delete via the Categories dialog on mobile.",
        defaultValue: true,
      },
      {
        kind: "boolean",
        key: "showFilters",
        label: "Show category filter chips",
        description: "Category chips on Products and Orders screens.",
        defaultValue: true,
      },
    ],
  },
  {
    moduleId: "sales",
    title: "Invoices / Sales",
    description: "Invoice list tools on mobile and in the staff portal.",
    features: [
      {
        kind: "boolean",
        key: "allowExport",
        label: "Allow Excel export",
        description: "Staff can download the invoice list as Excel.",
        defaultValue: true,
      },
      {
        kind: "boolean",
        key: "allowPrinter",
        label: "Allow printer access",
        description: "Staff can connect a printer and print invoices.",
        defaultValue: true,
      },
    ],
  },
];

export function featurePanelVisible(
  entry: ModuleFeatureRegistryEntry,
  enabledModules: ModuleId[],
): boolean {
  if (enabledModules.includes(entry.moduleId as ModuleId)) return true;
  return (entry.aliases ?? []).some((id) => enabledModules.includes(id));
}

/** Settings key written to moduleSettings (products panel uses "products" even when menu is enabled). */
export function featureSettingsKey(entry: ModuleFeatureRegistryEntry): string {
  return entry.moduleId;
}
