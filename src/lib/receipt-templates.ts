/**
 * POS invoice (receipt) templates — portal port of the Flutter layout
 * (diginizam-flutter lib/services/receipt/receipt_layout.dart and
 * lib/models/receipt/receipt_settings.dart). Settings live in
 * `templateConfig.moduleSettings.receipt`; the POS prints with them.
 *
 * scripts/receipt-templates.test.cjs checks this file renders the exact text
 * as the Flutter golden files, so the portal preview matches the paper.
 */

export const RECEIPT_TEMPLATE_IDS = ["classic", "compact", "detailed", "modern"] as const;
export type ReceiptTemplateId = (typeof RECEIPT_TEMPLATE_IDS)[number];

export type ReceiptTemplateInfo = {
  id: ReceiptTemplateId;
  name: string;
  summary: string;
  highlights: string[];
};

export const RECEIPT_TEMPLATES: ReceiptTemplateInfo[] = [
  {
    id: "classic",
    name: "Classic",
    summary:
      "The original restaurant receipt: big order-type banner, 3-column items and a large net amount.",
    highlights: ["Logo", "DINING / TAKE AWAY banner", "QR footer"],
  },
  {
    id: "compact",
    name: "Compact",
    summary: "Paper saver for busy counters: no logo or QR, one line per item.",
    highlights: ["Shortest print", "Qty x item lines", "Payment method"],
  },
  {
    id: "detailed",
    name: "Detailed",
    summary:
      "Sales-invoice layout with rate column, variants, guest and payment details.",
    highlights: ["Qty / Rate / Amount", "Variant lines", "Item & qty count"],
  },
  {
    id: "modern",
    name: "Modern",
    summary:
      "Bold look with a reversed order banner, large order number and highlighted total.",
    highlights: ["Reverse-print banner", "Large order no.", "Highlighted total"],
  },
];

export function isReceiptTemplateId(value: unknown): value is ReceiptTemplateId {
  return typeof value === "string" && (RECEIPT_TEMPLATE_IDS as readonly string[]).includes(value);
}

export const isCustomTemplateId = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("custom-");

export const DEFAULT_RECEIPT_QR_URL = "https://diginizam.com/";

// ---------------------------------------------------------------------------
// Invoice editor copies
// ---------------------------------------------------------------------------

export const RECEIPT_LOGO_MODES = [
  { id: "default", label: "DigiNizam logo" },
  { id: "business", label: "Business logo" },
  { id: "custom", label: "Upload a logo" },
  { id: "none", label: "No logo" },
] as const;
export type ReceiptLogoMode = (typeof RECEIPT_LOGO_MODES)[number]["id"];

/** Logo width in printer dots on 80mm (576-dot) paper. */
export const RECEIPT_LOGO_WIDTH = { standard: 120, min: 60, max: 480 } as const;
export const RECEIPT_DIVIDER_CHOICES = ["default", "-", "=", ".", "*", "_", "none"] as const;
export const RECEIPT_MAX_PADDING = 8;
export const RECEIPT_MAX_FEED_LINES = 8;

export type ReceiptSectionStyle = {
  align?: ReceiptAlign;
  bold?: boolean;
  size?: number;
};

export type CustomReceiptTemplate = {
  id: string;
  name: string;
  baseTemplateId: ReceiptTemplateId;
  logoMode: ReceiptLogoMode;
  logoUrl: string;
  logoWidth: number;
  paddingLeft: number;
  paddingRight: number;
  divider: (typeof RECEIPT_DIVIDER_CHOICES)[number];
  feedLines: number;
  hidden: string[];
  styles: Record<string, ReceiptSectionStyle>;
  labels: Record<string, string>;
  headerNote: string;
  footerNote: string;
  qrUrl: string;
  paymentLines: string[] | null;
};

export type ReceiptSettings = {
  /** Built-in id or a custom copy id. */
  templateId: string;
  allowedTemplateIds: string[];
  showLogo: boolean;
  showQr: boolean;
  qrUrl: string;
  showPoweredBy: boolean;
  headerNote: string;
  footerNote: string;
  /** null = Classic keeps its built-in wallet numbers (legacy behaviour). */
  paymentLines: string[] | null;
  customTemplates: CustomReceiptTemplate[];
  /** From the business profile; used by the "Business logo" option. */
  businessLogoUrl?: string | null;
  // Effective values for a custom copy (see settingsForCustom).
  logoUrl?: string | null;
  logoWidth?: number;
  labels?: Record<string, string>;
};

export const DEFAULT_RECEIPT_SETTINGS: ReceiptSettings = {
  templateId: "classic",
  allowedTemplateIds: ["classic"],
  showLogo: true,
  showQr: true,
  qrUrl: DEFAULT_RECEIPT_QR_URL,
  showPoweredBy: true,
  headerNote: "",
  footerNote: "",
  paymentLines: null,
  customTemplates: [],
};

const clampInt = (raw: unknown, fallback: number, min: number, max: number) => {
  const n = typeof raw === "number" ? Math.trunc(raw) : Number.parseInt(String(raw ?? ""), 10);
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : fallback));
};
const trimmed = (raw: unknown) => (typeof raw === "string" ? raw.trim() : "");
const asRecord = (raw: unknown): Record<string, unknown> =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
const cleanLines = (raw: unknown) =>
  Array.isArray(raw) ? raw.map((line) => String(line).trim()).filter(Boolean) : null;

