/** Short purpose copy for portal tooltips. Keep one idea per string. */

export const PORTAL_NAV_TIPS: Record<string, string> = {
  dashboard: "Home overview: today’s sales, stock warnings, and what needs attention first.",
  businesses: "Every business on the platform. Open one to manage its workspace.",
  subscriptions: "Plans, renewals, and billing for each business.",
  "industry-templates": "Starter layouts for restaurants, retail, pharmacy, and other industries.",
  "app-updates": "Desktop and Android app versions that devices should install.",
  "action-logs": "Who changed what in the platform — for support and audit.",
  products: "The sellable catalog. Add items, prices, stock, and images used at the till.",
  menu: "Menu items and prices shown on POS, kitchen, and invoices.",
  categories: "Groups such as Starters or Tablets so staff can find items faster.",
  "public-data": "What customers see on the public website catalog.",
  website: "Public website pages, branding, and what visitors can browse.",
  software: "Turn mobile screens on or off, set roles, FBR, custom fields, and app look.",
  tables: "Floor tables for restaurants. Used for seating, orders, and QR codes.",
  invoices: "Paid and unpaid bills. Print, review, or delete a sale from here.",
  sales: "Sale history and receipts. Same records the mobile Invoices tab uses.",
  orders: "Live tickets: take a new sale or watch orders already in the kitchen.",
  pos: "Point of sale — search items, add to cart, and complete payment.",
  kitchen: "Kitchen display: tickets move from new to cooking to ready.",
  users: "People who can sign in: waiters, kitchen, cashiers, and managers.",
  staff: "Employee logins and roles for this business.",
  reports: "Sales totals and top items for a date range you choose.",
  settings: "Business profile, branding, and workspace options.",
  inventory: "On-hand stock, adjustments, and low-stock alerts.",
  customers: "Customer profiles, contact details, and purchase history.",
  suppliers: "Vendors you buy from, with tax IDs and payment terms.",
};

export const FBR_TIPS = {
  enabled: "When on, paid invoices are also sent to FBR in the background. A sale at the till is never blocked if FBR is slow or down.",
  environment: "Sandbox is for testing with FBR. Switch to Production only after FBR issues a live token.",
  sellerNtn: "Your 7-digit NTN or 13-digit CNIC, exactly as registered on IRIS.",
  sellerName: "Legal seller name FBR expects on digital invoices.",
  sellerProvince: "Province of the registered business address on IRIS.",
  sellerAddress: "Registered business address sent with each FBR invoice.",
  sandboxToken: "Bearer token from IRIS sandbox. It is stored on the server and never shown again.",
  productionToken: "Live IRIS token. Leave blank to keep the saved token. Never pasted into the mobile app.",
  hsCode: "Default HS / PCT code used when a product has none of its own.",
  taxRate: "Default sales-tax rate sent to FBR, for example 18%.",
  saleType: "FBR sale-type wording, such as goods at standard rate.",
  uom: "Default unit of measure, such as pieces or kilograms.",
  buyerType: "Walk-in customers are usually Unregistered unless they give an NTN.",
  buyerName: "Name printed for cash / walk-in buyers when no customer is selected.",
  buyerProvince: "Province for walk-in buyers. Leave blank to reuse the seller province.",
  buyerAddress: "Address for walk-in buyers on the FBR invoice.",
  scenarioId: "Sandbox-only scenario code from FBR docs (for example SN001).",
  furtherTax: "Adds further tax when the buyer is not on the Active Taxpayer List.",
  apiCalls: "How many times this business called FBR (validate or post).",
  apiSuccess: "Calls FBR accepted.",
  apiFailed: "Calls that failed. Open the row to read the error, then retry the invoice.",
  posted: "Invoices FBR accepted. DigiNizam also keeps its own copy.",
  pending: "Paid invoices waiting to post, or mid-retry.",
  failedInvoices: "Paid invoices that did not post. Retry does not change the POS sale.",
};

export const CRM_TIPS = {
  module: "Pick the record type these extra fields belong to. Products and categories already save values on the form.",
  label: "The name staff see on the form, for example Spice level or Expiry.",
  type: "How the field is entered: short text, number, yes/no, dropdown, date, and so on.",
  placeholder: "Grey hint inside the empty box, such as Type a batch number.",
  helpText: "Extra sentence shown under the field so staff know what to type.",
  options: "One choice per line. Use value|Label if the stored value should differ from the label.",
  required: "Staff must fill this before they can save the record.",
  showOnForm: "Show this field when adding or editing a record.",
  showOnDetail: "Show this field on the record’s detail view.",
  showOnCard: "Also list this field on catalog cards (controlled in Card layout below).",
  cardLayout: "Choose which built-in and custom values appear on list cards, and in what order.",
  showImage: "Show the photo on catalog cards. Turn off for a text-only list.",
};

