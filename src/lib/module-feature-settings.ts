export type ProductsModuleSettings = {
  allowCreate: boolean;
  allowEdit: boolean;
  viewMode: "grid" | "list";
};

export type OrdersModuleSettings = {
  viewType: "list" | "grid";
  /** Show All / Active products switch on the order product picker */
  allowProductScopeSwitch: boolean;
  /** Default filter when the switch is shown (or when switch is off) */
  productScopeDefault: "activeOnly" | "all";
  /**
   * restaurantLifecycle = place → active/kitchen → complete
   * orderOnly = cart → complete immediately (retail-style)
   */
  completionMode: "restaurantLifecycle" | "orderOnly";
  /** Live order queue (restaurant-style active orders screen) */
  showActiveOrders: boolean;
  /** Product picker / POS cart screen */
  showNewOrders: boolean;
  /** Which screen opens first when both are enabled */
  defaultSection: "active" | "new";
};

/** Categories capability — lives inside Products/Orders on mobile (not a nav tab). */
export type CategoriesModuleSettings = {
  /** Create / edit / delete via CategoryDialog */
  allowManage: boolean;
  /** Category filter chips on products & orders */
  showFilters: boolean;
};

export const DEFAULT_PRODUCTS_SETTINGS: ProductsModuleSettings = {
  allowCreate: true,
  allowEdit: true,
  viewMode: "grid",
};

export const DEFAULT_ORDERS_SETTINGS: OrdersModuleSettings = {
  viewType: "list",
  allowProductScopeSwitch: true,
  productScopeDefault: "activeOnly",
  completionMode: "restaurantLifecycle",
  showActiveOrders: true,
  showNewOrders: true,
  defaultSection: "active",
};

export const DEFAULT_CATEGORIES_SETTINGS: CategoriesModuleSettings = {
  allowManage: true,
  showFilters: true,
};

export function defaultOrdersSettingsForIndustry(
  industryId: string | null | undefined,
): OrdersModuleSettings {
  const retailLike =
    industryId &&
    !["restaurant", "food-cafe", "bakery"].includes(industryId) &&
    industryId !== "pharmacy";
  // Food ops keep full lifecycle; others using orders default to order-only.
  if (["restaurant", "food-cafe", "bakery"].includes(industryId ?? "")) {
    return { ...DEFAULT_ORDERS_SETTINGS };
  }
  if (retailLike) {
    return {
      ...DEFAULT_ORDERS_SETTINGS,
      completionMode: "orderOnly",
      productScopeDefault: "activeOnly",
      showActiveOrders: false,
      showNewOrders: true,
      defaultSection: "new",
    };
  }
  return { ...DEFAULT_ORDERS_SETTINGS };
}

export function parseProductsSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): ProductsModuleSettings {
  const raw = moduleSettings?.products;
  if (!raw || typeof raw !== "object") return DEFAULT_PRODUCTS_SETTINGS;
  return {
    allowCreate: raw.allowCreate !== false,
    allowEdit: raw.allowEdit !== false,
    viewMode: raw.viewMode === "list" ? "list" : "grid",
  };
}

export function parseOrdersSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
  industryId?: string | null,
): OrdersModuleSettings {
  const defaults = defaultOrdersSettingsForIndustry(industryId);
  const raw = moduleSettings?.orders;
  if (!raw || typeof raw !== "object") return defaults;
  return {
    viewType: raw.viewType === "grid" ? "grid" : "list",
    allowProductScopeSwitch:
      typeof raw.allowProductScopeSwitch === "boolean"
        ? raw.allowProductScopeSwitch
        : defaults.allowProductScopeSwitch,
    productScopeDefault:
      raw.productScopeDefault === "all" ? "all" : defaults.productScopeDefault,
    completionMode:
      raw.completionMode === "orderOnly" ? "orderOnly" : defaults.completionMode,
    showActiveOrders:
      typeof raw.showActiveOrders === "boolean"
        ? raw.showActiveOrders
        : defaults.showActiveOrders,
    showNewOrders:
      typeof raw.showNewOrders === "boolean" ? raw.showNewOrders : defaults.showNewOrders,
    defaultSection:
      raw.defaultSection === "new" || raw.defaultSection === "active"
        ? raw.defaultSection
        : defaults.defaultSection,
  };
}

export function parseCategoriesSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): CategoriesModuleSettings {
  const raw = moduleSettings?.categories;
  if (!raw || typeof raw !== "object") return DEFAULT_CATEGORIES_SETTINGS;
  return {
    allowManage: raw.allowManage !== false,
    showFilters: raw.showFilters !== false,
  };
}

export function serializeProductsSettings(settings: ProductsModuleSettings): Record<string, unknown> {
  return {
    allowCreate: settings.allowCreate,
    allowEdit: settings.allowEdit,
    viewMode: settings.viewMode,
  };
}

export function serializeOrdersSettings(settings: OrdersModuleSettings): Record<string, unknown> {
  return {
    viewType: settings.viewType,
    allowProductScopeSwitch: settings.allowProductScopeSwitch,
    productScopeDefault: settings.productScopeDefault,
    completionMode: settings.completionMode,
    showActiveOrders: settings.showActiveOrders,
    showNewOrders: settings.showNewOrders,
    defaultSection: settings.defaultSection,
  };
}

export function serializeCategoriesSettings(
  settings: CategoriesModuleSettings,
): Record<string, unknown> {
  return {
    allowManage: settings.allowManage,
    showFilters: settings.showFilters,
  };
}

export type SalesModuleSettings = {
  /** Staff can download invoice lists as Excel from Invoices */
  allowExport: boolean;
  /** Staff can connect a printer and print invoices */
  allowPrinter: boolean;
};

export const DEFAULT_SALES_SETTINGS: SalesModuleSettings = {
  allowExport: true,
  allowPrinter: true,
};

export function parseSalesSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): SalesModuleSettings {
  const raw = moduleSettings?.sales;
  if (!raw || typeof raw !== "object") return DEFAULT_SALES_SETTINGS;
  return {
    allowExport: raw.allowExport !== false,
    allowPrinter: raw.allowPrinter !== false,
  };
}

export function serializeSalesSettings(settings: SalesModuleSettings): Record<string, unknown> {
  return {
    allowExport: settings.allowExport,
    allowPrinter: settings.allowPrinter,
  };
}