/** Mirrors Flutter `CustomReceiptTemplate.fromJson`. */
export function parseCustomTemplate(raw: unknown): CustomReceiptTemplate {
  const json = asRecord(raw);
  const styles: Record<string, ReceiptSectionStyle> = {};
  for (const [section, value] of Object.entries(asRecord(json.styles))) {
    const style = asRecord(value);
    const out: ReceiptSectionStyle = {};
    if (style.align === "left" || style.align === "center" || style.align === "right") out.align = style.align;
    if (typeof style.bold === "boolean") out.bold = style.bold;
    if (style.size != null && style.size !== "") out.size = clampInt(style.size, 1, 1, 3);
    styles[section] = out;
  }
  const labels: Record<string, string> = {};
  for (const [key, value] of Object.entries(asRecord(json.labels))) {
    const text = String(value ?? "").trim();
    if (text) labels[key] = text;
  }
  const logoMode = RECEIPT_LOGO_MODES.some((m) => m.id === json.logoMode)
    ? (json.logoMode as ReceiptLogoMode)
    : "default";
  const divider = (RECEIPT_DIVIDER_CHOICES as readonly unknown[]).includes(json.divider)
    ? (json.divider as CustomReceiptTemplate["divider"])
    : "default";
  return {
    id: trimmed(json.id),
    name: trimmed(json.name) || "Custom invoice",
    baseTemplateId: isReceiptTemplateId(json.baseTemplateId) ? json.baseTemplateId : "classic",
    logoMode,
    logoUrl: trimmed(json.logoUrl),
    logoWidth: clampInt(json.logoWidth, RECEIPT_LOGO_WIDTH.standard, RECEIPT_LOGO_WIDTH.min, RECEIPT_LOGO_WIDTH.max),
    paddingLeft: clampInt(json.paddingLeft, 0, 0, RECEIPT_MAX_PADDING),
    paddingRight: clampInt(json.paddingRight, 0, 0, RECEIPT_MAX_PADDING),
    divider,
    feedLines: clampInt(json.feedLines, 2, 0, RECEIPT_MAX_FEED_LINES),
    hidden: Array.isArray(json.hidden) ? json.hidden.map(String) : [],
    styles,
    labels,
    headerNote: trimmed(json.headerNote),
    footerNote: trimmed(json.footerNote),
    qrUrl: trimmed(json.qrUrl),
    paymentLines: cleanLines(json.paymentLines),
  };
}

/** Shape the API stores for a copy. */
export function serializeCustomTemplate(t: CustomReceiptTemplate): Record<string, unknown> {
  const styles: Record<string, ReceiptSectionStyle> = {};
  for (const [section, style] of Object.entries(t.styles)) {
    if (style.align != null || style.bold != null || style.size != null) styles[section] = style;
  }
  return {
    ...(t.id ? { id: t.id } : {}),
    name: t.name.trim() || "Custom invoice",
    baseTemplateId: t.baseTemplateId,
    logoMode: t.logoMode,
    logoUrl: t.logoUrl.trim(),
    logoWidth: t.logoWidth,
    paddingLeft: t.paddingLeft,
    paddingRight: t.paddingRight,
    divider: t.divider,
    feedLines: t.feedLines,
    hidden: [...new Set(t.hidden)],
    styles,
    labels: Object.fromEntries(Object.entries(t.labels).filter(([, v]) => v.trim())),
    headerNote: t.headerNote.trim(),
    footerNote: t.footerNote.trim(),
    qrUrl: t.qrUrl.trim(),
    ...(t.paymentLines ? { paymentLines: t.paymentLines.map((l) => l.trim()).filter(Boolean) } : {}),
  };
}

/** New copy of a built-in template carrying the business-wide details. */
export function copyOfTemplate(
  baseTemplateId: ReceiptTemplateId,
  settings: ReceiptSettings,
  name?: string,
): CustomReceiptTemplate {
  const base = RECEIPT_TEMPLATES.find((t) => t.id === baseTemplateId) ?? RECEIPT_TEMPLATES[0];
  return {
    id: "",
    name: name ?? `${base.name} (custom)`,
    baseTemplateId: base.id,
    logoMode: "default",
    logoUrl: "",
    logoWidth: RECEIPT_LOGO_WIDTH.standard,
    paddingLeft: 0,
    paddingRight: 0,
    divider: "default",
    feedLines: 2,
    hidden: [
      ...(!settings.showLogo || base.id === "compact" ? ["logo"] : []),
      ...(!settings.showQr || base.id === "compact" ? ["qr"] : []),
      ...(!settings.showPoweredBy ? ["poweredBy"] : []),
    ],
    styles: {},
    labels: {},
    headerNote: settings.headerNote,
    footerNote: settings.footerNote,
    qrUrl: settings.qrUrl === DEFAULT_RECEIPT_QR_URL ? "" : settings.qrUrl,
    paymentLines: settings.paymentLines,
  };
}

