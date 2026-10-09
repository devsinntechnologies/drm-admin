export type ProductsModuleSettings = {
  allowCreate: boolean;
  allowEdit: boolean;
  allowBarcodeOnCreate: boolean;
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
  /** USB gun + camera add-to-cart on the POS screen */
  allowBarcodeScanner: boolean;

  // ── Active order queue buttons ─────────────────────────────────────────
  allowViewDetails: boolean;
  allowRefresh: boolean;
  allowCreate: boolean;
  allowEdit: boolean;
  allowChangeTable: boolean;
  allowRemove: boolean;
  allowComplete: boolean;
  allowPrint: boolean;
  allowDownloadPdf: boolean;
  allowSelfOrderApprove: boolean;
  allowSelfOrderReject: boolean;

  // ── Cart / order actions ──────────────────────────────────────────────
  allowExtraCharges: boolean;
  /** Delivery charge row inside Extra Charges */
  allowDeliveryCharge: boolean;
  /** Packing charge row inside Extra Charges */
  allowPackingCharge: boolean;
  /** Put-on-credit checkbox / party dialog on cart */
  allowCreditSale: boolean;
  allowPriceOverride: boolean;
  allowLineDiscount: boolean;

  // ── Timed table sessions (snooker Counter / POS) ───────────────────────
  /** Master: show Table session block when placing an order */
  enableTableSession: boolean;
  allowSessionDuration: boolean;
  allowOpenEndedSession: boolean;
  allowSessionGameType: boolean;
  allowSessionEditTime: boolean;
  allowSessionAddTime: boolean;
  allowSessionPause: boolean;
  allowSessionTimeUpAlert: boolean;
  /** BOOKED / OVERTIME ribbon + live timer on product cards */
  showTableBookingStatus: boolean;
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
  allowBarcodeOnCreate: false,
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
  allowBarcodeScanner: false,
  allowViewDetails: true,
  allowRefresh: true,
  allowCreate: true,
  allowEdit: true,
  allowChangeTable: true,
  allowRemove: true,
  allowComplete: true,
  allowPrint: true,
  allowDownloadPdf: true,
  allowSelfOrderApprove: true,
  allowSelfOrderReject: true,
  allowExtraCharges: true,
  allowDeliveryCharge: true,
  allowPackingCharge: true,
  allowCreditSale: true,
  allowPriceOverride: true,
  allowLineDiscount: true,
  enableTableSession: false,
  allowSessionDuration: true,
  allowOpenEndedSession: true,
  allowSessionGameType: true,
  allowSessionEditTime: true,
  allowSessionAddTime: true,
  allowSessionPause: true,
  allowSessionTimeUpAlert: true,
  showTableBookingStatus: false,
};

function boolOr(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback;
}

export const DEFAULT_CATEGORIES_SETTINGS: CategoriesModuleSettings = {
  allowManage: true,
  showFilters: true,
};

