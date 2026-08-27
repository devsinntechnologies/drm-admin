export type ProductsModuleSettings = {
  allowCreate: boolean;
  allowEdit: boolean;
  viewMode: "grid" | "list";
};

export type OrdersModuleSettings = {
  viewType: "list" | "grid";
};

export const DEFAULT_PRODUCTS_SETTINGS: ProductsModuleSettings = {
  allowCreate: true,
  allowEdit: true,
  viewMode: "grid",
};

export const DEFAULT_ORDERS_SETTINGS: OrdersModuleSettings = {
  viewType: "list",
};

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
): OrdersModuleSettings {
  const raw = moduleSettings?.orders;
  if (!raw || typeof raw !== "object") return DEFAULT_ORDERS_SETTINGS;
  return {
    viewType: raw.viewType === "grid" ? "grid" : "list",
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
  return { viewType: settings.viewType };
}