/** Client-made copy id (same shape the API generates). */
export function newCustomTemplateId() {
  const bytes = new Uint8Array(5);
  globalThis.crypto.getRandomValues(bytes);
  return `custom-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

/** Mirrors Flutter `ReceiptSettings.fromJson`. */
export function parseReceiptSettings(
  moduleSettings: Record<string, Record<string, unknown>> | null | undefined,
  businessLogoUrl?: string | null,
): ReceiptSettings {
  const raw = moduleSettings?.receipt;
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_RECEIPT_SETTINGS, ...(businessLogoUrl !== undefined ? { businessLogoUrl } : {}) };
  }
  const customs = (Array.isArray(raw.customTemplates) ? raw.customTemplates : [])
    .map(parseCustomTemplate)
    .filter((t) => isCustomTemplateId(t.id));
  const known = (id: unknown): id is string =>
    isReceiptTemplateId(id) || customs.some((t) => t.id === id);
  const templateId = known(raw.templateId) ? raw.templateId : "classic";
  const allowed = new Set<string>(
    Array.isArray(raw.allowedTemplateIds) ? raw.allowedTemplateIds.filter(known) : [],
  );
  allowed.add(templateId);
  const qrUrl = trimmed(raw.qrUrl);
  return {
    templateId,
    allowedTemplateIds: [
      ...RECEIPT_TEMPLATE_IDS.filter((id) => allowed.has(id)),
      ...customs.map((t) => t.id).filter((id) => allowed.has(id)),
    ],
    showLogo: typeof raw.showLogo === "boolean" ? raw.showLogo : true,
    showQr: typeof raw.showQr === "boolean" ? raw.showQr : true,
    qrUrl: qrUrl || DEFAULT_RECEIPT_QR_URL,
    showPoweredBy: typeof raw.showPoweredBy === "boolean" ? raw.showPoweredBy : true,
    headerNote: trimmed(raw.headerNote),
    footerNote: trimmed(raw.footerNote),
    paymentLines: cleanLines(raw.paymentLines),
    customTemplates: customs,
    ...(businessLogoUrl !== undefined ? { businessLogoUrl } : {}),
  };
}

/** Shape saved to `moduleSettings.receipt` (validated by the API). */
export function serializeReceiptSettings(settings: ReceiptSettings): Record<string, unknown> {
  const ids = [...RECEIPT_TEMPLATE_IDS, ...settings.customTemplates.map((t) => t.id)] as string[];
  const allowed = new Set(settings.allowedTemplateIds);
  allowed.add(settings.templateId);
  return {
    templateId: settings.templateId,
    allowedTemplateIds: ids.filter((id) => allowed.has(id)),
    showLogo: settings.showLogo,
    showQr: settings.showQr,
    qrUrl: settings.qrUrl.trim() === DEFAULT_RECEIPT_QR_URL ? "" : settings.qrUrl.trim(),
    showPoweredBy: settings.showPoweredBy,
    headerNote: settings.headerNote.trim(),
    footerNote: settings.footerNote.trim(),
    ...(settings.paymentLines
      ? { paymentLines: settings.paymentLines.map((line) => line.trim()).filter(Boolean) }
      : {}),
    customTemplates: settings.customTemplates.map(serializeCustomTemplate),
  };
}

export function templateName(settings: ReceiptSettings, id: string) {
  return (
    settings.customTemplates.find((t) => t.id === id)?.name ??
    RECEIPT_TEMPLATES.find((t) => t.id === id)?.name ??
    "Classic"
  );
}

/** Settings the base layout sees when printing a copy (Flutter `forCustom`). */
export function settingsForCustom(settings: ReceiptSettings, copy: CustomReceiptTemplate): ReceiptSettings {
  const hidden = new Set(copy.hidden);
  const logoUrl =
    copy.logoMode === "business"
      ? settings.businessLogoUrl || null
      : copy.logoMode === "custom"
        ? copy.logoUrl || null
        : null;
  const logoMissing = (copy.logoMode === "business" || copy.logoMode === "custom") && logoUrl == null;
  return {
    ...settings,
    showLogo: copy.logoMode !== "none" && !logoMissing && !hidden.has("logo"),
    showQr: !hidden.has("qr"),
    qrUrl: copy.qrUrl || DEFAULT_RECEIPT_QR_URL,
    showPoweredBy: !hidden.has("poweredBy"),
    headerNote: copy.headerNote,
    footerNote: copy.footerNote,
    paymentLines: copy.paymentLines,
    logoUrl,
    logoWidth: copy.logoWidth,
    labels: copy.labels,
  };
}

// ---------------------------------------------------------------------------
// Sections and titles the editor exposes
// ---------------------------------------------------------------------------

export const RECEIPT_SECTION_NAMES: Record<string, string> = {
  logo: "Logo",
  storeName: "Business name",
  headerNote: "Header note",
  address: "Address",
  phone: "Phone",
  wallet: "Payment numbers",
  banner: "Order type banner",
  title: "Invoice title",
  orderNo: "Order number",
  guest: "Customer name",
  guests: "Guest count",
  session: "Session details",
  details: "Invoice details",
  itemsHeader: "Item column titles",
  items: "Items",
  itemCount: "Item & qty count",
  totals: "Subtotal & charges",
  total: "Total",
  paidBy: "Payment method",
  qr: "QR code",
  notes: "Order notes",
  footerNote: "Footer note",
  footerName: "Business name (footer)",
  poweredBy: "Powered by DigiNizam",
};

export const RECEIPT_LABEL_NAMES: Record<string, string> = {
  title: "Invoice title",
  orderNo: "Order number title",
  invoiceNo: "Invoice number",
  date: "Date",
  orderType: "Order type",
  table: "Table",
  customer: "Customer",
  guests: "Guests",
  itemHeader: "Item column",
  qtyHeader: "Qty column",
  rateHeader: "Rate column",
  amountHeader: "Amount column",
  itemCount: "Item count",
  subtotal: "Subtotal",
  discount: "Discount",
  delivery: "Delivery",
  packaging: "Packaging",
  total: "Total",
  paidBy: "Payment method",
};

const COMMON_LABELS = { discount: "Discount", delivery: "Delivery", packaging: "Packaging" };

/** Each template's default titles (Flutter `ReceiptLabels.defaults`). */
export const RECEIPT_LABEL_DEFAULTS: Record<ReceiptTemplateId, Record<string, string>> = {
  classic: {
    invoiceNo: "Invoice #",
    date: "Date",
    orderType: "Type",
    guests: "Dine Persons",
    itemHeader: "Item Name",
    qtyHeader: "Qty/Wt",
    amountHeader: "Amount",
    subtotal: "Sub-Total",
    ...COMMON_LABELS,
    total: "NET AMOUNT",
  },
  compact: {
    customer: "Customer",
    guests: "Guests",
    subtotal: "Subtotal",
    ...COMMON_LABELS,
    total: "TOTAL",
    paidBy: "Paid by",
  },
  detailed: {
    title: "SALES INVOICE",
    invoiceNo: "Invoice No",
    date: "Date",
    orderType: "Order Type",
    table: "Table",
    guests: "Guests",
    customer: "Customer",
    paidBy: "Payment",
    itemHeader: "Item",
    qtyHeader: "Qty",
    rateHeader: "Rate",
    amountHeader: "Amount",
    itemCount: "Items / Qty",
    subtotal: "Subtotal",
    ...COMMON_LABELS,
    total: "GRAND TOTAL",
  },
  modern: {
    orderNo: "ORDER NO",
    guests: "guests",
    subtotal: "Subtotal",
    ...COMMON_LABELS,
    total: "TOTAL",
    paidBy: "Paid by",
  },
};

// ---------------------------------------------------------------------------
// Line model
// ---------------------------------------------------------------------------

export type ReceiptAlign = "left" | "center" | "right";

export type ReceiptCell = { text: string; width: number; align: ReceiptAlign };

export type ReceiptLine =
  | {
      kind: "text";
      text: string;
      align: ReceiptAlign;
      bold: boolean;
      size: number;
      small: boolean;
      reverse: boolean;
    }
  | { kind: "row"; cells: ReceiptCell[]; bold: boolean; size: number }
  | { kind: "divider"; char: string }
  | { kind: "feed"; lines: number }
  /** url null = DigiNizam logo; width in dots on 576-dot paper. */
  | { kind: "logo"; url: string | null; width: number }
  | { kind: "qr"; data: string };

/** A finished receipt: lines plus blank columns on each side. */
export type ReceiptDocument = {
  lines: ReceiptLine[];
  paddingLeft: number;
  paddingRight: number;
};

type TextOptions = Partial<{
  align: ReceiptAlign;
  bold: boolean;
  size: number;
  small: boolean;
  reverse: boolean;
}>;

const text = (value: string, o: TextOptions = {}): ReceiptLine => ({
  kind: "text",
  text: value,
  align: o.align ?? "left",
  bold: o.bold ?? false,
  size: o.size ?? 1,
  small: o.small ?? false,
  reverse: o.reverse ?? false,
});
const cell = (value: string, width: number, align: ReceiptAlign = "left"): ReceiptCell => ({
  text: value,
  width,
  align,
});
const row = (cells: ReceiptCell[], o: { bold?: boolean; size?: number } = {}): ReceiptLine => ({
  kind: "row",
  cells,
  bold: o.bold ?? false,
  size: o.size ?? 1,
});
const divider = (char = "-"): ReceiptLine => ({ kind: "divider", char });
const feed = (lines = 1): ReceiptLine => ({ kind: "feed", lines });

export type ReceiptItem = {
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
};

export type ReceiptData = {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  invoiceNumber?: string;
  date: string;
  orderType?: string;
  tableName?: string;
  customerName?: string;
  guestName?: string;
  sessionLines?: string[];
  dinePersons?: number;
  paymentMethod?: string;
  items: ReceiptItem[];
  deliveryCharges?: number;
  packagingPrice?: number;
  notes?: string;
};

const gross = (item: ReceiptItem) => item.unitPrice * item.quantity;
const lineTotal = (item: ReceiptItem) => gross(item) - (item.discount ?? 0);

export function receiptTotals(data: ReceiptData) {
  const subtotal = data.items.reduce((sum, item) => sum + gross(item), 0);
  const discount = data.items.reduce((sum, item) => sum + (item.discount ?? 0), 0);
  const quantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
  const net = subtotal - discount + (data.deliveryCharges ?? 0) + (data.packagingPrice ?? 0);
  return { subtotal, discount, quantity, net };
}

// Order-type wording (Flutter ReceiptOrderContext).
function combined(data: ReceiptData) {
  return `${data.orderType ?? ""} ${data.tableName ?? ""}`.toLowerCase();
}
function isDelivery(data: ReceiptData) {
  return combined(data).includes("delivery");
}
function isQuickService(data: ReceiptData) {
  const c = combined(data);
  return c.includes("take away") || c.includes("takeaway") || c.includes("delivery");
}
function orderTypeLabel(data: ReceiptData) {
  if (isDelivery(data)) return "Delivery";
  const c = combined(data);
  if (c.includes("take away") || c.includes("takeaway")) return "Take Away";
  return "Dine-In";
}
function tableNumber(tableName?: string): string | null {
  const table = (tableName ?? "").trim();
  if (!table) return null;
  const lower = table.toLowerCase();
  if (lower.includes("take away") || lower.includes("takeaway") || lower.includes("delivery")) {
    return null;
  }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(table)) return null;
  const match = /(\d+)/.exec(table);
  if (match) return match[1];
  if (lower.startsWith("table ")) {
    const rest = table.substring(6).trim();
    return rest || null;
  }
  return table;
}
function orderHeader(data: ReceiptData) {
  if (isDelivery(data)) return "DELIVERY";
  if (isQuickService(data)) return "TAKE AWAY";
  const number = tableNumber(data.tableName);
  return number ? `DINING (${number})` : "DINING";
}

/** Wallet numbers the Classic receipt has always printed. */
export const LEGACY_PAYMENT_LINES = ["0300-4153368 (EasyPaisa)", "0335-4153368 (JazzCash)"];

const grouped = (value: number) =>
  String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const money = (value: number) => `Rs. ${grouped(value)}`;
const fixed0 = (value: number) => Math.round(value).toString();
function qty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}
function itemName(item: ReceiptItem) {
  const variant = (item.variantName ?? "").trim();
  return variant ? `${item.name.trim()} (${variant})` : item.name.trim();
}
function invoiceLabel(data: ReceiptData): string | null {
  const label = (data.invoiceNumber ?? "").trim();
  if (!label) return null;
  const lower = label.toLowerCase();
  if (lower.includes("take") || lower.includes("dining") || lower.includes("delivery")) return null;
  return label;
}
function orderLine(data: ReceiptData) {
  const type = orderTypeLabel(data);
  const table = isQuickService(data) ? null : tableNumber(data.tableName);
  return table == null ? type : `${type} - Table ${table}`;
}
const guestOf = (data: ReceiptData) => (data.guestName ?? "").trim() || null;
const paymentOf = (data: ReceiptData) => (data.paymentMethod ?? "").trim() || null;
const sessionOf = (data: ReceiptData) =>
  (data.sessionLines ?? []).map((l) => l.trim()).filter(Boolean);

type Tagged = [section: string, line: ReceiptLine];

/** Collects section-tagged lines (Flutter `_Out`). */
class Out {
  readonly lines: Tagged[] = [];
  constructor(
    readonly template: ReceiptTemplateId,
    readonly s: ReceiptSettings,
    /** Composing a business copy: every block is available. */
    readonly custom: boolean,
  ) {}
  add(section: string, line: ReceiptLine) {
    this.lines.push([section, line]);
  }
  gap(line: ReceiptLine) {
    this.lines.push(["", line]);
  }
  l(key: string) {
    return this.s.labels?.[key] ?? RECEIPT_LABEL_DEFAULTS[this.template][key] ?? key;
  }
  logo(): ReceiptLine {
    return { kind: "logo", url: this.s.logoUrl ?? null, width: this.s.logoWidth ?? RECEIPT_LOGO_WIDTH.standard };
  }
}

function classic(o: Out, data: ReceiptData) {
  const s = o.s;
  const t = receiptTotals(data);
  if (s.showLogo) o.add("logo", o.logo());
  o.gap(feed());
  o.add("storeName", text(data.storeName, { align: "center", bold: true }));
  if (s.headerNote) o.add("headerNote", text(s.headerNote, { align: "center", small: true }));
  o.add("address", text(data.storeAddress, { align: "center", small: true, bold: true }));
  const wallet = s.paymentLines ?? (data.storePhone ? LEGACY_PAYMENT_LINES : []);
  for (const line of wallet) o.add("wallet", text(line, { align: "center", bold: true }));
  o.gap(divider());

  const quick = isQuickService(data);
  const header = orderHeader(data);
  o.add("banner", text(header, { align: "center", bold: true, size: 3 }));
  o.add("banner", feed());

  const guest = (data.customerName ?? "").trim();
  const upper = guest.toUpperCase();
  if (guest && upper !== "WALK-IN" && upper !== "TAKE AWAY" && upper !== "DELIVERY") {
    o.add("guest", text(guest, { align: "center", bold: true, size: 2 }));
    o.add("guest", feed());
  }
  const session = sessionOf(data);
  if (session.length) {
    for (const line of session) o.add("session", text(line, { align: "center", small: true, bold: true }));
    o.add("session", feed());
  }
  if (!quick && (data.dinePersons ?? 0) > 0) {
    o.add("guests", text(`${o.l("guests")}: ${data.dinePersons}`, { align: "center", bold: true }));
    o.add("guests", feed());
  }

  const detail = (label: string, value: string) => row([cell(label, 5), cell(`: ${value}`, 7)]);
  const rawInvoice = (data.invoiceNumber ?? "").trim();
  const invoice = rawInvoice ? invoiceLabel(data) : "Pending";
  if (invoice != null) o.add("details", detail(o.l("invoiceNo"), invoice));
  o.add("details", detail(o.l("date"), data.date));
  o.add("details", detail(o.l("orderType"), quick ? orderTypeLabel(data) : header));
  o.gap(divider());

  o.add(
    "itemsHeader",
    row([cell(o.l("itemHeader"), 6), cell(o.l("qtyHeader"), 2, "center"), cell(o.l("amountHeader"), 4, "right")], {
      bold: true,
    }),
  );
  o.add("itemsHeader", divider());
  for (const item of data.items) {
    o.add(
      "items",
      row([
        cell(`${item.name} `, 6),
        cell(`x${qty(item.quantity)}`, 2, "center"),
        cell(`Rs. ${fixed0(lineTotal(item))}`, 4, "right"),
      ]),
    );
    if ((item.discount ?? 0) > 0) o.add("items", text(`  Disc: -Rs ${fixed0(item.discount ?? 0)}`));
  }
  o.gap(divider());

  const summary = (label: string, amount: number, opt: { large?: boolean; negative?: boolean } = {}) =>
    row([cell(label, 6), cell(`${opt.negative ? "- " : ""}Rs. ${fixed0(amount)}`, 6, "right")], {
      bold: true,
      size: opt.large ? 2 : 1,
    });
  o.add("totals", summary(o.l("subtotal"), t.subtotal));
  if (t.discount > 0) o.add("totals", summary(o.l("discount"), t.discount, { negative: true }));
  if ((data.deliveryCharges ?? 0) > 0) o.add("totals", summary(o.l("delivery"), data.deliveryCharges ?? 0));
  if ((data.packagingPrice ?? 0) > 0) o.add("totals", summary(o.l("packaging"), data.packagingPrice ?? 0));
  o.gap(divider());
  o.add("total", summary(o.l("total"), t.net, { large: true }));
  o.gap(divider());

  if (s.showQr) o.add("qr", { kind: "qr", data: s.qrUrl });
  o.gap(feed());
  const notes = (data.notes ?? "").trim();
  if (notes) o.add("notes", text(notes, { align: "center" }));
  if (s.footerNote) o.add("footerNote", text(s.footerNote, { align: "center" }));
  o.gap(feed());
  o.add("footerName", text(data.storeName, { align: "center", bold: true }));
  if (s.showPoweredBy) {
    o.add("poweredBy", text("Powered by DigiNizam", { align: "center", small: true }));
    o.add("poweredBy", text("diginizam.com", { align: "center", small: true }));
  }
  o.gap(feed(2));
}

function storeHeader(o: Out, data: ReceiptData, logo: boolean) {
  const s = o.s;
  if (logo && s.showLogo) o.add("logo", o.logo());
  o.add("storeName", text(data.storeName, { align: "center", bold: true, size: 2 }));
  if (s.headerNote) o.add("headerNote", text(s.headerNote, { align: "center", small: true }));
  if (data.storeAddress.trim()) o.add("address", text(data.storeAddress.trim(), { align: "center", small: true }));
  if (data.storePhone.trim()) o.add("phone", text(`Tel: ${data.storePhone.trim()}`, { align: "center", small: true }));
}

function wallet(o: Out) {
  for (const line of o.s.paymentLines ?? []) o.add("wallet", text(line, { align: "center", small: true }));
}

function footer(o: Out, data: ReceiptData, qr: boolean) {
  const s = o.s;
  const notes = (data.notes ?? "").trim();
  if (notes) o.add("notes", text(notes, { align: "center" }));
  if (qr && s.showQr) o.add("qr", { kind: "qr", data: s.qrUrl });
  if (s.footerNote) o.add("footerNote", text(s.footerNote, { align: "center", bold: true }));
  if (s.showPoweredBy) {
    o.add("poweredBy", text("Powered by DigiNizam - diginizam.com", { align: "center", small: true }));
  }
  o.gap(feed(2));
}

function totals(o: Out, data: ReceiptData) {
  const t = receiptTotals(data);
  const line = (label: string, value: string) => row([cell(label, 6), cell(value, 6, "right")]);
  o.add("totals", line(o.l("subtotal"), money(t.subtotal)));
  if (t.discount > 0) o.add("totals", line(o.l("discount"), `-${money(t.discount)}`));
  if ((data.deliveryCharges ?? 0) > 0) o.add("totals", line(o.l("delivery"), money(data.deliveryCharges ?? 0)));
  if ((data.packagingPrice ?? 0) > 0) o.add("totals", line(o.l("packaging"), money(data.packagingPrice ?? 0)));
}

function compact(o: Out, data: ReceiptData) {
  const invoice = invoiceLabel(data);
  const guest = guestOf(data);
  const payment = paymentOf(data);
  const quick = isQuickService(data);
  storeHeader(o, data, o.custom);
  o.gap(divider());
  o.add("details", row([cell(invoice == null ? "Invoice" : `#${invoice}`, 5), cell(data.date, 7, "right")]));
  o.add(
    "details",
    row([
      cell(orderLine(data), 8),
      cell(!quick && (data.dinePersons ?? 0) > 0 ? `${o.l("guests")} ${data.dinePersons}` : "", 4, "right"),
    ]),
  );
  if (guest != null) o.add("guest", text(`${o.l("customer")}: ${guest}`));
  for (const line of sessionOf(data)) o.add("session", text(line, { small: true }));
  o.gap(divider());
  for (const item of data.items) {
    o.add("items", row([cell(`${qty(item.quantity)} x ${itemName(item)}`, 8), cell(money(gross(item)), 4, "right")]));
    if ((item.discount ?? 0) > 0) {
      o.add("items", text(`    less discount -${money(item.discount ?? 0)}`, { small: true }));
    }
  }
  o.gap(divider());
  totals(o, data);
  o.add("total", row([cell(o.l("total"), 5), cell(money(receiptTotals(data).net), 7, "right")], { bold: true, size: 2 }));
  o.gap(divider());
  if (payment != null) o.add("paidBy", text(`${o.l("paidBy")} ${payment}`, { align: "center" }));
  wallet(o);
  footer(o, data, o.custom);
}

