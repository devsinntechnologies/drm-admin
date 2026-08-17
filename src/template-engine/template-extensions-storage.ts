import type { TemplateConfigExtensions } from "@/templates/types";

const STORAGE_KEY = "diginizam_template_extensions";

function readAll(): Record<string, TemplateConfigExtensions> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TemplateConfigExtensions>) : {};
  } catch {
    return {};
  }
}

export function saveTemplateExtensions(configId: string, extensions: TemplateConfigExtensions) {
  if (typeof window === "undefined") return;
  const all = readAll();
  all[configId] = extensions;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadTemplateExtensions(configId: string): TemplateConfigExtensions | undefined {
  return readAll()[configId];
}

export const DEFAULT_BUSINESS_PROFILE_FIELDS: TemplateConfigExtensions["businessProfileFields"] = [
  { id: "businessName", label: "Business Name", type: "text", required: true, enabled: true },
  { id: "logo", label: "Business Logo", type: "text", required: false, enabled: true },
  { id: "email", label: "Business Email", type: "email", required: true, enabled: true },
  { id: "phone", label: "Business Phone", type: "phone", required: true, enabled: true },
  { id: "address", label: "Business Address", type: "textarea", required: true, enabled: true },
  { id: "website", label: "Website", type: "url", required: false, enabled: true },
  { id: "taxNumber", label: "Tax Number", type: "text", required: false, enabled: false },
  { id: "registrationNumber", label: "Registration Number", type: "text", required: false, enabled: false },
];

export const DEFAULT_DASHBOARD_WIDGETS: NonNullable<TemplateConfigExtensions["dashboardWidgets"]> = [
  "order-status-chart",
  "statistics-row",
  "top-products",
  "recent-orders",
];

export function createDefaultExtensions(industryName: string): TemplateConfigExtensions {
  return {
    templateName: `${industryName} Template`,
    templateDescription: `Default workspace template for ${industryName.toLowerCase()} businesses.`,
    industryStatus: "active",
    accentColor: "#0050F8",
    backgroundColor: "#f1f5f9",
    typography: "Poppins",
    sidebarStyle: "default",
    headerStyle: "default",
    borderRadius: "md",
    dashboardWidgets: [...DEFAULT_DASHBOARD_WIDGETS],
    businessProfileFields: DEFAULT_BUSINESS_PROFILE_FIELDS?.map((field) => ({ ...field })),
    customFormFields: [],
    rolePermissions: {},
    timezone: "Asia/Karachi",
    language: "en",
  };
}
