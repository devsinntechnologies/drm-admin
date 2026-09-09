export const CRM_FIELD_TYPES = [
  "text",
  "textarea",
  "number",
  "currency",
  "boolean",
  "select",
  "multiselect",
  "date",
  "url",
  "email",
  "phone",
] as const;

export type CrmFieldType = (typeof CRM_FIELD_TYPES)[number];

export const CRM_MODULES = [
  "products",
  "categories",
  "customers",
  "tables",
  "orders",
  "staff",
  "suppliers",
] as const;

export type CrmModuleId = (typeof CRM_MODULES)[number];

export type CrmFieldOption = {
  value: string;
  label: string;
};

export type PublicCrmField = {
  key: string;
  label: string;
  type: CrmFieldType;
  required: boolean;
  options: CrmFieldOption[];
  placeholder: string;
  helpText: string;
  defaultValue: unknown;
  sortOrder: number;
  showOnForm: boolean;
  showOnCard: boolean;
  showOnDetail: boolean;
};

export type CrmCardField = {
  source: "builtin" | "custom";
  key: string;
};

export type CrmCardLayout = {
  showImage: boolean;
  fields: CrmCardField[];
};

export type CrmModuleSchema = {
  moduleId: CrmModuleId;
  fields: PublicCrmField[];
  cardLayout: CrmCardLayout;
};

export type CrmModuleInfo = {
  moduleId: CrmModuleId;
  label: string;
  builtinCardFields: CrmCardField[];
  recordValuesEnabled: boolean;
};

export const CRM_MODULE_LABELS: Record<CrmModuleId, string> = {
  products: "Products",
  categories: "Categories",
  customers: "Customers",
  tables: "Tables",
  orders: "Orders",
  staff: "Staff",
  suppliers: "Suppliers",
};

export const CRM_FIELD_TYPE_LABELS: Record<CrmFieldType, string> = {
  text: "Text",
  textarea: "Long text",
  number: "Number",
  currency: "Currency",
  boolean: "Yes / No",
  select: "Dropdown",
  multiselect: "Multi-select",
  date: "Date",
  url: "URL",
  email: "Email",
  phone: "Phone",
};

export const AVAILABLE_BUILTIN_CARD_FIELDS: Record<CrmModuleId, CrmCardField[]> = {
  products: [
    { source: "builtin", key: "name" },
    { source: "builtin", key: "price" },
    { source: "builtin", key: "variants" },
    { source: "builtin", key: "category" },
    { source: "builtin", key: "stock" },
    { source: "builtin", key: "barcode" },
  ],
  categories: [
    { source: "builtin", key: "name" },
    { source: "builtin", key: "sortOrder" },
  ],
  customers: [{ source: "builtin", key: "name" }],
  tables: [{ source: "builtin", key: "name" }],
  orders: [{ source: "builtin", key: "status" }],
  staff: [{ source: "builtin", key: "name" }],
  suppliers: [{ source: "builtin", key: "name" }],
};

export const BUILTIN_CARD_FIELD_LABELS: Record<string, Record<string, string>> = {
  products: {
    name: "Name",
    price: "Price",
    variants: "Variants",
    category: "Category",
    stock: "Stock",
    barcode: "Barcode",
  },
  categories: {
    name: "Name",
    sortOrder: "Sort order",
  },
  customers: { name: "Name" },
  tables: { name: "Name" },
  orders: { status: "Status" },
  staff: { name: "Name" },
  suppliers: { name: "Name" },
};

export function slugifyFieldKey(label: string, fallback = "field"): string {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return slug || fallback;
}

export function defaultCardLayout(moduleId: CrmModuleId): CrmCardLayout {
  if (moduleId === "products") {
    return {
      showImage: true,
      fields: [
        { source: "builtin", key: "name" },
        { source: "builtin", key: "price" },
        { source: "builtin", key: "variants" },
      ],
    };
  }
  if (moduleId === "categories") {
    return {
      showImage: true,
      fields: [
        { source: "builtin", key: "name" },
        { source: "builtin", key: "sortOrder" },
      ],
    };
  }
  return {
    showImage: false,
    fields: [{ source: "builtin", key: "name" }],
  };
}

export function emptyCustomFieldValues(fields: PublicCrmField[]): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
      values[field.key] = field.defaultValue;
    } else if (field.type === "boolean") {
      values[field.key] = false;
    } else if (field.type === "multiselect") {
      values[field.key] = [];
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

export function serializeCustomFields(
  fields: PublicCrmField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[field.key] = value;
  }
  return out;
}

export function formatCrmValue(field: PublicCrmField | undefined, value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    return value
      .map((item) => field?.options.find((option) => option.value === String(item))?.label ?? String(item))
      .filter(Boolean)
      .join(", ");
  }
  if (field?.type === "select") {
    return field.options.find((option) => option.value === String(value))?.label ?? String(value);
  }
  return String(value);
}

export function formFields(schema: CrmModuleSchema | null | undefined): PublicCrmField[] {
  return (schema?.fields ?? []).filter((field) => field.showOnForm !== false);
}

export function cardLayoutOrDefault(schema: CrmModuleSchema | null | undefined, moduleId: CrmModuleId): CrmCardLayout {
  return schema?.cardLayout ?? defaultCardLayout(moduleId);
}