function detailed(o: Out, data: ReceiptData) {
  const invoice = invoiceLabel(data);
  const guest = guestOf(data);
  const payment = paymentOf(data);
  const quick = isQuickService(data);
  const table = quick ? null : tableNumber(data.tableName);
  const meta = (label: string, value: string) => row([cell(label, 4), cell(`: ${value}`, 8)]);
  const t = receiptTotals(data);
  storeHeader(o, data, true);
  wallet(o);
  o.gap(divider("="));
  o.add("title", text(o.l("title"), { align: "center", bold: true }));
  o.gap(divider("="));
  o.add("details", meta(o.l("invoiceNo"), invoice ?? "Pending"));
  o.add("details", meta(o.l("date"), data.date));
  o.add("details", meta(o.l("orderType"), orderTypeLabel(data)));
  if (table != null) o.add("details", meta(o.l("table"), table));
  if (!quick && (data.dinePersons ?? 0) > 0) o.add("guests", meta(o.l("guests"), `${data.dinePersons}`));
  if (guest != null) o.add("guest", meta(o.l("customer"), guest));
  if (payment != null) o.add("paidBy", meta(o.l("paidBy"), payment));
  for (const line of sessionOf(data)) o.add("session", text(line, { small: true }));
  o.gap(divider());
  o.add(
    "itemsHeader",
    row(
      [
        cell(o.l("itemHeader"), 5),
        cell(o.l("qtyHeader"), 2, "center"),
        cell(o.l("rateHeader"), 2, "right"),
        cell(o.l("amountHeader"), 3, "right"),
      ],
      { bold: true },
    ),
  );
  o.add("itemsHeader", divider());
  for (const item of data.items) {
    o.add(
      "items",
      row([
        cell(item.name.trim(), 5),
        cell(qty(item.quantity), 2, "center"),
        cell(grouped(item.unitPrice), 2, "right"),
        cell(grouped(gross(item)), 3, "right"),
      ]),
    );
    const variant = (item.variantName ?? "").trim();
    if (variant) o.add("items", text(`  > ${variant}`, { small: true }));
    if ((item.discount ?? 0) > 0) {
      o.add("items", row([cell("  Item discount", 9), cell(`-${grouped(item.discount ?? 0)}`, 3, "right")]));
    }
  }
  o.gap(divider());
  o.add("itemCount", row([cell(o.l("itemCount"), 6), cell(`${data.items.length} / ${qty(t.quantity)}`, 6, "right")]));
  totals(o, data);
  o.gap(divider("="));
  o.add("total", row([cell(o.l("total"), 6), cell(money(t.net), 6, "right")], { bold: true, size: 2 }));
  o.gap(divider("="));
  footer(o, data, true);
}