export function defaultOrdersSettingsForIndustry(
  industryId: string | null | undefined,
): OrdersModuleSettings {
  // Food + snooker keep Active Orders / restaurant lifecycle.
  if (
    industryId === "restaurant" ||
    industryId === "food-cafe" ||
    industryId === "bakery" ||
    industryId === "snooker-pos"
  ) {
    const snooker = industryId === "snooker-pos";
    // Restaurant / food-cafe / bakery: same Orders module, sessions OFF.
    // Only snooker-pos defaults sessions ON — admin can still toggle either way.
    return {
      ...DEFAULT_ORDERS_SETTINGS,
      completionMode: "restaurantLifecycle",
      showActiveOrders: true,
      showNewOrders: true,
      defaultSection: snooker ? "new" : "active",
      enableTableSession: snooker,
      showTableBookingStatus: snooker,
      // Child flags only matter when enableTableSession is on.
      allowSessionDuration: true,
      allowOpenEndedSession: true,
      allowSessionGameType: true,
      allowSessionEditTime: true,
      allowSessionAddTime: true,
      allowSessionPause: true,
      allowSessionTimeUpAlert: true,
    };
  }
  const retailLike = industryId && industryId !== "pharmacy";
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
    allowBarcodeOnCreate: raw.allowBarcodeOnCreate === true,
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
    allowProductScopeSwitch: boolOr(
      raw.allowProductScopeSwitch,
      defaults.allowProductScopeSwitch,
    ),
    productScopeDefault:
      raw.productScopeDefault === "all" ? "all" : defaults.productScopeDefault,
    completionMode:
      raw.completionMode === "orderOnly" ? "orderOnly" : defaults.completionMode,
    showActiveOrders: boolOr(raw.showActiveOrders, defaults.showActiveOrders),
    showNewOrders: boolOr(raw.showNewOrders, defaults.showNewOrders),
    defaultSection:
      raw.defaultSection === "new" || raw.defaultSection === "active"
        ? raw.defaultSection
        : defaults.defaultSection,
    allowBarcodeScanner: boolOr(
      raw.allowBarcodeScanner,
      defaults.allowBarcodeScanner,
    ),
    allowViewDetails: boolOr(raw.allowViewDetails, defaults.allowViewDetails),
    allowRefresh: boolOr(raw.allowRefresh, defaults.allowRefresh),
    allowCreate: boolOr(raw.allowCreate, defaults.allowCreate),
    allowEdit: boolOr(raw.allowEdit, defaults.allowEdit),
    allowChangeTable: boolOr(raw.allowChangeTable, defaults.allowChangeTable),
    allowRemove: boolOr(raw.allowRemove, defaults.allowRemove),
    allowComplete: boolOr(raw.allowComplete, defaults.allowComplete),
    allowPrint: boolOr(raw.allowPrint, defaults.allowPrint),
    allowDownloadPdf: boolOr(raw.allowDownloadPdf, defaults.allowDownloadPdf),
    allowSelfOrderApprove: boolOr(
      raw.allowSelfOrderApprove,
      defaults.allowSelfOrderApprove,
    ),
    allowSelfOrderReject: boolOr(
      raw.allowSelfOrderReject,
      defaults.allowSelfOrderReject,
    ),
    allowExtraCharges: boolOr(raw.allowExtraCharges, defaults.allowExtraCharges),
    allowDeliveryCharge: boolOr(
      raw.allowDeliveryCharge,
      defaults.allowDeliveryCharge,
    ),
    allowPackingCharge: boolOr(
      raw.allowPackingCharge,
      defaults.allowPackingCharge,
    ),
    allowCreditSale: boolOr(raw.allowCreditSale, defaults.allowCreditSale),
    allowPriceOverride: boolOr(raw.allowPriceOverride, defaults.allowPriceOverride),
    allowLineDiscount: boolOr(raw.allowLineDiscount, defaults.allowLineDiscount),
    enableTableSession: boolOr(raw.enableTableSession, defaults.enableTableSession),
    allowSessionDuration: boolOr(
      raw.allowSessionDuration,
      defaults.allowSessionDuration,
    ),
    allowOpenEndedSession: boolOr(
      raw.allowOpenEndedSession,
      defaults.allowOpenEndedSession,
    ),
    allowSessionGameType: boolOr(
      raw.allowSessionGameType,
      defaults.allowSessionGameType,
    ),
    allowSessionEditTime: boolOr(
      raw.allowSessionEditTime,
      defaults.allowSessionEditTime,
    ),
    allowSessionAddTime: boolOr(
      raw.allowSessionAddTime,
      defaults.allowSessionAddTime,
    ),
    allowSessionPause: boolOr(raw.allowSessionPause, defaults.allowSessionPause),
    allowSessionTimeUpAlert: boolOr(
      raw.allowSessionTimeUpAlert,
      defaults.allowSessionTimeUpAlert,
    ),
    showTableBookingStatus: boolOr(
      raw.showTableBookingStatus,
      defaults.showTableBookingStatus,
    ),
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
    allowBarcodeOnCreate: settings.allowBarcodeOnCreate,
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
    allowBarcodeScanner: settings.allowBarcodeScanner,
    allowViewDetails: settings.allowViewDetails,
    allowRefresh: settings.allowRefresh,
    allowCreate: settings.allowCreate,
    allowEdit: settings.allowEdit,
    allowChangeTable: settings.allowChangeTable,
    allowRemove: settings.allowRemove,
    allowComplete: settings.allowComplete,
    allowPrint: settings.allowPrint,
    allowDownloadPdf: settings.allowDownloadPdf,
    allowSelfOrderApprove: settings.allowSelfOrderApprove,
    allowSelfOrderReject: settings.allowSelfOrderReject,
    allowExtraCharges: settings.allowExtraCharges,
    allowDeliveryCharge: settings.allowDeliveryCharge,
    allowPackingCharge: settings.allowPackingCharge,
    allowCreditSale: settings.allowCreditSale,
    allowPriceOverride: settings.allowPriceOverride,
    allowLineDiscount: settings.allowLineDiscount,
    enableTableSession: settings.enableTableSession,
    allowSessionDuration: settings.allowSessionDuration,
    allowOpenEndedSession: settings.allowOpenEndedSession,
    allowSessionGameType: settings.allowSessionGameType,
    allowSessionEditTime: settings.allowSessionEditTime,
    allowSessionAddTime: settings.allowSessionAddTime,
    allowSessionPause: settings.allowSessionPause,
    allowSessionTimeUpAlert: settings.allowSessionTimeUpAlert,
    showTableBookingStatus: settings.showTableBookingStatus,
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
  allowPreview: boolean;
  allowRefresh: boolean;
  allowFilters: boolean;
  allowPrinterSetup: boolean;
  allowPrint: boolean;
  allowDownloadPdf: boolean;
  allowReturn: boolean;
  allowDelete: boolean;
  showRevenue: boolean;
};