export const CRM_TYPE_TIPS: Record<string, string> = {
  text: "One short line of text.",
  textarea: "A longer note, such as cooking instructions.",
  number: "Digits only, such as weight or count.",
  currency: "A money amount in the business currency.",
  boolean: "A yes / no checkbox.",
  select: "Pick one option from a list you define.",
  multiselect: "Pick several options from a list you define.",
  date: "A calendar date.",
  url: "A web link.",
  email: "An email address.",
  phone: "A phone number.",
};

export const PRODUCT_TIPS = {
  category: "Which group this item belongs to. Staff filter the catalog by category.",
  addCategory: "Create a category here without leaving the product form. It is selected automatically.",
  name: "The name shown on POS, kitchen tickets, and invoices.",
  price: "Selling price charged to the customer. With variants, set price on each variant instead.",
  stock: "How many units you have now. Used when Track inventory is on.",
  cost: "What you paid for the item. Used for profit reports. Required for stocked businesses.",
  trackStock: "When on, each sale reduces this item’s stock count.",
  image: "Photo on catalog cards and the POS picker. Optional but easier for staff.",
  variantName: "A size, colour, or pack, such as Large or 500ml. Each variant has its own price and stock.",
  variantPrice: "Selling price for this variant only.",
  variantCost: "Your cost for this variant. Required when inventory is tracked.",
  variantStock: "Units on hand for this variant.",
  barcode: "Scan or type the barcode so POS can find this item with a gun or camera.",
};

export const CATEGORY_TIPS = {
  name: "Group name such as Starters, Drinks, or Tablets. Shown as a filter chip on POS.",
  sort: "Lower numbers appear first in lists and on the POS category bar.",
  image: "Optional picture for the category card in the portal and later on mobile.",
};

export const TABLE_TIPS = {
  name: "Table name or number as waiters know it, for example T-12 or Patio 3.",
  capacity: "How many guests this table seats. Used when assigning orders.",
  image: "Optional floor photo or icon so staff recognise the table.",
  qr: "Print this QR so guests can open the table’s ordering link.",
};

export const INVOICE_TIPS = {
  view: "Open the full bill: items, totals, and payment status.",
  print: "Send this invoice to a connected printer. Disabled if Software Control turns printing off.",
  delete: "Remove this invoice. Use only for mistakes — this cannot be undone from here.",
  from: "Start of the report period (inclusive).",
  to: "End of the report period (inclusive).",
};

export const SOFTWARE_TIPS = {
  modules: "Each checked module appears as a tab or tool on the phone and desktop app. Dashboard cannot be turned off.",
  offline: "When on, tills keep taking orders without internet, then upload the queue when the line is back.",
  theme: "Colours for buttons and menus in the portal and the mobile app.",
  mobileHeader: "The branded bar at the top of the app (logo, live badge, logout).",
  showLogout: "Show the logout button on the app header.",
  showOnline: "Show whether this device is live (realtime) and when it last synced data.",
  logoPlate: "Background colour behind the logo in the app header.",
  navigation: "Order and names of bottom tabs on the phone. Drag to reorder.",
  navVisible: "Hide this tab without deleting the module.",
  allowCreateProducts: "Staff can add new products from the app.",
  allowEditProducts: "Staff can change name, price, and stock from the app.",
  productLayout: "Grid shows photos; list is a compact name-and-price view.",
  barcodeOnProduct: "Show a barcode box (USB gun or camera) on the product form.",
  people: "Create logins for waiters, kitchen, cashiers, and managers of this business.",
  export: "Download a ZIP backup of this business, or restore one. Import adds records; it does not wipe existing ones.",
  profile: "Legal name, plan, and contact details. Ask support if these need to change.",
  sync: "Which phones and desktops are live right now, and whether their data has finished syncing.",
  appVersion: "Which Windows, macOS, or Android build this business should install.",
  printers: "Receipt and kitchen printer IPs. The POS on the shop network reports whether they are reachable.",
};

export const STAFF_TIPS = {
  name: "Display name on the team list and on tickets they handle.",
  password: "The password they type at sign-in. Minimum 6 characters. You can generate one instead.",
  email: "Used to sign in. Leave blank to auto-create an email from their name.",
  role: "What they are allowed to open: waiter, kitchen, cashier, manager, and so on.",
  issuePassword: "Create a new password without locking them out of their current one until they use it.",
};

export const PHARMACY_TIPS = {
  generic: "Official generic name, for example Paracetamol.",
  salt: "Active composition printed on the pack.",
  barcode: "GTIN / barcode for scanning at the till.",
  hsn: "Product or HSN / PCT code used for tax and FBR.",
  tax: "GST or VAT percent charged on this medicine.",
  reorder: "Alert when stock falls to this quantity.",
  schedule: "OTC, POM, or controlled-drug schedule for this market.",
  rx: "Pharmacist must see a prescription before sale.",
  strip: "How many tablets are in one strip.",
  box: "How many strips are in one box.",
};

export const LOGIN_TIPS = {
  email: "The work email created for your login. The portal opens the matching business automatically.",
  password: "Your account password. Ask an admin if you need a new one issued.",
};

export function navTip(key: string, fallback?: string) {
  return PORTAL_NAV_TIPS[key] ?? fallback ?? "";
}