function modern(o: Out, data: ReceiptData) {
  const invoice = invoiceLabel(data);
  const guest = guestOf(data);
  const payment = paymentOf(data);
  const quick = isQuickService(data);
  storeHeader(o, data, true);
  o.add("banner", feed());
  o.add("banner", text(` ${orderLine(data).toUpperCase()} `, { align: "center", bold: true, reverse: true }));
  o.add("banner", feed());
  if (invoice != null) {
    o.add("orderNo", text(o.l("orderNo"), { align: "center", small: true }));
    o.add("orderNo", text(invoice, { align: "center", bold: true, size: 2 }));
  }
  o.add("details", text(data.date, { align: "center", small: true }));
  if (guest != null) o.add("guest", text(guest, { align: "center", bold: true }));
  if (!quick && (data.dinePersons ?? 0) > 0) {
    o.add("guests", text(`${data.dinePersons} ${o.l("guests")}`, { align: "center" }));
  }
  for (const line of sessionOf(data)) o.add("session", text(line, { align: "center", small: true }));
  o.gap(divider("="));
  for (const item of data.items) {
    o.add("items", text(itemName(item), { bold: true }));
    o.add("items", row([cell(`  ${qty(item.quantity)} x ${grouped(item.unitPrice)}`, 7), cell(money(gross(item)), 5, "right")]));
    if ((item.discount ?? 0) > 0) {
      o.add("items", row([cell("  Discount", 7), cell(`-${money(item.discount ?? 0)}`, 5, "right")]));
    }
  }
  o.gap(divider("="));
  totals(o, data);
  o.gap(feed());
  o.add(
    "total",
    text(` ${o.l("total")} ${money(receiptTotals(data).net)} `, { align: "center", bold: true, size: 2, reverse: true }),
  );
  o.gap(feed());
  if (payment != null) o.add("paidBy", text(`${o.l("paidBy")} ${payment}`, { align: "center" }));
  wallet(o);
  footer(o, data, true);
}