export const DEFAULT_SALES_SETTINGS: SalesModuleSettings = {
  allowExport: true,
  allowPrinter: true,
  allowPreview: true,
  allowRefresh: true,
  allowFilters: true,
  allowPrinterSetup: true,
  allowPrint: true,
  allowDownloadPdf: true,
  allowReturn: true,
  allowDelete: true,
  showRevenue: true,
};

export function parseSalesSettings(
  moduleSettings?: Record<string, Record<string, unknown>> | null,
): SalesModuleSettings {
  const raw = moduleSettings?.sales;
  if (!raw || typeof raw !== "object") return DEFAULT_SALES_SETTINGS;
  return {
    allowExport: raw.allowExport !== false,
    allowPrinter: raw.allowPrinter !== false,
    allowPreview: raw.allowPreview !== false,
    allowRefresh: raw.allowRefresh !== false,
    allowFilters: raw.allowFilters !== false,
    allowPrinterSetup: raw.allowPrinterSetup !== false,
    allowPrint: raw.allowPrint !== false,
    allowDownloadPdf: raw.allowDownloadPdf !== false,
    allowReturn: raw.allowReturn !== false,
    allowDelete: raw.allowDelete !== false,
    showRevenue: raw.showRevenue !== false,
  };
}

export function serializeSalesSettings(settings: SalesModuleSettings): Record<string, unknown> {
  return {
    allowExport: settings.allowExport,
    allowPrinter: settings.allowPrinter,
    allowPreview: settings.allowPreview,
    allowRefresh: settings.allowRefresh,
    allowFilters: settings.allowFilters,
    allowPrinterSetup: settings.allowPrinterSetup,
    allowPrint: settings.allowPrint,
    allowDownloadPdf: settings.allowDownloadPdf,
    allowReturn: settings.allowReturn,
    allowDelete: settings.allowDelete,
    showRevenue: settings.showRevenue,
  };
}