function tagged(templateId: string, data: ReceiptData, settings: ReceiptSettings, custom = false): Tagged[] {
  const o = new Out(isReceiptTemplateId(templateId) ? templateId : "classic", settings, custom);
  switch (o.template) {
    case "compact":
      compact(o, data);
      break;
    case "detailed":
      detailed(o, data);
      break;
    case "modern":
      modern(o, data);
      break;
    default:
      classic(o, data);
  }
  return o.lines;
}

/** Lines of a built-in template. */
export function buildReceiptLines(
  templateId: ReceiptTemplateId,
  data: ReceiptData,
  settings: ReceiptSettings,
): ReceiptLine[] {
  return tagged(templateId, data, settings).map(([, line]) => line);
}

function restyle(line: ReceiptLine, style?: ReceiptSectionStyle): ReceiptLine {
  if (!style || (style.align == null && style.bold == null && style.size == null)) return line;
  if (line.kind === "text") {
    return {
      ...line,
      align: style.align ?? line.align,
      bold: style.bold ?? line.bold,
      size: style.size ?? line.size,
      small: style.size != null && style.size > 1 ? false : line.small,
    };
  }
  if (line.kind === "row") {
    return { ...line, bold: style.bold ?? line.bold, size: Math.min(2, Math.max(1, style.size ?? line.size)) };
  }
  return line;
}

/** Applies a copy's edits on top of its base layout (Flutter `composeCustom`). */
export function composeCustom(
  copy: CustomReceiptTemplate,
  data: ReceiptData,
  settings: ReceiptSettings,
): ReceiptDocument {
  const effective = settingsForCustom(settings, copy);
  const hidden = new Set(copy.hidden);
  const out: ReceiptLine[] = [];
  for (const [section, line] of tagged(copy.baseTemplateId, data, effective, true)) {
    if (hidden.has(section)) continue;
    const styled = restyle(line, copy.styles[section]);
    if (styled.kind === "divider") {
      if (copy.divider === "none") continue;
      // Hiding a section can leave two dividers touching; keep one.
      const previous = [...out].reverse().find((l) => l.kind !== "feed");
      if (previous?.kind === "divider") continue;
      out.push(copy.divider === "default" ? styled : { kind: "divider", char: copy.divider });
      continue;
    }
    out.push(styled);
  }
  while (out.length && out[out.length - 1].kind === "feed") out.pop();
  if (copy.feedLines > 0) out.push(feed(copy.feedLines));
  return { lines: out, paddingLeft: copy.paddingLeft, paddingRight: copy.paddingRight };
}

/** Any template id (built-in or a business copy) as a printable document. */
export function composeReceipt(templateId: string, data: ReceiptData, settings: ReceiptSettings): ReceiptDocument {
  const copy = settings.customTemplates.find((t) => t.id === templateId);
  if (copy) return composeCustom(copy, data, settings);
  return {
    lines: buildReceiptLines(isReceiptTemplateId(templateId) ? templateId : "classic", data, settings),
    paddingLeft: 0,
    paddingRight: 0,
  };
}

export type ReceiptSectionInfo = { id: string; name: string; hasText: boolean };

/** Sections a template prints with [data], in order (Flutter `sectionsOf`). */
export function receiptSectionsOf(
  baseTemplateId: ReceiptTemplateId,
  data: ReceiptData,
  settings: ReceiptSettings,
): ReceiptSectionInfo[] {
  const hasText = new Map<string, boolean>();
  for (const [section, line] of tagged(baseTemplateId, data, settings, true)) {
    if (!section) continue;
    hasText.set(section, (hasText.get(section) ?? false) || line.kind === "text");
  }
  for (const id of ["logo", "headerNote", "footerNote", "qr", "poweredBy"]) {
    if (!hasText.has(id)) hasText.set(id, id !== "logo" && id !== "qr");
  }
  const order = Object.keys(RECEIPT_SECTION_NAMES);
  return [...hasText.keys()]
    .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    .map((id) => ({ id, name: RECEIPT_SECTION_NAMES[id] ?? id, hasText: hasText.get(id)! }));
}

// ---------------------------------------------------------------------------
// Plain-text renderer (Flutter ReceiptTextRenderer) — golden-file parity.
// ---------------------------------------------------------------------------

export const RECEIPT_COLUMNS = 48;

export function wrapReceiptText(value: string, width: number): string[] {
  const indentLength = value.length - value.trimStart().length;
  const indent = " ".repeat(indentLength < width ? indentLength : 0);
  const avail = width - indent.length;
  if (avail < 1) return [value];
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (let word of words) {
    while (word.length > avail) {
      if (current) {
        lines.push(current);
        current = "";
      }
      lines.push(word.substring(0, avail));
      word = word.substring(avail);
    }
    if (!current) current = word;
    else if (current.length + 1 + word.length <= avail) current = `${current} ${word}`;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current || lines.length === 0) lines.push(current);
  return lines.map((line) => `${indent}${line}`);
}

function alignText(value: string, width: number, align: ReceiptAlign) {
  const gap = width - value.length;
  if (gap <= 0) return value;
  if (align === "left") return value + " ".repeat(gap);
  if (align === "right") return " ".repeat(gap) + value;
  const left = Math.floor(gap / 2);
  return " ".repeat(left) + value + " ".repeat(gap - left);
}

function expand(value: string, size: number) {
  if (size === 1) return value;
  const pad = " ".repeat(size - 1);
  return value
    .split("")
    .map((c) => c + pad)
    .join("");
}

const clampSize = (size: number) => Math.min(3, Math.max(1, size));

export function renderReceiptText(
  lines: ReceiptLine[],
  { width = RECEIPT_COLUMNS, placeholders = false, paddingLeft = 0, paddingRight = 0 } = {},
): string {
  const out: string[] = [];
  const pad = " ".repeat(paddingLeft);
  const inner = width - paddingLeft - paddingRight;
  for (const line of lines) {
    switch (line.kind) {
      case "text": {
        const size = clampSize(line.size);
        const eff = Math.floor(inner / size);
        for (const l of wrapReceiptText(line.text, eff)) out.push(pad + expand(alignText(l, eff, line.align), size));
        break;
      }
      case "row": {
        const size = clampSize(line.size);
        const eff = Math.floor(inner / size);
        const widths = line.cells.map((c) => Math.floor((eff * c.width) / 12));
        const columns = line.cells.map((c, i) =>
          wrapReceiptText(c.text, widths[i]).map((l) => alignText(l, widths[i], c.align)),
        );
        const height = Math.max(0, ...columns.map((c) => c.length));
        for (let i = 0; i < height; i++) {
          out.push(pad + expand(columns.map((c, j) => (i < c.length ? c[i] : " ".repeat(widths[j]))).join(""), size));
        }
        break;
      }
      case "divider":
        out.push(pad + line.char.repeat(inner));
        break;
      case "feed":
        for (let i = 0; i < line.lines; i++) out.push("");
        break;
      case "logo":
        if (placeholders) out.push(pad + alignText("[LOGO]", inner, "center"));
        break;
      case "qr":
        if (placeholders) out.push(pad + alignText(`[QR ${line.data}]`, inner, "center"));
        break;
    }
  }
  return `${out.map((l) => l.replace(/\s+$/, "")).join("\n")}\n`;
}

export function renderReceiptDocument(doc: ReceiptDocument, options: { width?: number; placeholders?: boolean } = {}) {
  return renderReceiptText(doc.lines, { ...options, paddingLeft: doc.paddingLeft, paddingRight: doc.paddingRight });
}

// ---------------------------------------------------------------------------
// Sample orders (Flutter ReceiptSampleData) for previews.
// ---------------------------------------------------------------------------

export type ReceiptSampleScenario = "dineIn" | "takeAway" | "delivery";

export const RECEIPT_SAMPLE_SCENARIOS: { id: ReceiptSampleScenario; label: string }[] = [
  { id: "dineIn", label: "Dine-in" },
  { id: "takeAway", label: "Take away" },
  { id: "delivery", label: "Delivery" },
];

const SAMPLE_ITEMS: ReceiptItem[] = [
  { name: "Chicken Karahi", variantName: "Full", quantity: 1, unitPrice: 2400 },
  { name: "Mutton Biryani", quantity: 2, unitPrice: 650, discount: 100 },
  { name: "Garlic Naan", quantity: 4, unitPrice: 80 },
  { name: "Mint Raita", quantity: 2, unitPrice: 120 },
  { name: "Soft Drink", variantName: "1.5 Ltr", quantity: 1, unitPrice: 280 },
  { name: "Kheer", quantity: 2, unitPrice: 250 },
];

export const SAMPLE_STORE = {
  name: "DigiNizam Kitchen",
  address: "Shop 12, Main Boulevard, Gulberg III, Lahore",
  phone: "042-35761234",
};

export function buildReceiptSample(
  scenario: ReceiptSampleScenario,
  store: { name?: string | null; address?: string | null; phone?: string | null } = {},
): ReceiptData {
  const base = {
    storeName: store.name?.trim() || SAMPLE_STORE.name,
    storeAddress: store.address?.trim() || SAMPLE_STORE.address,
    storePhone: store.phone?.trim() || SAMPLE_STORE.phone,
  };
  switch (scenario) {
    case "takeAway":
      return {
        ...base,
        invoiceNumber: "INV-1043",
        date: "18 Oct 2026, 09:10 PM",
        orderType: "Take Away",
        tableName: "Take Away",
        customerName: "Take Away",
        paymentMethod: "Card",
        items: SAMPLE_ITEMS.slice(0, 3),
        packagingPrice: 50,
      };
    case "delivery":
      return {
        ...base,
        invoiceNumber: "INV-1044",
        date: "18 Oct 2026, 09:32 PM",
        orderType: "Delivery",
        tableName: "Delivery",
        customerName: "Sana Malik",
        guestName: "Sana Malik",
        paymentMethod: "JazzCash",
        items: SAMPLE_ITEMS.slice(1, 5),
        deliveryCharges: 150,
        packagingPrice: 50,
      };
    default:
      return {
        ...base,
        invoiceNumber: "INV-1042",
        date: "18 Oct 2026, 08:45 PM",
        orderType: "Dine-In",
        tableName: "Table 5",
        customerName: "Ahmed Raza",
        guestName: "Ahmed Raza",
        dinePersons: 4,
        paymentMethod: "Cash",
        items: SAMPLE_ITEMS,
      };
  }
}
